import { describe, it, expect } from 'bun:test';
import { success, failure } from '@/domain/Result';

describe('Result Monad', () => {
  it('should create a Success instance', () => {
    const res = success('test');
    expect(res.isSuccess).toBe(true);
    if (res.isSuccess) expect(res.value).toBe('test');
  });

  it('should create a Failure instance', () => {
    const res = failure('error');
    expect(res.isFailure).toBe(true);
    if (res.isFailure) expect(res.error).toBe('error');
  });

  it('map skips failures', () => {
    const res = failure<number, string>('boom').map((n) => n * 2);
    expect(res.isFailure).toBe(true);
  });
});
