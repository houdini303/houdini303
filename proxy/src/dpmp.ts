import type { RawConnection, RawLine } from './types.js';

// DPMP interní endpoint veřejné mapy. Klíč je zadrátovaný ve veřejném JS buildu
// online.dpmp.cz; přebíráme ho z env (fallback na známou hodnotu pro dev).
const BASE = 'https://online.dpmp.cz/api';
const KEY = process.env.DPMP_KEY ?? '3e86570d-56a1-4ec1-8012-c1a9f98d18cc';

// ⚠️ Content-Type gotcha: server vrací 200 POUZE s text/plain;charset=UTF-8.
// S application/json → 500. Bez klíče → 401. (viz docs/01)
const HEADERS: Record<string, string> = {
  'Content-Type': 'text/plain;charset=UTF-8',
  Origin: 'https://online.dpmp.cz',
  Referer: 'https://online.dpmp.cz/',
};

const BODY = JSON.stringify({ key: KEY });

// --- Jednoduchá in-memory TTL cache (dost i pro serverless warm instance) ---
interface CacheEntry<T> {
  value: T;
  expires: number;
}
const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | undefined {
  const e = cache.get(key);
  if (e && e.expires > Date.now()) return e.value as T;
  return undefined;
}

function setCached<T>(key: string, value: T, ttlMs: number): void {
  cache.set(key, { value, expires: Date.now() + ttlMs });
}

async function post<T>(endpoint: string, attempt = 0): Promise<T> {
  try {
    const res = await fetch(`${BASE}/${endpoint}`, {
      method: 'POST',
      headers: HEADERS,
      body: BODY,
    });
    if (!res.ok) throw new Error(`DPMP ${endpoint} → HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
      return post<T>(endpoint, attempt + 1);
    }
    throw err;
  }
}

const LINES_TTL = 60 * 60 * 1000; // linky jsou statické → 1 h
const CONN_TTL = 8 * 1000; // polohy → 8 s (nehamrat, sdílený refresh)

export async function fetchLines(): Promise<RawLine[]> {
  const cached = getCached<RawLine[]>('lines');
  if (cached) return cached;
  const data = await post<RawLine[]>('lines');
  setCached('lines', data, LINES_TTL);
  return data;
}

export async function fetchConnections(line: number): Promise<RawConnection[]> {
  const key = `conn:${line}`;
  const cached = getCached<RawConnection[]>(key);
  if (cached) return cached;
  const data = await post<RawConnection[]>(`currentConnections?line=${line}`);
  setCached(key, data, CONN_TTL);
  return data;
}
