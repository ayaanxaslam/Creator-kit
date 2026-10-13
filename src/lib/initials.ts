/** "Ayaan Aslam" → "AA", "ayaan" → "A"; falls back to the email's first letter. */
export function initialsFor(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (email.trim()[0] ?? "?").toUpperCase();
}
