import type { AnalysisUnit, ComparisonStatus, Coverage, GeoLevel, SourceDesign } from './harmonizer.model';

export interface ResourceColumn {
  name: string;
  type: string;
}

/**
 * Metadata of the harmonized source of a resource, copied when it was saved from the harmonizer
 * (mirror of `SourceMetadata` version 2 in the server's source-metadata.ts; copies of version 1
 * are answered as version 2). Keys and roles in English; labels and universe in Spanish.
 */
export interface SourceMetadata {
  version: 2;
  /** Name of the survey; `null` in old copies. */
  title: string | null;
  /** Short name of the source ("Censo 2000"). */
  source: string | null;
  /** `null` when the editions do not share it (each edition has its own). */
  design: SourceDesign | null;
  unit: AnalysisUnit | null;
  unitPlural: string | null;
  /** The place the whole file covers. */
  total: Coverage | null;
  editions: SourceMetadataEdition[];
  /** Every column of the file, in order. */
  columns: SourceMetadataColumn[];
  /** The harmonized view it was made from; `null` in old copies. */
  origin: SourceOrigin | null;
}

export interface SourceMetadataEdition {
  id: string;
  /** `null` only in old copies. */
  name: string | null;
  year: number | null;
  design: SourceDesign | null;
  unit: AnalysisUnit | null;
  coverage: Coverage | null;
  /** Column of the file with this edition's expansion factor. */
  weight: string | null;
}

export interface SourceOrigin {
  surveyId: string;
  /** Edition view; `null` for a survey view. */
  editionId: string | null;
  variables: string[];
  signature: string;
}

export interface SourceMetadataCategory {
  code: string;
  label: string | null;
  kind: 'value' | 'missing';
}

export interface SourceMetadataColumn {
  name: string;
  /** Parquet type: `VARCHAR`, `BIGINT`, `DOUBLE`… */
  type: string;
  /** Sample design role (`weight`, `stratum`, `psu`) or use in analysis (`category`, `measure`…). */
  role?: string;
  label?: string;
  universe?: string;
  categories?: SourceMetadataCategory[];
  positiveValue?: string;
  notApplicableLabel?: string;
  unit?: string;
  geoLevel?: GeoLevel;
  disaggregation?: { summable: boolean; cuts?: { from: number; to: number | null; label: string }[]; maxLevel?: GeoLevel };
  /** Survey views: state of its codes between editions when it was saved. */
  codeReview?: ComparisonStatus;
  missingCodes?: string[];
  /**
   * With `missingCodes` only. `true`: those codes, like empty cells, are null in the file
   * (measures, variables without a role). `false`: the codes are in the file (variables of codes);
   * only empty cells («no aplica») are null.
   */
  missingCodesAreNull?: boolean;
  /** With `missingCodesAreNull: true`: per source edition id, cells that had a code. */
  missingCount?: Record<string, number>;
}

/** `GET …/resources/:resourceId/source-status`: did the harmonizer change after it was saved? */
export interface SourceStatus {
  /** It was saved from the harmonizer with a signature (version 2). */
  linked: boolean;
  stale: boolean;
  reason: 'changed' | 'source_missing' | null;
}

export interface Resource {
  id: string;
  datasetId: string;
  filename: string;
  format: string;
  sizeBytes: number;
  storageKey: string;
  columns?: ResourceColumn[] | null;
  /** `null` for uploaded files and for resources created before 2026-11-13. */
  sourceMetadata: SourceMetadata | null;
  createdAt: string;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
}
