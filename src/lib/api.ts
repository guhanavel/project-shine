// Base URL for the FastAPI backend. Set VITE_API_URL in .env.local
// (e.g. VITE_API_URL=http://localhost:8000). Falls back to same-origin
// so the app keeps working with the built-in TanStack /api routes.
const RAW = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
const BASE = RAW.replace(/\/$/, "");

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE}${p}`;
}
