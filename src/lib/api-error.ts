/** Safe error message for API responses (no provider internals). */
export function publicApiError(e: unknown, fallback = "Something went wrong. Try again."): string {
  if (!(e instanceof Error)) return fallback;
  const m = e.message.toLowerCase();
  if (m.includes("rate") || m.includes("quota") || m.includes("limit")) return e.message;
  if (m.includes("not signed in") || m.includes("unauthorized")) return "Not signed in.";
  return fallback;
}
