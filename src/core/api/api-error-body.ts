/** JSON body of a failed API response (see the server README, "Errors"). */
export interface ApiErrorBody {
  message?: string;
  code?: string | null;
  details?: string[];
  reason?: string;
  params?: Record<string, unknown>;
}

/** A param as display text; missing params become an empty string. */
export function param(body: ApiErrorBody, key: string): string {
  const value = body.params?.[key];
  return value === undefined || value === null ? '' : String(value);
}
