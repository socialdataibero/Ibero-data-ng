import type { AnalysisUnit, SourceDesign, SourceRole } from './harmonizer.model';

export interface ResourceColumn {
  name: string;
  type: string;
}

/**
 * Metadata of the harmonized source of a resource, copied when it was saved from the harmonizer
 * (mirror of `SourceMetadata` in the server's source-metadata.ts). The server answers it with the
 * properties of version 1 only; other optional properties may come later.
 */
export interface SourceMetadata {
  version: 1;
  design: SourceDesign;
  unit: AnalysisUnit;
  /** Editions the data comes from, only to trace it back. */
  sourceEditionIds: string[];
  /** Every column of the file, in order. */
  columns: SourceMetadataColumn[];
}

export interface SourceMetadataColumn {
  name: string;
  /** Parquet type: `VARCHAR`, `BIGINT`, `DOUBLE`… */
  type: string;
  missingCodes?: string[];
  /**
   * With `missingCodes` only. `true`: those codes, like empty cells, are null in the file
   * (measures, variables without a role). `false`: the codes are in the file (variables of codes);
   * only empty cells («no aplica») are null.
   */
  missingCodesAreNull?: boolean;
  /** With `missingCodesAreNull: true`: per source edition id, cells that had a code. */
  missingCount?: Record<string, number>;
  role?: SourceRole;
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
  /**
   * What the analysis templates know about each variable (server: analysis/variable-metadata.ts),
   * or `null` until it is loaded. The templates page only needs to know whether it is there.
   */
  variableMetadata: { title: string; design: 'census' | 'sample' } | null;
  createdAt: string;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
}
