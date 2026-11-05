import { analysisErrorText } from './analysis-error-messages';
import type { ApiErrorBody } from './api-error-body';
import { harmonizerErrorText } from './harmonizer-error-messages';
import { translateValidationDetail } from './validation-messages';

/** Codes any module can return. */
const GENERAL_MESSAGES: Record<string, string> = {
  insufficient_role: 'No tienes el rol necesario en esta organización para hacer esto.',
  internal_error: 'Ocurrió un error inesperado en el servidor. Inténtalo de nuevo; si se repite, avisa al administrador.',
};

/**
 * Spanish text for an API error the app knows by its `code`, or null to fall back to the
 * server message. The server always answers in English; this is where the UI localizes it.
 */
export function translateApiError(body: ApiErrorBody | null): string | null {
  if (!body?.code) return null;
  if (body.code === 'validation_error' && body.details?.[0]) {
    return translateValidationDetail(body.details[0]);
  }
  return harmonizerErrorText(body) ?? analysisErrorText(body) ?? GENERAL_MESSAGES[body.code] ?? null;
}

export { translateValidationDetail };
