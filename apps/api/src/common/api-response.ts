export type ApiSuccess<T> = {
  data: T;
  meta: Record<string, unknown>;
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

export function success<T>(data: T, meta: Record<string, unknown> = {}): ApiSuccess<T> {
  return { data, meta };
}

export function errorBody(code: string, message: string, details?: Record<string, unknown>): ApiErrorBody {
  return { error: { code, message, details } };
}
