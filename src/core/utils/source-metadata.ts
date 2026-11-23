import type { SourceRole } from '../models/harmonizer.model';
import type { SourceMetadata, SourceMetadataColumn } from '../models/resource.model';

/** The metadata of one column of the resource, or `null`. */
export function columnMetadata(metadata: SourceMetadata | null, column: string): SourceMetadataColumn | null {
  return metadata?.columns.find((c) => c.name === column) ?? null;
}

/** The column with a sample design role, or `null`. */
export function roleColumn(metadata: SourceMetadata | null, role: SourceRole): string | null {
  return metadata?.columns.find((c) => c.role === role)?.name ?? null;
}

/** The expansion factor column, or `null` (census, no factor, no metadata). */
export function weightColumn(metadata: SourceMetadata | null): string | null {
  return roleColumn(metadata, 'weight');
}

/** The expansion factor column of one source edition, or `null`. */
export function editionWeight(metadata: SourceMetadata | null, editionId: string): string | null {
  return metadata?.editions.find((e) => e.id === editionId)?.weight ?? null;
}

/**
 * The "not specified" codes declared for a column: in the file for variables of codes, already
 * null for the others (`missingCodesAreNull`).
 */
export function missingCodesOf(metadata: SourceMetadata | null, column: string): string[] {
  return columnMetadata(metadata, column)?.missingCodes ?? [];
}
