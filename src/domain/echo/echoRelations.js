export function getRelatedEchoes(echoes, echo) {
  if (!echo) return [];

  return echoes.filter(
    (candidate) =>
      candidate.id !== echo.id &&
      candidate.tags.some((tag) => echo.tags.includes(tag))
  );
}
