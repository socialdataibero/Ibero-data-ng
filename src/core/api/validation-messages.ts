// Spanish text for the server's DTO validation messages ("<field> <rule>"). The field name
// stays first so fieldErrors() can still match a detail to its form field.
const MESSAGES: Record<string, string> = {
  'name must be a string.': 'name debe ser texto.',
  'name must not be empty.': 'name no puede quedar vacío.',
  'description must be a string.': 'description debe ser texto.',
  'column must be a string.': 'column debe ser texto.',
  'choice must be a string.': 'choice debe ser texto.',
  'newName must be a string.': 'newName debe ser texto.',
  'dataType must be "text", "integer" or "decimal".': 'dataType debe ser "text", "integer" o "decimal".',
  'missingCodes must be a list.': 'missingCodes debe ser una lista.',
  'missingCodes can only contain strings.': 'missingCodes solo puede contener texto.',
  'columns must be a list.': 'columns debe ser una lista.',
  'columns can only contain objects.': 'columns solo puede contener objetos.',
  'year must be an integer.': 'year debe ser un número entero.',
  'year must not be earlier than 1900.': 'year no puede ser anterior a 1900.',
  'year must not be later than 2100.': 'year no puede ser posterior a 2100.',
  'surveyId must be a string.': 'surveyId debe ser texto.',
  'surveyId must not be empty.': 'surveyId no puede quedar vacío.',
  'newSurvey must be a string.': 'newSurvey debe ser texto.',
  'fullName must be a string.': 'El nombre debe ser texto.',
  'fullName must be at least 2 characters long.': 'El nombre debe tener al menos 2 caracteres.',
  'newPassword must be at least 8 characters long.': 'La contraseña debe tener al menos 8 caracteres.',
};

const ENCODING_ONE_OF = /^encoding must be one of: (.*)\.$/;

/** Spanish text for one validation detail; unknown details are returned unchanged. */
export function translateValidationDetail(detail: string): string {
  const encoding = ENCODING_ONE_OF.exec(detail);
  if (encoding) return `encoding debe ser uno de: ${encoding[1]}.`;
  return MESSAGES[detail] ?? detail;
}
