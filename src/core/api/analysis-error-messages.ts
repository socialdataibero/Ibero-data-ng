import { param, type ApiErrorBody } from './api-error-body';

const VALUE_TYPE_NAMES: Record<string, string> = {
  integer: 'un número entero',
  number: 'un número',
  date: 'una fecha (AAAA-MM-DD)',
  timestamp: 'una fecha y hora',
  boolean: 'verdadero o falso',
};

const STEP_FIELD_MISSING: Record<string, string> = {
  filter_column_required: 'Falta elegir la columna en el paso «Filtrar filas».',
  filter_operator_required: 'Falta elegir el operador en el paso «Filtrar filas».',
  aggregate_column_required: 'Falta elegir la columna en el paso «Calcular».',
  aggregate_function_required: 'Falta elegir la función en el paso «Calcular».',
  aggregate_result_name_required: 'Falta el nombre del resultado en el paso «Calcular».',
  compute_left_required: 'Falta la columna A en el paso «Crear columna».',
  compute_right_required: 'Falta la columna B (o el número) en el paso «Crear columna».',
  compute_result_name_required: 'Falta el nombre del resultado en el paso «Crear columna».',
  join_resource_required: 'Falta elegir el recurso en el paso «Cruzar con otro recurso».',
  join_alias_required: 'Falta el alias en el paso «Cruzar con otro recurso».',
  join_type_required: 'Falta elegir el tipo de cruce en el paso «Cruzar con otro recurso».',
  join_on_left_required: 'Falta la columna de este recurso en el paso «Cruzar con otro recurso».',
  join_on_right_required: 'Falta la columna del otro recurso en el paso «Cruzar con otro recurso».',
  percentage_reference_required: 'Falta elegir la agregación de referencia en el paso «Convertir a porcentaje».',
  percentage_result_name_required: 'Falta el nombre del resultado en el paso «Convertir a porcentaje».',
  sort_column_required: 'Falta elegir la columna en el paso «Ordenar».',
  sort_direction_required: 'Falta elegir la dirección en el paso «Ordenar».',
  limit_rows_required: 'Falta el número de filas en el paso «Limitar filas».',
  limit_rows_invalid: 'El número de filas en «Limitar filas» debe ser mayor que 0.',
  group_by_columns_required: 'El paso «Agrupar por» necesita al menos una columna.',
};

const CODE_MESSAGES: Record<string, string> = {
  ...STEP_FIELD_MISSING,
  unknown_operation: 'El análisis tiene un paso que no se reconoce.',
  operator_not_allowed: 'El operador elegido en «Filtrar filas» no está permitido.',
  aggregate_function_not_allowed: 'La función elegida en «Calcular» no está permitida.',
  count_distinct_requires_column: '«Contar distintos» necesita una columna.',
  join_type_not_allowed: 'El tipo de cruce elegido no está permitido.',
  duplicate_join_alias: 'Dos cruces usan el mismo alias, o el alias está reservado. Usa otro.',
  sort_direction_not_allowed: 'La dirección de orden elegida no está permitida.',
  percentage_reference_not_found: 'El porcentaje debe referirse a una agregación del análisis.',
  resource_not_found: 'El recurso ya no existe en este dataset.',
  analysis_not_found: 'El análisis ya no existe.',
  analysis_slug_taken: 'Ese slug ya está en uso; prueba con otro.',
  analysis_result_not_ready: 'Este análisis todavía no tiene un resultado listo.',
  analysis_from_vizcanvas: 'Este análisis se hizo en VizCanvas; ábrelo ahí para editarlo.',
  analysis_not_from_vizcanvas: 'Este análisis se hizo con el constructor de pasos; guárdalo como un análisis nuevo.',
  vizcanvas_recipe_missing: 'Este análisis no tiene una receta de VizCanvas.',
  vizcanvas_recipe_invalid: 'La receta de VizCanvas no es válida.',
  invalid_parquet: 'El resultado de VizCanvas no es un archivo Parquet válido.',
};

const DUCKDB_REASON_MESSAGES: Record<string, string> = {
  incompatible_types: 'El análisis combina columnas o valores de tipos que no son compatibles. Revisa los filtros, cruces y operaciones.',
  syntax_error: 'La consulta SQL tiene un error de sintaxis.',
  unknown_table: 'La consulta usa una tabla o función que no existe. La tabla de datos se llama data.',
  out_of_memory: 'El análisis necesita más memoria de la disponible. Reduce los datos con filtros o una muestra más chica.',
  io_error: 'No se pudo leer o escribir el archivo de datos. Intenta de nuevo; si sigue fallando, avisa al equipo.',
  unknown: 'No se pudo procesar el análisis. Revisa los filtros y operaciones; si sigue fallando, avisa al equipo.',
};

function duckDbMessage(body: ApiErrorBody): string {
  const reason = body.reason;
  if (reason === 'invalid_value') {
    const expected = VALUE_TYPE_NAMES[param(body, 'expectedType')] ?? 'del tipo que guarda la columna';
    return `El valor «${param(body, 'value')}» no es ${expected}, que es lo que guarda la columna. Corrige el valor en el filtro u operación.`;
  }
  if (reason === 'unknown_column') {
    return `La columna «${param(body, 'column')}» no existe en los datos. Revisa los nombres de columna del análisis.`;
  }
  return DUCKDB_REASON_MESSAGES[reason ?? 'unknown'] ?? DUCKDB_REASON_MESSAGES.unknown;
}

/** Spanish text for an analysis error, or null when the code is not an analysis one. */
export function analysisErrorText(body: ApiErrorBody): string | null {
  if (body.code === 'unknown_columns') {
    return `Estas columnas no existen en los recursos: ${param(body, 'columns')}.`;
  }
  if (body.reason) return duckDbMessage(body);
  return CODE_MESSAGES[body.code ?? ''] ?? null;
}
