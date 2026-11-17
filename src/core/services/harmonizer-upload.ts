import Uppy from '@uppy/core';
import Tus from '@uppy/tus';
import { environment } from '../../environments/environment';
import { ApiError, getToken, http } from '../api/http';
import type { ApiErrorBody } from '../api/api-error-body';
import type { HarmonizerImport } from '../models/harmonizer.model';
import type { UploadDatasetPayload } from './harmonizer.service';

/** Size of each request of the upload (tus PATCH). */
const CHUNK_SIZE = 50 * 1024 * 1024;
const POLL_MS = 1500;

export interface EditionUpload {
  /** Resolves with the import id when the whole file is on the server. Rejects with `ApiError`. */
  done: Promise<string>;
  /** Stops the upload and deletes what was sent. */
  cancel(): void;
}

/** The server's JSON error body, read from a failed tus request. */
function tusApiError(status: number | undefined, responseText: string | undefined): ApiError {
  let body: ApiErrorBody | null = null;
  try {
    body = responseText ? (JSON.parse(responseText) as ApiErrorBody) : null;
  } catch {
    body = null;
  }
  return new ApiError(status ?? 0, body);
}

/**
 * Uploads an edition file with tus (Uppy), in chunks, retrying a chunk that fails because of the
 * network. The server checks the fields before the first byte (same errors as the old upload)
 * and imports the file in the background when it arrives; follow it with `waitForImport`.
 */
export function uploadEdition(
  file: File,
  payload: UploadDatasetPayload,
  onProgress: (sent: number, total: number) => void,
): EditionUpload {
  const meta: Record<string, string> = {
    filename: file.name,
    editionName: payload.name,
    year: String(payload.year),
    surveyId: payload.surveyId,
    design: payload.design,
    unit: payload.unit,
  };
  if (payload.newSurvey) meta.newSurvey = payload.newSurvey;
  if (payload.organizationId) meta.organizationId = payload.organizationId;
  if (payload.encoding) meta.encoding = payload.encoding;

  const uppy = new Uppy({ autoProceed: false, restrictions: { maxNumberOfFiles: 1 } });
  uppy.use(Tus, {
    endpoint: `${environment.apiUrl}/harmonizer/uploads`,
    chunkSize: CHUNK_SIZE,
    headers: () => ({ Authorization: `Bearer ${getToken() ?? ''}` }),
    retryDelays: [0, 1000, 3000, 5000, 10000],
    // A rejected field or file (4xx) is rejected again; only network errors and 5xx are retried.
    onShouldRetry: (err, _attempt, _options, next) => {
      const status = err.originalResponse?.getStatus() ?? 0;
      if (status >= 400 && status < 500 && status !== 423) return false;
      return next(err);
    },
    // Only the fields set above: Uppy sends every allowed field, an unset one as "undefined".
    // `name` is Uppy's file name, so the edition name travels as `editionName`.
    allowedMetaFields: Object.keys(meta),
    // Always a new upload: resuming one started with other fields would import it with those.
    storeFingerprintForResuming: false,
  });

  const fileId = uppy.addFile({ name: file.name, type: file.type, data: file, meta });

  uppy.on('upload-progress', (_file, progress) => {
    onProgress(progress.bytesUploaded, progress.bytesTotal ?? file.size);
  });

  const done = new Promise<string>((resolve, reject) => {
    uppy.on('upload-success', (_file, response) => {
      const id = response.uploadURL?.split('/').pop();
      if (id) resolve(id);
      else reject(new ApiError(0, null));
    });
    uppy.on('upload-error', (_file, _error, response) => {
      const xhr = (response?.body as { xhr?: XMLHttpRequest } | undefined)?.xhr;
      reject(tusApiError(response?.status ?? xhr?.status, xhr?.responseText));
    });
    uppy.on('cancel-all', () => reject(new DOMException('Upload cancelled', 'AbortError')));
  }).finally(() => uppy.destroy());

  void uppy.upload().catch(() => {
    // Errors reach `done` through the events above.
  });

  return {
    done,
    cancel: () => {
      uppy.removeFile(fileId);
      uppy.cancelAll();
    },
  };
}

export const harmonizerImports = {
  get: (id: string, signal?: AbortSignal) =>
    http.get<HarmonizerImport>(`/harmonizer/imports/${id}`, signal),
};

/**
 * Polls an import until it ends. Resolves with the finished import (`COMPLETED`); a `FAILED`
 * one rejects with an `ApiError` carrying the same body the old upload answered with.
 */
export async function waitForImport(
  id: string,
  onStatus: (status: HarmonizerImport) => void,
  signal: AbortSignal,
): Promise<HarmonizerImport> {
  for (;;) {
    const status = await harmonizerImports.get(id, signal);
    onStatus(status);
    if (status.status === 'COMPLETED') return status;
    if (status.status === 'FAILED')
      throw new ApiError(status.error?.statusCode ?? 500, status.error);
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, POLL_MS);
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(new DOMException('Aborted', 'AbortError'));
        },
        { once: true },
      );
    });
  }
}
