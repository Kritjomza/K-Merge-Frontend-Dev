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
  created_at?: string | null;
  updatedAt?: string | null;
  publishedAt?: string | null;
};

export type WorkDetail = WorkListItem & {
  saveCount?: number;
  authorId?: string;
  publishedAt?: string | null;
  updatedAt?: string | null;
  created_at?: string | null;
  media: { id?: string; fileurl: string; filetype?: string; alttext?: string }[];
  authorProfile?: PublicProfile | null;
};

export type PublicProfile = {
  userID?: string;
  displayName?: string;
  bio?: string | null;
  contact?: string | null;
  avatarUrl?: string | null;
  location?: string | null;
  created_at?: string | null;
};
