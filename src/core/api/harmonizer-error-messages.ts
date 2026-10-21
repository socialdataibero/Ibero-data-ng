import { param, type ApiErrorBody } from './api-error-body';

const VALUE_TYPE_LABEL: Record<string, string> = {
  text: 'texto',
  integer: 'números enteros',
  decimal: 'números',
};

// Mirrors CANONICAL_NAME_MIN/MAX in the server's canonical-name.ts.
const CANONICAL_NAME_PROBLEM: Record<string, string> = {
  length: 'debe tener entre 2 y 64 caracteres',
  start: 'debe empezar con una letra sin acento',
  chars: 'solo puede tener letras sin acento, números y guion bajo (_), sin espacios',
};

const DBF_PROBLEM: Record<string, (body: ApiErrorBody) => string> = {
  too_short: () => 'es demasiado corto para tener encabezado',
  bad_header_size: () => 'el encabezado no tiene un tamaño válido',
  bad_field_list: () => 'la lista de columnas del encabezado no termina donde debería',
  no_columns: () => 'no tiene columnas',
  fields_exceed_record: () => 'los anchos de las columnas no caben en el largo del registro',
  truncated: (b) =>
    `está incompleto: el encabezado anuncia ${param(b, 'expectedRecords')} registros y el archivo solo trae ${param(b, 'actualRecords')}`,
};

const EXPORT_TO_CSV = 'Exporta la tabla a CSV desde el programa que la creó y súbela de nuevo.';

function quoteList(values: unknown): string {
  return Array.isArray(values) ? values.map((v) => `"${String(v)}"`).join(', ') : '';
}

function csvInvalid(b: ApiErrorBody): string {
  const line = param(b, 'line');
  switch (param(b, 'problem')) {
    case 'quote_not_closed':
      return `Hay un dato que abre comillas (") y nunca las cierra, a partir de la línea ${line}. Un dato que empieza con comillas debe terminar con comillas; las comillas dentro de él se escriben dobles ("").`;
    case 'inconsistent_columns':
      return `La fila de la línea ${line} tiene ${param(b, 'rowColumns')} columnas y el encabezado tiene ${param(b, 'headerColumns')}. Revisa esa fila: puede faltar o sobrar una coma, un dato con comas debe ir entre comillas, o puede haber una comilla sin cerrar en la fila.`;
    default:
      return `No se pudo leer el archivo como CSV${line ? ` cerca de la línea ${line}` : ''}. Revisa que esté separado por comas y que cada dato entre comillas abra y cierre sus comillas.`;
  }
}

function nameInvalid(b: ApiErrorBody): string {
  const problem = CANONICAL_NAME_PROBLEM[param(b, 'problem')] ?? 'no cumple las reglas';
  const prefix = b.params?.column ? `Columna «${param(b, 'column')}»: el nombre` : 'El nombre';
  return `${prefix} «${param(b, 'name')}» no es válido, ${problem}.`;
}

function nameTaken(b: ApiErrorBody): string {
  const column = param(b, 'column');
  if (b.params?.otherColumn) {
    return `Columna «${column}»: la columna «${param(b, 'otherColumn')}» ya crea la variable «${param(b, 'existing')}» y los nombres no distinguen mayúsculas. Usa el mismo nombre o uno distinto.`;
  }
  if (column) {
    return `Columna «${column}»: ya existe la variable «${param(b, 'existing')}» y los nombres no distinguen mayúsculas. Elígela en la lista en lugar de crear «${param(b, 'name')}».`;
  }
  return `Ya existe la variable «${param(b, 'existing')}» en esta encuesta (los nombres no distinguen mayúsculas).`;
}

function variableInUse(b: ApiErrorBody): string {
  const usages = Array.isArray(b.params?.usages) ? (b.params.usages as { edition: string; column: string }[]) : [];
  const where = usages.map((u) => `«${u.edition}» (columna «${u.column}»)`).join(', ');
  return `La variable «${param(b, 'name')}» está mapeada en ${where}. Quita esos mapeos antes de borrarla.`;
}

function valueTypeMismatch(b: ApiErrorBody): string {
  const type = VALUE_TYPE_LABEL[param(b, 'expectedType')] ?? param(b, 'expectedType');
  const values = quoteList(b.params?.values);
  switch (param(b, 'source')) {
    case 'other_edition':
      return `La variable "${param(b, 'variable')}" también se usa en la edición "${param(b, 'edition')}" (columna "${param(b, 'column')}"), que tiene valores que no son ${type}: ${values}. Márcalos como No especificado en esa edición o elige el tipo Texto.`;
    case 'confirmed_type':
      return `El tipo confirmado de la variable "${param(b, 'variable')}" pide ${type}, pero tiene valores que no lo son: ${values}. Revisa su mapeo o cambia su tipo a Texto.`;
    default:
      return `La columna "${param(b, 'column')}" tiene valores que no son ${type}: ${values}. Márcalos como No especificado o elige el tipo Texto.`;
  }
}

function dbfNotUtf8(b: ApiErrorBody): string {
  const where = b.params?.record
    ? `registro ${param(b, 'record')}, columna «${param(b, 'column')}»`
    : `nombre de la columna ${param(b, 'columnIndex')}`;
  return `El archivo no está en UTF-8 (${where}). Elige otra codificación al subirlo, por ejemplo «Detectar automáticamente».`;
}

function dbfFieldUnsupported(b: ApiErrorBody): string {
  const column = param(b, 'column');
  const type = param(b, 'type');
  return b.params?.memo
    ? `La columna «${column}» es de tipo memo (${type}): su contenido está en un archivo aparte (.dbt o .fpt) que no se sube junto con el .dbf. ${EXPORT_TO_CSV}`
    : `La columna «${column}» es de tipo «${type}», que el armonizador no sabe leer. Solo se leen columnas de texto (C), número (N, F), fecha (D) y lógico (L). ${EXPORT_TO_CSV}`;
}

const MESSAGES: Record<string, (b: ApiErrorBody) => string> = {
  file_required: () => 'Falta el archivo CSV o DBF.',
  dataset_name_taken: (b) =>
    `La encuesta «${param(b, 'survey')}» ya tiene una edición llamada «${param(b, 'name')}». Usa otro nombre.`,
  csv_not_utf8: (b) =>
    `El archivo no está en UTF-8 y sus acentos se perderían (el primer carácter que no se puede leer está en la línea ${param(b, 'line')}). Vuelve a guardarlo como «CSV UTF-8» y súbelo de nuevo.`,
  csv_invalid: csvInvalid,
  csv_empty: () => 'El archivo está vacío: no tiene encabezado ni datos. Revisa que sea el archivo correcto.',
  csv_no_rows: () => 'El archivo solo tiene encabezado y ninguna fila de datos. Sube un archivo con al menos una fila.',
  dbf_invalid: (b) =>
    `No se pudo leer el archivo como DBF: ${DBF_PROBLEM[param(b, 'problem')]?.(b) ?? 'no es válido'}. Revisa que sea una tabla dBase o FoxPro (.dbf) completa.`,
  dbf_field_unsupported: dbfFieldUnsupported,
  dbf_not_utf8: dbfNotUtf8,
  dbf_no_rows: () =>
    'El archivo DBF no tiene registros, o todos están marcados como borrados. Sube un archivo con al menos un registro.',
  survey_name_required: () => 'El nombre de la encuesta no puede quedar vacío.',
  new_survey_name_required: () => 'Escribe el nombre de la encuesta nueva.',
  survey_name_taken: (b) => `Ya existe una encuesta llamada «${param(b, 'name')}».`,
  survey_not_found: () => 'La encuesta no existe.',
  harmonizer_dataset_not_found: () => 'La edición no existe.',
  harmonizer_dataset_file_missing: () =>
    'No se encontraron los datos guardados de esta edición. Vuelve a subir el archivo.',
  canonical_variable_not_found: (b) =>
    b.params?.id ? `La variable con id «${param(b, 'id')}» no pertenece a esta encuesta.` : 'La variable no existe en esta encuesta.',
  canonical_variable_name_invalid: nameInvalid,
  canonical_variable_name_taken: nameTaken,
  canonical_variable_in_use: variableInUse,
  canonical_variable_collision: (b) => {
    const groups = Array.isArray(b.params?.groups) ? (b.params.groups as string[][]) : [];
    return `Cada variable canónica solo puede venir de una columna por edición. Estas columnas comparten variable: ${groups
      .map((g) => g.join(', '))
      .join('; ')}. Asigna una variable distinta a cada una o deja alguna sin mapear.`;
  },
  value_type_mismatch: valueTypeMismatch,
  export_format_not_supported: (b) => `Formato de exportación no admitido: «${param(b, 'format')}». Usa «csv» o «parquet».`,
  harmonized_view_empty: () => 'No hay variables mapeadas para exportar como Parquet. Mapea al menos una columna.',
};

/** Spanish text for a harmonizer error, or null when the code is not a harmonizer one. */
export function harmonizerErrorText(body: ApiErrorBody): string | null {
  return MESSAGES[body.code ?? '']?.(body) ?? null;
}
