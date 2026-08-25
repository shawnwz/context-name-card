const API_URL = process.env.API_URL ?? "http://localhost:4000";

export async function getSharedIdentity<T>(token: string): Promise<T | null> {
  const res = await fetch(`${API_URL}/shares/${token}`, { cache: "no-store" });
  if (res.status === 404 || res.status === 410) return null;
  if (!res.ok) return null;
  return res.json();
}
