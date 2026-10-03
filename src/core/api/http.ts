import { environment } from '../../environments/environment';

const TOKEN_KEY = 'ibero_access_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: { message?: string; code?: string | null; details?: string[] } | null,
  ) {
    super(body?.message ?? `Error ${status}`);
    this.name = 'ApiError';
  }
}

export function isNotFound(err: unknown): boolean {
  return err instanceof ApiError && err.status === 404;
}

export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError && err.body?.message ? err.body.message : fallback;
}

/**
 * Maps a NestJS/class-validator error to per-field messages. Each violation string
 * follows the "<field> <rule description>" convention (e.g. "sourceUrl must be a URL
 * address"), so a field is matched by that prefix. Returns {} when the error isn't a
 * field-level validation error (e.g. a network failure or a generic 500).
 */
export function fieldErrors(err: unknown, fields: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  if (!(err instanceof ApiError)) return result;
  const messages = err.body?.details ?? (err.body?.message ? [err.body.message] : []);
  for (const detail of messages) {
    const field = fields.find((f) => detail.startsWith(`${f} `));
    if (field && !result[field]) result[field] = detail;
  }
  return result;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
}

async function request<T>(
  path: string,
  { method = 'GET', body, signal }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const isFormData = body instanceof FormData;
  if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${environment.apiUrl}${path}`, {
    method,
    headers,
    signal,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  if (!res.ok) {
    let responseBody: { message?: string } | null = null;
    try {
      responseBody = (await res.json()) as { message?: string };
    } catch {}
    throw new ApiError(res.status, responseBody);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export interface DownloadedFile {
  blob: Blob;
  filename: string | null;
}

export async function downloadBlob(path: string): Promise<DownloadedFile> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${environment.apiUrl}${path}`, { headers });

  if (!res.ok) {
    let responseBody: { message?: string } | null = null;
    try {
      responseBody = (await res.json()) as { message?: string };
    } catch {}
    throw new ApiError(res.status, responseBody);
  }

  const disposition = res.headers.get('Content-Disposition');
  const filename = disposition?.match(/filename="?([^"]+)"?/)?.[1] ?? null;
  const blob = await res.blob();
  return { blob, filename };
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export const http = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { signal }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
