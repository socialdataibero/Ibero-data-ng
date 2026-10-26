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
    case 'recoding':
      return `La variable "${param(b, 'variable')}" está confirmada como ${type}, pero con esta recodificación la edición "${param(b, 'edition')}" (columna "${param(b, 'column')}") tendría valores que no lo son: ${values}. Recodifícalos a números o cambia el tipo de la variable a Texto en el mapeo.`;
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

const CODEBOOK_PROBLEM: Record<string, (b: ApiErrorBody) => string> = {
  unreadable: () => 'no se pudo leer el archivo',
  no_dictionary: () =>
    'ninguna hoja tiene la columna «Mnemónico» del descriptor del INEGI. Si no es un descriptor del INEGI, usa la plantilla CSV',
  missing_variable_column: () => 'el CSV no tiene la columna «variable». Descarga la plantilla y úsala como base',
  bad_type: (b) =>
    `en la línea ${param(b, 'line')} el tipo «${param(b, 'value')}» no es válido; usa texto, entero o decimal`,
  empty: () => 'el archivo no tiene variables',
};

function recodingInvalid(b: ApiErrorBody): string {
  switch (param(b, 'problem')) {
    case 'empty_code':
      return 'Cada categoría del catálogo necesita un código.';
    case 'duplicate_code':
      return `El código «${param(b, 'code')}» aparece dos veces en el catálogo.`;
    case 'duplicate_value':
      return `El valor «${param(b, 'value')}» de la edición «${param(b, 'edition')}» tiene dos recodificaciones.`;
    case 'target_not_in_catalog':
      return `Edición «${param(b, 'edition')}»: el valor «${param(b, 'value')}» va a «${param(b, 'target')}», que no es un código del catálogo. Agrégalo al catálogo o elige otro.`;
    case 'edition_not_mapped':
      return 'Una de las ediciones ya no mapea esta variable. Recarga la página.';
    default:
      return 'La recodificación no es válida.';
  }
}

const MESSAGES: Record<string, (b: ApiErrorBody) => string> = {
  file_required: () => 'Falta el archivo.',
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
  codebook_name_required: () => 'Escribe un nombre para el diccionario.',
  codebook_name_taken: (b) =>
    `La encuesta «${param(b, 'survey')}» ya tiene un diccionario llamado «${param(b, 'name')}». Usa otro nombre.`,
  codebook_format_unsupported: () =>
    'El diccionario debe ser un libro de Excel (.xls o .xlsx) o un archivo CSV (.csv).',
  codebook_invalid: (b) =>
    `No se pudo leer el diccionario: ${CODEBOOK_PROBLEM[param(b, 'problem')]?.(b) ?? 'no es válido'}.`,
  codebook_not_found: () => 'El diccionario no existe.',
  codebook_table_not_found: (b) =>
    `El diccionario no tiene la tabla «${param(b, 'table')}».`,
  codebook_no_match: (b) =>
    `Ninguna columna de la edición «${param(b, 'edition')}» aparece en el diccionario «${param(b, 'codebook')}»${b.params?.table ? ` (tabla «${param(b, 'table')}»)` : ''}. Revisa que sea el diccionario de este archivo.`,
  recoding_invalid: recodingInvalid,
  variable_has_no_differences: (b) =>
    `La variable «${param(b, 'name')}» no tiene diferencias de códigos entre ediciones que revisar.`,
  export_format_not_supported: (b) => `Formato de exportación no admitido: «${param(b, 'format')}». Usa «csv» o «parquet».`,
  harmonized_view_empty: () => 'No hay variables mapeadas para exportar como Parquet. Mapea al menos una columna.',
};

/** Spanish text for a harmonizer error, or null when the code is not a harmonizer one. */
export function harmonizerErrorText(body: ApiErrorBody): string | null {
  return MESSAGES[body.code ?? '']?.(body) ?? null;
}
