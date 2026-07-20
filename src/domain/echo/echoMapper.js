const toDateOrNull = (value) => (value ? new Date(value).toISOString() : null);
const firstRelation = (value) => (Array.isArray(value) ? value[0] : value);

export function mapEchoRecord(record, photoUrls = new Map(), audioUrls = new Map()) {
  const aiMetadata = firstRelation(record.echo_ai_metadata);

  const photos = [...(record.echo_photos || [])]
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((photo) => ({
      id: photo.id,
      storagePath: photo.storage_path,
      uri: photoUrls.get(photo.storage_path) || null,
      width: photo.width,
      height: photo.height,
      sortOrder: photo.sort_order,
      capturedAt: toDateOrNull(photo.captured_at),
    }));
  const audioNotes = [...(record.echo_audio_notes || [])]
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((audio) => ({
      id: audio.id,
      storagePath: audio.storage_path,
      uri: audioUrls.get(audio.storage_path) || null,
      durationMs: audio.duration_ms,
      sortOrder: audio.sort_order,
      capturedAt: toDateOrNull(audio.captured_at),
    }));

  return {
    id: record.id,
    userId: record.user_id,
    location: {
      latitude: Number(record.latitude),
      longitude: Number(record.longitude),
      name: record.location_name,
      locality: record.locality,
    },
    note: record.note,
    capturedAt: toDateOrNull(record.captured_at),
    createdAt: toDateOrNull(record.created_at),
    updatedAt: toDateOrNull(record.updated_at),
    visibility: record.visibility,
    tags: (record.echo_tags || []).map((entry) => entry.tag?.name).filter(Boolean),
    photos,
    audioNotes,
    aiMetadata: aiMetadata
      ? {
          title: aiMetadata.title,
          summary: aiMetadata.summary,
          caption: aiMetadata.caption,
        }
      : null,
  };
}
