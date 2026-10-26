export interface HarmonizerDatasetSummary {
  id: string;
  name: string;
  year: number;
  rowCount: number;
  mappedColumns: number;
  totalColumns: number;
}

export interface HarmonizerSurvey {
  id: string;
  name: string;
  description: string | null;
  datasets: HarmonizerDatasetSummary[];
}

export interface HarmonizerDataset {
  id: string;
  name: string;
  year: number;
  surveyId: string;
  surveyName: string;
  rowCount: number;
  /** Columnas del archivo, mapeadas o no. */
  columnCount: number;
}

/** Encabezado repetido en el CSV que el servidor renombró al subirlo. */
export interface RenamedColumn {
  /** Posición de la columna en el archivo, empezando en 1. */
  position: number;
  original: string;
  renamed: string;
}

/** Codificación de un DBF al subirlo; `auto` la detecta el servidor. */
export type UploadEncoding = 'auto' | 'windows-1252' | 'cp850' | 'cp437' | 'utf-8';

export const UPLOAD_ENCODING_LABEL: Record<UploadEncoding, string> = {
  auto: 'Detectar automáticamente',
  'windows-1252': 'Windows-1252 / Latin-1 (Windows)',
  cp850: 'CP850 (MS-DOS, Europa occidental)',
  cp437: 'CP437 (MS-DOS, Estados Unidos)',
  'utf-8': 'UTF-8',
};

/** Cómo leyó el servidor el archivo subido. Solo llega en la respuesta de la subida. */
export type UploadSource =
  | { format: 'csv' }
  | {
      format: 'dbf';
      encoding: Exclude<UploadEncoding, 'auto'>;
      /** Elegida al subir, indicada en el encabezado del DBF o deducida del texto. */
      encodingSource: 'user' | 'header' | 'content';
      /** Registros marcados como borrados en el DBF, que no se cargaron. */
      deletedRecords: number;
    };

/** Estado de navegación de la subida a la pantalla de mapeo. */
export interface MappingRouteState {
  renamedColumns?: RenamedColumn[];
  source?: UploadSource;
}

/** Tipo de una variable en el Parquet exportado. El CSV siempre es texto. */
export type ValueType = 'text' | 'integer' | 'decimal';

export const VALUE_TYPE_LABEL: Record<ValueType, string> = {
  text: 'Texto',
  integer: 'Entero',
  decimal: 'Decimal',
};

export interface CanonicalVariable {
  id: string;
  name: string;
  /** Viene del diccionario de la edición que la creó, si tenía. */
  description?: string | null;
  /** Tipo confirmado al guardar un mapeo; `null` = sin confirmar. */
  dataType: ValueType | null;
}

/** Edición que mapea una variable canónica, y desde qué columna. */
export interface CanonicalVariableUsage {
  datasetId: string;
  datasetName: string;
  year: number;
  column: string;
}

/**
 * Códigos de una variable entre ediciones (SDI-50): `single` (una sola edición), `ok` (coinciden),
 * `warning` (hay diferencias sin revisar) o `reviewed` (alguien marcó «Revisada, es correcto»).
 */
export type ComparisonStatus = 'single' | 'ok' | 'warning' | 'reviewed';

export interface SurveyCanonicalVariable extends CanonicalVariable {
  /** `false` para nombres creados antes de las reglas: siguen funcionando, pero conviene renombrarlos. */
  nameValid: boolean;
  usages: CanonicalVariableUsage[];
  /** Catálogo de categorías al que se recodifican las ediciones; vacío si no tiene. */
  categories: CatalogCategory[];
  comparison: { status: ComparisonStatus; issueCount: number };
}

export interface SurveyCanonicalVariables {
  survey: { id: string; name: string };
  items: SurveyCanonicalVariable[];
}

export type SuggestionSource = 'history' | 'name' | 'description';

/** Tipo de categoría en un diccionario: código, «No especificado», «Blanco por pase», rango o catálogo externo. */
export type CategoryKind = 'value' | 'missing' | 'blank' | 'range' | 'catalog';

export interface CodebookCategory {
  code: string;
  label: string;
  kind: CategoryKind;
}

/** Lo que dice el diccionario de la edición sobre una columna. */
export interface ColumnCodebook {
  name: string;
  label: string | null;
  question: string | null;
  section: string | null;
  declaredType: ValueType | null;
  categories: CodebookCategory[];
  /** Códigos de «No especificado» del diccionario, escritos como en los datos. */
  missingCodes: string[];
  /** Tipo que sugieren el diccionario y los valores. */
  suggestedType: ValueType;
}

/** Resumen de los valores de una columna en su edición, tal como vienen en el archivo. */
export interface ColumnValues {
  /** Hasta 5, del más frecuente al menos frecuente. */
  top: { value: string; count: number }[];
  distinct: number;
  /** Hay más valores distintos que `distinct` (el servidor deja de contar en 1,000). */
  distinctCapped: boolean;
  /** Celdas vacías o solo con espacios. */
  empty: number;
}

export interface MappingColumn {
  name: string;
  selectedCanonicalId: string | null;
  suggested: string | null;
  suggestionSource: SuggestionSource | null;
  missingCodes: string[];
  /** Tipo que sugieren los valores de esta edición. */
  inferredType: ValueType;
  values: ColumnValues;
  codebook: ColumnCodebook | null;
}

export interface MappingInfo {
  dataset: HarmonizerDataset;
  columns: MappingColumn[];
  canonicalVariables: CanonicalVariable[];
  /** Diccionario asociado a la edición. */
  codebook: { id: string; name: string; table: string | null; matchedColumns: number } | null;
  /** Diccionarios de la encuesta, para elegir uno. */
  codebooks: { id: string; name: string; tables: string[] }[];
  /** Las demás ediciones de la encuesta, para copiar su mapeo. */
  otherEditions: { id: string; name: string; year: number; mappedColumns: number }[];
}

/** Mapeo guardado de una edición, sin sus datos. */
export interface SavedMapping {
  dataset: HarmonizerDataset;
  columns: { column: string; canonicalId: string; canonicalName: string; missingCodes: string[] }[];
}

export interface CodebookSummary {
  id: string;
  surveyId: string;
  name: string;
  fileName: string;
  format: 'inegi' | 'csv';
  createdAt: string;
  tables: { name: string; variableCount: number }[];
  datasets: { id: string; name: string; year: number; table: string | null }[];
}

export interface CodebookVariable {
  name: string;
  label: string | null;
  question: string | null;
  section: string | null;
  declaredType: ValueType | null;
  validRange: string | null;
  length: number | null;
  categories: CodebookCategory[];
}

export interface CodebookDetail extends Omit<CodebookSummary, 'tables'> {
  tables: { name: string; variableCount: number; variables: CodebookVariable[] }[];
}

export interface CodebookList {
  survey: { id: string; name: string };
  items: CodebookSummary[];
}

/** Resultado de asociar un diccionario a una edición. */
export interface DatasetCodebook {
  codebook: {
    id: string;
    name: string;
    table: string;
    matchedColumns: number;
    unmatchedColumns: string[];
  } | null;
}

export interface CatalogCategory {
  code: string;
  label: string;
}

export interface ComparisonValue {
  /** Valor en el archivo. */
  value: string;
  /** Código en la vista armonizada (recodificado o el mismo valor). */
  code: string;
  label: string | null;
  /** Etiqueta del valor en el diccionario de su edición, antes de recodificar. */
  sourceLabel: string | null;
  count: number;
  missing: boolean;
  recoded: boolean;
}

export interface ComparisonEdition {
  datasetId: string;
  datasetName: string;
  year: number;
  column: string;
  codebookLabel: string | null;
  values: ComparisonValue[];
  distinctCapped: boolean;
  empty: number;
}

export type IssueKind = 'label_conflict' | 'code_conflict' | 'format' | 'only_in_some' | 'not_in_catalog';

export interface ComparisonIssue {
  kind: IssueKind;
  subject: string;
  editions: { datasetName: string; year: number; codes: string[]; label: string | null }[];
}

export interface VariableComparison {
  variable: {
    id: string;
    name: string;
    description: string | null;
    dataType: ValueType | null;
    categories: CatalogCategory[];
    reviewedAt: string | null;
    reviewedBy: string | null;
  };
  status: ComparisonStatus;
  categorical: boolean;
  editions: ComparisonEdition[];
  issues: ComparisonIssue[];
  suggestion: { categories: CatalogCategory[]; valueMaps: Record<string, Record<string, string>> };
}

export interface SaveRecodingPayload {
  categories: { code: string; label: string }[];
  editions: { datasetId: string; values: { from: string; to: string }[] }[];
}

export const NEW_OPTION = '__new__';
export const CANONICAL_PREFIX = 'cv:';

export interface MappingChoice {
  column: string;
  choice: string;
  newName?: string;
  newDescription?: string;
  dataType?: ValueType;
  missingCodes?: string[];
}

/** `null` es un valor faltante: celda vacía o código de no especificado. */
export type HarmonizedRow = Record<string, string | number | null>;

/** One page of a harmonized view (SDI-93). `offset` counts rows, starting at 0. */
export interface ViewPage {
  limit: number;
  offset: number;
}

export interface DatasetHarmonizedView extends ViewPage {
  dataset: HarmonizerDataset;
  headers: string[];
  rows: HarmonizedRow[];
  /** Rows of the whole view; `rows` holds only the requested page. */
  total: number;
  availableVariables: string[];
  selectedCount: number;
}

export interface SurveyHarmonizedView extends ViewPage {
  survey: { id: string; name: string };
  headers: string[];
  rows: HarmonizedRow[];
  /** Rows of the whole view; `rows` holds only the requested page. */
  total: number;
  availableVariables: string[];
  selected: string[];
  selectedCount: number;
  /** Variables de la vista con códigos distintos entre ediciones sin revisar (SDI-50). */
  codeWarnings: { id: string; name: string; issueCount: number }[];
}

export type ExportFormat = 'csv' | 'parquet';
