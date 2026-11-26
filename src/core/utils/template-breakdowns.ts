import type {
  BreakdownDimension,
  ResultRow,
  TemplateResult,
} from '../models/analysis-template.model';

export type BreakdownSelection =
  { mode: 'all' } | { mode: 'category'; code: string } | { mode: 'compare' };
export type BreakdownSelections = Record<string, BreakdownSelection>;

/** Codes, including the empty string, are never used as control sentinels. */
export function selectBreakdown(
  current: BreakdownSelections,
  column: string,
  selection: BreakdownSelection,
): BreakdownSelections {
  const next = { ...current };
  if (selection.mode === 'compare') {
    for (const key of Object.keys(next)) {
      if (next[key].mode === 'compare') next[key] = { mode: 'all' };
    }
  }
  next[column] = selection;
  return next;
}

/** The code of a breakdown cell for exports: `*` is the marginal total («Todos»), so it never collides with a real code. */
export function breakdownCode(row: ResultRow, dimension: BreakdownDimension): string {
  return row.desagregaciones[dimension.column] ?? '*';
}

export function breakdownLabel(row: ResultRow, dimension: BreakdownDimension): string {
  const code = row.desagregaciones[dimension.column];
  if (code === null) return 'Todos';
  return dimension.categories.find((category) => category.code === code)?.label ?? code ?? '';
}

/** Filter every dimension, so totals and their parts never share a chart or table. */
export function breakdownView(result: TemplateResult, selections: BreakdownSelections) {
  // Older responses without breakdown dimensions retain their original rows and behavior.
  const dimensions = result.dimensions.breakdowns ?? [];
  const compared = dimensions.find((dimension) => selections[dimension.column]?.mode === 'compare');
  const rows = result.rows.filter((row) =>
    dimensions.every((dimension) => {
      const selection = selections[dimension.column];
      const code = row.desagregaciones[dimension.column];
      if (selection?.mode === 'compare') {
        return code !== null && dimension.categories.some((category) => category.code === code);
      }
      return code === (selection?.mode === 'category' ? selection.code : null);
    }),
  );
  const filtered = dimensions.length ? { ...result, rows } : result;
  const panels = compared
    ? compared.categories.map((category) => ({
        key: category.code,
        label: category.label,
        result: {
          ...filtered,
          rows: rows.filter((row) => row.desagregaciones[compared.column] === category.code),
        },
      }))
    : [{ key: 'all', label: null, result: filtered }];
  return { result: filtered, compared, panels };
}
