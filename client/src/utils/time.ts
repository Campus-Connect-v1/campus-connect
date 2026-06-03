/** Compact relative time, e.g. "just now", "5m", "3h", "2d", or a date. */
export function timeAgo(input: string | number | Date): string {
  const then = new Date(input).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));

  if (seconds < 45) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;

  return new Date(input).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** "Tue, Mar 4 · 2:30 PM" — a friendly absolute date + start time. */
export function formatEventDate(input: string | number | Date): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

/** Calendar parts for a compact date chip, e.g. { month: "MAR", day: "04" }. */
export function dateChip(input: string | number | Date): {
  month: string;
  day: string;
} {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return { month: "", day: "" };
  return {
    month: d.toLocaleDateString(undefined, { month: "short" }).toUpperCase(),
    day: String(d.getDate()).padStart(2, "0"),
  };
}
