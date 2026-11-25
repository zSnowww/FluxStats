import { AppError } from '@/domain/AppError';
import { failure, success, type Result } from '@/domain/Result';

const GRAPHQL_URL = 'https://api.github.com/graphql';

interface UserResponse<U> {
  data?: { user: U | null };
  errors?: Array<{ type?: string; message: string }>;
}

/**
 * Runs a GraphQL query shaped like `user(login: $login) { ... }` and returns
 * the `user` object, mapping GitHub errors to AppError.
 */
export async function queryUser<U>(
  query: string,
  login: string,
  token = process.env.GITHUB_TOKEN,
): Promise<Result<U, AppError>> {
  if (!token) return failure(AppError.internal('GITHUB_TOKEN is not configured'));

  let res: Response;
  try {
    res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        Authorization: `bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'fluxstats',
      },
      body: JSON.stringify({ query, variables: { login } }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    return failure(AppError.external('Could not reach GitHub', { cause: String(err) }));
  }

  if (res.status === 401) return failure(AppError.internal('GitHub token is invalid'));
  if (res.status === 403 || res.status === 429)
    return failure(AppError.rateLimited('GitHub rate limit reached, try again later'));
  if (!res.ok) return failure(AppError.external(`GitHub responded ${res.status}`));

  const body = (await res.json()) as UserResponse<U>;
  if (body.errors?.some((e) => e.type === 'RATE_LIMITED')) {
    return failure(AppError.rateLimited('GitHub rate limit reached, try again later'));
  }
  if (body.errors?.some((e) => e.type === 'NOT_FOUND') || body.data?.user === null) {
    return failure(AppError.notFound(`User "${login}" not found`));
  }
  const user = body.data?.user;
  if (!user) {
    return failure(AppError.external('Unexpected GitHub response', { errors: body.errors }));
  }
  return success(user);
}
