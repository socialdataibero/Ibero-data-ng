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
}

export interface CanonicalVariable {
  id: string;
  name: string;
}

export type SuggestionSource = 'history' | 'name';

export interface MappingColumn {
  name: string;
  selectedCanonicalId: string | null;
  suggested: string | null;
  suggestionSource: SuggestionSource | null;
  missingCodes: string[];
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
