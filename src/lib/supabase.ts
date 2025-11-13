import { apiGet } from './api';

type RestMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type RestOptions = {
  method?: RestMethod;
  searchParams?: Record<string, string | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

type SupabaseConfig = { url: string; key: string };

let configCache: SupabaseConfig | null = null;
let configPromise: Promise<SupabaseConfig> | null = null;

function normalizeUrl(url?: string | null) {
  return url ? url.replace(/\/$/, '') : '';
}

async function resolveConfig(): Promise<SupabaseConfig> {
  if (configCache) return configCache;
  if (configPromise) return configPromise;

  configPromise = (async () => {
    const env = (import.meta as any)?.env ?? {};
    const envUrl = normalizeUrl(env?.VITE_SUPABASE_URL);
    const envKey = env?.VITE_SUPABASE_ANON_KEY;
    if (envUrl && envKey) {
      return { url: envUrl, key: envKey };
    }
    try {
      const remote = await apiGet<{ url?: string; anonKey?: string }>('/auth/supabase/config');
      if (remote?.url && remote?.anonKey) {
        return { url: normalizeUrl(remote.url), key: remote.anonKey };
      }
    } catch (err) {
      console.error('ไม่สามารถดึงข้อมูล Supabase จากเซิร์ฟเวอร์ได้', err);
    }
    throw new Error('Missing Supabase client configuration');
  })();

  try {
    configCache = await configPromise;
    return configCache;
  } finally {
    configPromise = null;
  }
}

export async function supabaseRest<T>(table: string, options: RestOptions = {}): Promise<T> {
  const cfg = await resolveConfig();
  const url = new URL(`${cfg.url}/rest/v1/${table}`);
  if (options.searchParams) {
    const params = new URLSearchParams();
    Object.entries(options.searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) params.append(key, value);
    });
    const qs = params.toString();
    if (qs) url.search = qs;
  }

  const hasBody = options.body !== undefined;
  const res = await fetch(url.toString(), {
    method: options.method ?? 'GET',
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
    body: hasBody ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Supabase request failed');
  }
  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

export function buildInFilter(column: string, ids: string[]) {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (!unique.length) return undefined;
  const payload = unique.map((id) => `"${id}"`).join(',');
  return { [column]: `in.(${payload})` };
}

export async function supabaseInsert<T>(table: string, body: Record<string, unknown>) {
  return supabaseRest<T>(table, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body,
  });
}

export async function supabaseUpdate<T>(
  table: string,
  filters: Record<string, string>,
  body: Record<string, unknown>,
) {
  return supabaseRest<T>(table, {
    method: 'PATCH',
    searchParams: filters,
    headers: { Prefer: 'return=representation' },
    body,
  });
}
