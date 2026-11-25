export type Result<T, E> = Success<T, E> | Failure<T, E>;

export class Success<T, E> {
  readonly isSuccess = true;
  readonly isFailure = false;

  constructor(public readonly value: T) {}

  map<U>(fn: (value: T) => U): Result<U, E> {
    return new Success<U, E>(fn(this.value));
  }

  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }
}

export class Failure<T, E> {
  readonly isSuccess = false;
  readonly isFailure = true;

  constructor(public readonly error: E) {}

  map<U>(_fn: (value: T) => U): Result<U, E> {
    return new Failure<U, E>(this.error);
  }

  flatMap<U>(_fn: (value: T) => Result<U, E>): Result<U, E> {
    return new Failure<U, E>(this.error);
  }
}

export const success = <T, E>(value: T): Result<T, E> => new Success(value);
export const failure = <T, E>(error: E): Result<T, E> => new Failure(error);
