import { isSupabaseConfigured, supabase } from '../../../infrastructure/supabase/client';
import { mapEchoRecord } from '../../../domain/echo/echoMapper';
import { EchoRepository } from './EchoRepository';

const PHOTO_BUCKET = 'echo-photos';
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export class SupabaseEchoRepository extends EchoRepository {
  async listForCurrentUser() {
    if (!isSupabaseConfigured || !supabase) return [];

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) return [];

    const { data, error } = await supabase
      .from('echoes')
      .select(`
        id,
        user_id,
        latitude,
        longitude,
        location_name,
        locality,
        note,
        captured_at,
        created_at,
        updated_at,
        visibility,
        echo_photos (id, storage_path, width, height, sort_order, captured_at),
        echo_ai_metadata (title, summary, caption),
        echo_tags (tag:tags (name))
      `)
      .eq('user_id', userData.user.id)
      .order('captured_at', { ascending: false });

    if (error) throw error;

    const photoUrls = await this.createPhotoUrlMap(data || []);
    return (data || []).map((record) => mapEchoRecord(record, photoUrls));
  }

  async createPhotoUrlMap(records) {
    const paths = records.flatMap((record) =>
      (record.echo_photos || []).map((photo) => photo.storage_path)
    );
    if (paths.length === 0) return new Map();

    const { data, error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

    if (error) throw error;
    return new Map((data || []).map((item) => [item.path, item.signedUrl]));
  }

  async createEcho({ note, location, capturedAt, photo }) {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) throw new Error('Sign in before saving an Echo.');

    const { data: echo, error: echoError } = await supabase
      .from('echoes')
      .insert({
        user_id: userData.user.id,
        latitude: location.latitude,
        longitude: location.longitude,
        note: note.trim(),
        captured_at: capturedAt,
        visibility: 'private',
      })
      .select('id')
      .single();

    if (echoError) throw echoError;

    const storagePath = await this.uploadEchoPhoto({
      userId: userData.user.id,
      echoId: echo.id,
      photo,
    });

    const { error: photoError } = await supabase.from('echo_photos').insert({
      echo_id: echo.id,
      storage_path: storagePath,
      width: photo.width || null,
      height: photo.height || null,
      sort_order: 0,
      captured_at: capturedAt,
    });

    if (photoError) throw photoError;
    return echo.id;
  }

  async uploadEchoPhoto({ userId, echoId, photo }) {
    const fileExtension = this.getPhotoExtension(photo);
    const storagePath = `${userId}/${echoId}/photo.${fileExtension}`;
    const response = await fetch(photo.uri);
    const fileData = await response.arrayBuffer();

    const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(storagePath, fileData, {
      contentType: photo.mimeType || `image/${fileExtension}`,
      upsert: false,
    });

    if (error) throw error;
    return storagePath;
  }

  getPhotoExtension(photo) {
    const fromName = photo.fileName?.split('.').pop()?.toLowerCase();
    if (fromName) return fromName === 'jpg' ? 'jpeg' : fromName;

    const fromMime = photo.mimeType?.split('/').pop()?.toLowerCase();
    if (fromMime) return fromMime === 'jpg' ? 'jpeg' : fromMime;

    return 'jpeg';
  }
}
