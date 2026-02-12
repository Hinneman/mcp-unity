export interface CacheStats {
  size: number;
}

interface CacheEntry<T> {
  value: T;
  createdAt: number;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 30 * 60 * 1000;
const store = new Map<string, CacheEntry<any>>();

function now(): number {
  return Date.now();
}

function pruneExpired(): void {
  const current = now();
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt <= current) {
      store.delete(key);
    }
  }
}

export function setHierarchy<T>(id: string, value: T, ttlMs: number = DEFAULT_TTL_MS): void {
  pruneExpired();
  const current = now();
  store.set(id, {
    value,
    createdAt: current,
    expiresAt: current + ttlMs,
  });
}

export function getHierarchy<T>(id: string): T | undefined {
  pruneExpired();
  const entry = store.get(id);
  if (!entry) {
    return undefined;
  }
  if (entry.expiresAt <= now()) {
    store.delete(id);
    return undefined;
  }
  return entry.value as T;
}

export function hasHierarchy(id: string): boolean {
  return getHierarchy(id) !== undefined;
}

export function deleteHierarchy(id: string): void {
  store.delete(id);
}

export function clearHierarchies(): void {
  store.clear();
}

export function getHierarchyStats(): CacheStats {
  pruneExpired();
  return { size: store.size };
}
