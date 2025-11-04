const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';

function toUrl(path: string): string {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path}`;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(toUrl(path), { credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPost<T>(path: string, body: any): Promise<T> {
  const res = await fetch(toUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export type WorkListItem = {
  workId: string;
  title: string;
  description?: string | null;
  status: string;
  thumbnail?: string | null;
  tags?: { tagId: string; name: string }[];
};

export type WorkDetail = WorkListItem & {
  media: { id?: string; fileurl: string; filetype?: string; alttext?: string }[];
};

