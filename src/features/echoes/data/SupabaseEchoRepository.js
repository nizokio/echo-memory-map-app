import { isSupabaseConfigured, supabase } from '../../../infrastructure/supabase/client';
import { mapEchoRecord } from '../../../domain/echo/echoMapper';
import { EchoRepository } from './EchoRepository';

const PHOTO_BUCKET = 'echo-photos';
const AUDIO_BUCKET = 'echo-audio';
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
        echo_audio_notes (id, storage_path, duration_ms, sort_order, captured_at),
        echo_ai_metadata (title, summary, caption),
        echo_tags (tag:tags (name))
      `)
      .eq('user_id', userData.user.id)
      .order('captured_at', { ascending: false });

    if (error) throw error;

    const photoUrls = await this.createPhotoUrlMap(data || []);
    const audioUrls = await this.createAudioUrlMap(data || []);
    return (data || []).map((record) => mapEchoRecord(record, photoUrls, audioUrls));
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

  async createAudioUrlMap(records) {
    const paths = records.flatMap((record) =>
      (record.echo_audio_notes || []).map((audio) => audio.storage_path)
    );
    if (paths.length === 0) return new Map();

    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

    if (error) throw error;
    return new Map((data || []).map((item) => [item.path, item.signedUrl]));
  }

  async createEcho({ note, location, capturedAt, photo, photos }) {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');
    const echoPhotos = photos?.length ? photos : photo ? [photo] : [];
    if (echoPhotos.length === 0) throw new Error('Add at least one photo before saving.');

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) throw new Error('Sign in before saving a memory.');

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

    const uploadedPaths = [];
    try {
      const uploadedPhotos = [];
      for (let index = 0; index < echoPhotos.length; index += 1) {
        const nextPhoto = echoPhotos[index];
        const storagePath = await this.uploadEchoPhoto({
          userId: userData.user.id,
          echoId: echo.id,
          photo: nextPhoto,
          index,
        });
        uploadedPaths.push(storagePath);

        uploadedPhotos.push({
          echo_id: echo.id,
          storage_path: storagePath,
          width: nextPhoto.width || null,
          height: nextPhoto.height || null,
          sort_order: index,
          captured_at: capturedAt,
        });
      }

      const { error: photoError } = await supabase.from('echo_photos').insert(uploadedPhotos);

      if (photoError) throw photoError;
      return echo.id;
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from(PHOTO_BUCKET).remove(uploadedPaths);
      }
      await supabase.from('echoes').delete().eq('id', echo.id);
      throw error;
    }
  }

  async captionEcho(echoId) {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');

    const { error } = await supabase.functions.invoke('caption-echo', {
      body: { echoId },
    });

    if (error) throw error;
  }

  async addPhotosToEcho({ echoId, photos, capturedAt }) {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');
    if (!photos?.length) throw new Error('Choose at least one photo.');

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) throw new Error('Sign in before adding photos.');

    const { data: existingPhotos, error: existingError } = await supabase
      .from('echo_photos')
      .select('sort_order')
      .eq('echo_id', echoId)
      .order('sort_order', { ascending: false })
      .limit(1);

    if (existingError) throw existingError;

    const startIndex = (existingPhotos?.[0]?.sort_order ?? -1) + 1;
    const uploadedPaths = [];

    try {
      const uploadedPhotos = [];
      for (let index = 0; index < photos.length; index += 1) {
        const nextPhoto = photos[index];
        const sortOrder = startIndex + index;
        const storagePath = await this.uploadEchoPhoto({
          userId: userData.user.id,
          echoId,
          photo: nextPhoto,
          index: sortOrder,
        });
        uploadedPaths.push(storagePath);

        uploadedPhotos.push({
          echo_id: echoId,
          storage_path: storagePath,
          width: nextPhoto.width || null,
          height: nextPhoto.height || null,
          sort_order: sortOrder,
          captured_at: capturedAt,
        });
      }

      const { error: photoError } = await supabase.from('echo_photos').insert(uploadedPhotos);
      if (photoError) throw photoError;
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from(PHOTO_BUCKET).remove(uploadedPaths);
      }
      throw error;
    }
  }

  async addAudioNoteToEcho({ echoId, recordingUri, durationMs, capturedAt }) {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');
    if (!recordingUri) throw new Error('Record audio before saving.');

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) throw new Error('Sign in before adding audio.');

    const { data: existingAudio, error: existingError } = await supabase
      .from('echo_audio_notes')
      .select('sort_order')
      .eq('echo_id', echoId)
      .order('sort_order', { ascending: false })
      .limit(1);

    if (existingError) throw existingError;

    const sortOrder = (existingAudio?.[0]?.sort_order ?? -1) + 1;
    const storagePath = await this.uploadEchoAudio({
      userId: userData.user.id,
      echoId,
      recordingUri,
      index: sortOrder,
    });

    try {
      const { error } = await supabase.from('echo_audio_notes').insert({
        echo_id: echoId,
        storage_path: storagePath,
        duration_ms: durationMs || null,
        sort_order: sortOrder,
        captured_at: capturedAt,
      });

      if (error) throw error;
    } catch (error) {
      await supabase.storage.from(AUDIO_BUCKET).remove([storagePath]);
      throw error;
    }
  }

  async deleteEcho(echoId) {
    if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');

    const { data: photos, error: photoError } = await supabase
      .from('echo_photos')
      .select('storage_path')
      .eq('echo_id', echoId);

    if (photoError) throw photoError;

    const paths = (photos || []).map((photo) => photo.storage_path).filter(Boolean);
    if (paths.length > 0) {
      const { error: storageError } = await supabase.storage.from(PHOTO_BUCKET).remove(paths);
      if (storageError) throw storageError;
    }

    const { data: audioNotes, error: audioError } = await supabase
      .from('echo_audio_notes')
      .select('storage_path')
      .eq('echo_id', echoId);

    if (audioError) throw audioError;

    const audioPaths = (audioNotes || []).map((audio) => audio.storage_path).filter(Boolean);
    if (audioPaths.length > 0) {
      const { error: storageError } = await supabase.storage.from(AUDIO_BUCKET).remove(audioPaths);
      if (storageError) throw storageError;
    }

    const { error } = await supabase.from('echoes').delete().eq('id', echoId);
    if (error) throw error;
  }

  async uploadEchoAudio({ userId, echoId, recordingUri, index = 0 }) {
    const fileExtension = this.getAudioExtension(recordingUri);
    const storagePath = `${userId}/${echoId}/voice-${index}.${fileExtension}`;
    const response = await fetch(recordingUri);
    const fileData = await response.arrayBuffer();

    const { error } = await supabase.storage.from(AUDIO_BUCKET).upload(storagePath, fileData, {
      contentType: this.getAudioContentType(fileExtension),
      upsert: false,
    });

    if (error) throw error;
    return storagePath;
  }

  async uploadEchoPhoto({ userId, echoId, photo, index = 0 }) {
    const fileExtension = this.getPhotoExtension(photo);
    const storagePath = `${userId}/${echoId}/photo-${index}.${fileExtension}`;
    const response = await fetch(photo.uri);
    const fileData = await response.arrayBuffer();

    const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(storagePath, fileData, {
      contentType: this.getPhotoContentType(photo, fileExtension),
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

  getPhotoContentType(photo, fileExtension) {
    if (photo.mimeType) return photo.mimeType;
    if (fileExtension === 'jpg' || fileExtension === 'jpeg') return 'image/jpeg';
    return `image/${fileExtension}`;
  }

  getAudioExtension(recordingUri) {
    const extension = recordingUri.split('?')[0].split('.').pop()?.toLowerCase();
    if (extension) return extension;
    return 'm4a';
  }

  getAudioContentType(fileExtension) {
    if (fileExtension === 'm4a' || fileExtension === 'mp4') return 'audio/mp4';
    if (fileExtension === 'mp3') return 'audio/mpeg';
    if (fileExtension === 'aac') return 'audio/aac';
    if (fileExtension === 'wav') return 'audio/wav';
    if (fileExtension === 'webm') return 'audio/webm';
    if (fileExtension === '3gp') return 'audio/3gpp';
    return 'audio/mp4';
  }
}
