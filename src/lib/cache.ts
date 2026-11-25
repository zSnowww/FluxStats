import { success, type Result } from '@/domain/Result';

interface Entry<T> {
  value: T;
  expiresAt: number;
}

/**
 * In-memory TTL cache. Enough for a single instance; if deployed across
 * several, swap it for Redis/KV behind this same interface.
 */
export class TtlCache<T> {
  private store = new Map<string, Entry<T>>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries = 1000,
  ) {}

  get(key: string): T | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: string, value: T): void {
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}

const pending = new WeakMap<object, Map<string, Promise<unknown>>>();

/**
 * Returns the cached value or runs `load`; only successful results are stored.
 * Concurrent requests for the same key share a single `load`.
 */
export async function cached<T, E>(
  cache: TtlCache<T>,
  key: string,
  load: () => Promise<Result<T, E>>,
): Promise<Result<T, E>> {
  const hit = cache.get(key);
  if (hit !== undefined) return success(hit);

  const inFlight = pending.get(cache) ?? new Map<string, Promise<unknown>>();
  pending.set(cache, inFlight);
  const running = inFlight.get(key);
  if (running) return running as Promise<Result<T, E>>;

  const promise = load()
    .then((result) => {
      if (result.isSuccess) cache.set(key, result.value);
      return result;
    })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}
