export function formatTimeAgo(date: Date | string | number): string {
  const createdAt = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears >= 1) return `${diffYears}y`;
  if (diffMonths >= 1) return `${diffMonths}mo`;
  if (diffWeeks >= 1) return `${diffWeeks}w`;
  if (diffDays >= 1) return `${diffDays}d`;
  if (diffHours >= 1) return `${diffHours}h`;
  if (diffMinutes >= 1) return `${diffMinutes}m`;
  return "Just now";
}
