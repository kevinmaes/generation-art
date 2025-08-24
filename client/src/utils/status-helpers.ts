/**
 * Generic status helpers for discriminated unions
 * These can be used with any status-based discriminated union
 */

// Generic status interface that all discriminated unions should follow
export interface StatusUnion<T = unknown> {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: T | null;
  error: string | null;
}

// Type guards for any status-based discriminated union
export function isIdle<T>(
  value: StatusUnion<T>,
): value is StatusUnion<T> & { status: 'idle'; data: null; error: null } {
  return value.status === 'idle';
}

export function isLoading<T>(
  value: StatusUnion<T>,
): value is StatusUnion<T> & { status: 'loading'; data: null; error: null } {
  return value.status === 'loading';
}

export function isSuccess<T>(
  value: StatusUnion<T>,
): value is StatusUnion<T> & { status: 'success'; data: T; error: null } {
  return value.status === 'success';
}

export function isError<T>(
  value: StatusUnion<T>,
): value is StatusUnion<T> & { status: 'error'; data: null; error: string } {
  return value.status === 'error';
}

// Helper to get status flags as booleans
export function getStatusFlags<T>(value: StatusUnion<T>) {
  return {
    isIdle: value.status === 'idle',
    isLoading: value.status === 'loading',
    isSuccess: value.status === 'success',
    isError: value.status === 'error',
  };
}

// Helper to map over status states
export function matchStatus<T, R>(
  value: StatusUnion<T>,
  handlers: {
    idle: () => R;
    loading: () => R;
    success: (data: T) => R;
    error: (error: string) => R;
  },
): R {
  switch (value.status) {
    case 'idle':
      return handlers.idle();
    case 'loading':
      return handlers.loading();
    case 'success':
      // We know data is T (not null) when status is 'success'
      if (value.data === null) {
        throw new Error('Invalid state: success status with null data');
      }
      return handlers.success(value.data as T);
    case 'error':
      // We know error is string (not null) when status is 'error'
      if (value.error === null) {
        throw new Error('Invalid state: error status with null error');
      }
      return handlers.error(value.error);
    default: {
      // TypeScript exhaustiveness check
      const _exhaustive: never = value.status;
      // This variable is used for compile-time exhaustiveness checking
      void _exhaustive;
      throw new Error('Unhandled status in matchStatus');
    }
  }
}
