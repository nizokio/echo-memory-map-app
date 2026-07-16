const toDateOrNull = (value) => (value ? new Date(value).toISOString() : null);

export function mapEchoRecord(record, photoUrls = new Map()) {
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
    aiMetadata: record.echo_ai_metadata
      ? {
          title: record.echo_ai_metadata.title,
          summary: record.echo_ai_metadata.summary,
          caption: record.echo_ai_metadata.caption,
        }
      : null,
  };
}
