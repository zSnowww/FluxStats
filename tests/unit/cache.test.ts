import { describe, expect, it } from 'bun:test';
import { AppError } from '@/domain/AppError';
import { failure, success, type Result } from '@/domain/Result';
import { TtlCache, cached } from '@/lib/cache';

describe('cached', () => {
  it('shares one load between simultaneous requests for the same key', async () => {
    const cache = new TtlCache<number>(1000);
    let loads = 0;
    const load = async (): Promise<Result<number, AppError>> => success(++loads);
    const [a, b] = await Promise.all([cached(cache, 'k', load), cached(cache, 'k', load)]);
    expect([a.isSuccess && a.value, b.isSuccess && b.value]).toEqual([1, 1]);
    await cached(cache, 'other', load);
    expect(loads).toBe(2);
  });

  it('retries after a failed result or a rejected load', async () => {
    const cache = new TtlCache<number>(1000);
    const bad = await cached<number, AppError>(cache, 'k', async () =>
      failure(AppError.external('down')),
    );
    expect(bad.isFailure).toBe(true);
    const thrown = cached<number, AppError>(cache, 'k', async () => {
      throw new Error('boom');
    });
    await expect(thrown).rejects.toThrow('boom');
    const ok = await cached<number, AppError>(cache, 'k', async () => success(7));
    expect(ok.isSuccess && ok.value).toBe(7);
  });
});
