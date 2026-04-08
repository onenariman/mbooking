/** База Nest для server-side fetch (Server Actions, Route Handlers). Docker: http://backend:4000 */
export function getNestServerBaseUrl(): string | null {
  const raw =
    process.env.NEST_API_INTERNAL_URL?.trim() ||
    process.env.NEXT_PUBLIC_NEST_API_URL?.trim();
  if (raw) {
    return raw.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:4000";
  }
  return null;
}
