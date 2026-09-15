export function snippet(text: string | null | undefined, maxLength = 140): string {
  if (!text) return "";
  const firstLines = text.split("\n").slice(0, 2).join(" ").trim();
  if (firstLines.length <= maxLength) return firstLines;
  return `${firstLines.slice(0, maxLength).trimEnd()}...`;
}
