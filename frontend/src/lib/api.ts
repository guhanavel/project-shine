// Base URL for the FastAPI backend. Set VITE_API_URL in .env.local
// (e.g. VITE_API_URL=http://localhost:8000). Falls back to same-origin
// so the app keeps working with the built-in TanStack /api routes.
const RAW = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
const BASE = RAW.replace(/\/$/, "");

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE}${p}`;
}

export async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = apiUrl(endpoint);
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`API Error ${res.status}: ${errorBody}`);
  }

  return res.json() as Promise<T>;
}

export const checkBackendHealth = async () => {
  return apiRequest<{ status: string; service: string }>("/health");
};
