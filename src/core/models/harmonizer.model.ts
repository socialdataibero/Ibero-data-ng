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

/** Estado de navegación de la subida a la pantalla de mapeo. */
export interface MappingRouteState {
  renamedColumns?: RenamedColumn[];
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

export interface SurveyCanonicalVariable extends CanonicalVariable {
  /** `false` para nombres creados antes de las reglas: siguen funcionando, pero conviene renombrarlos. */
  nameValid: boolean;
  usages: CanonicalVariableUsage[];
}

export interface SurveyCanonicalVariables {
  survey: { id: string; name: string };
  items: SurveyCanonicalVariable[];
}

export type SuggestionSource = 'history' | 'name';

export interface MappingColumn {
  name: string;
  selectedCanonicalId: string | null;
  suggested: string | null;
  suggestionSource: SuggestionSource | null;
  missingCodes: string[];
  /** Tipo que sugieren los valores de esta edición. */
  inferredType: ValueType;
}

export interface MappingInfo {
  dataset: HarmonizerDataset;
  columns: MappingColumn[];
  canonicalVariables: CanonicalVariable[];
}

export const NEW_OPTION = '__new__';
export const CANONICAL_PREFIX = 'cv:';

export interface MappingChoice {
  column: string;
  choice: string;
  newName?: string;
  dataType?: ValueType;
  missingCodes?: string[];
}

/** `null` es un valor faltante: celda vacía o código de no especificado. */
export type HarmonizedRow = Record<string, string | number | null>;

export interface DatasetHarmonizedView {
  dataset: HarmonizerDataset;
  headers: string[];
  rows: HarmonizedRow[];
  availableVariables: string[];
  selectedCount: number;
}

export interface SurveyHarmonizedView {
  survey: { id: string; name: string };
  headers: string[];
  rows: HarmonizedRow[];
  availableVariables: string[];
  selected: string[];
  selectedCount: number;
}

export type ExportFormat = 'csv' | 'parquet';
