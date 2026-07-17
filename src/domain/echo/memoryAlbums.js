export function buildMemoryAlbums(echoes) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  const thisWeek = echoes.filter((echo) => new Date(echo.capturedAt) >= weekStart);
  const withPlaces = echoes.filter((echo) => echo.location?.latitude && echo.location?.longitude);
  const withMedia = echoes.filter((echo) => echo.photos.length > 0);

  return [
    { key: 'recent', title: 'Recent', icon: 'time-outline', items: echoes },
    { key: 'week', title: 'This Week', icon: 'calendar-outline', items: thisWeek },
    { key: 'places', title: 'Places', icon: 'map-outline', items: withPlaces },
    { key: 'media', title: 'Media', icon: 'images-outline', items: withMedia },
  ];
}

export function getMemoryTitle(echo) {
  return echo.note?.trim() || echo.aiMetadata?.title || echo.location?.name || 'Saved memory';
}

export function formatMemoryDate(value) {
  if (!value) return 'Unknown time';

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}
