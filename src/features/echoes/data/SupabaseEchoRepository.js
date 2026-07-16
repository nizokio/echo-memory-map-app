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
}
