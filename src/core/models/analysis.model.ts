import type { DatasetVisibility } from './dataset.model';

export type OpName = 'join' | 'group_by' | 'aggregate' | 'compute' | 'percentage' | 'filter' | 'sort' | 'limit';

export interface OpDef {
  kind: string;
  description: string;
  params: string[];
}

export type OpCatalog = Record<OpName, OpDef>;

export interface Step {
  op: OpName;
  params: Record<string, unknown>;
}

export interface PreviewResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
}

export type AnalysisStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';

export type AnalysisOrigin = 'IBERO' | 'VIZCANVAS';

export interface Analysis {
  id: string;
  datasetId: string;
  sourceResourceId: string;
  title: string;
  slug: string;
  folder: string;
  description?: string | null;
  visibility: DatasetVisibility;
  recipe: Step[];
  origin: AnalysisOrigin;
  status: AnalysisStatus;
  errorMessage?: string | null;
  resultStorageKey?: string | null;
  resultRowCount?: number | null;
  resultColumns?: { name: string; type: string }[] | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}
