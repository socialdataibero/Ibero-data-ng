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

/** The "not specified" codes declared for a column (already null in the file). */
export function missingCodesOf(metadata: SourceMetadata | null, column: string): string[] {
  return columnMetadata(metadata, column)?.missingCodes ?? [];
}
