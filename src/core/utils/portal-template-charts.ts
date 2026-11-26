import type { ChartBlock, TableData } from './portal-charts';

/** A tab of the public view: the charts of one breakdown cell («Todos», «Mujer»…). */
export interface TemplateTab {
  id: string;
  label: string;
  charts: ChartBlock[];
}

const SERIES_COLOR = 'var(--color-primario-3)';

/** A table published from an analysis template (see the server's `templateTable`). */
export function isTemplateTable(table: TableData | null | undefined): boolean {
  const ids = new Set((table?.columns ?? []).map((c) => c.id));
  return ids.has('es_total') && (ids.has('porcentaje') || ids.has('promedio'));
}

const present = (v: unknown) => v !== null && v !== undefined && v !== '';

/**
 * Charts of a template table as the template shows them: the value of each group, one chart per
 * condition or category and one tab per breakdown cell, never sums of percentages.
 */
export function templateTabs(table: TableData): TemplateTab[] {
  const ids = table.columns.map((c) => c.id);
  const proportion = ids.includes('porcentaje');
  const value = proportion ? 'porcentaje' : 'promedio';
  const index = table.rows.some((r) => present(r.grupo)) ? 'grupo' : 'nombre';
  const series = table.rows.some((r) => present(r.corte)) ? 'corte' : 'criterio';
  const breakdowns = ids.filter((id) => id.startsWith('desag_') && !id.endsWith('_codigo'));

  // The marginal total («Todos», code `*`) goes first, then the categories as they come.
  const keyOf = (r: Record<string, unknown>) => breakdowns.map((b) => String(r[b] ?? '')).join(' · ');
  const isAll = (r: Record<string, unknown>) => breakdowns.every((b) => r[`${b}_codigo`] === '*');
  const tabs = new Map<string, Record<string, unknown>[]>();
  for (const r of [...table.rows.filter(isAll), ...table.rows.filter((r) => !isAll(r))]) {
    const key = keyOf(r);
    tabs.set(key, [...(tabs.get(key) ?? []), r]);
  }

  return [...tabs.entries()].map(([key, rows], t) => {
    const bySeries = new Map<string, Record<string, unknown>[]>();
    for (const r of rows) {
      const s = String(r[series] ?? '');
      bySeries.set(s, [...(bySeries.get(s) ?? []), r]);
    }
    const charts = [...bySeries.entries()].map(([name, part], c): ChartBlock => ({
      id: `template-${t}-${c}`,
      title: name || (proportion ? 'Porcentaje' : 'Promedio'),
      description: proportion
        ? `Porcentaje por ${index === 'grupo' ? 'grupo' : 'lugar'}; la última barra es el total.`
        : `Promedio por ${index === 'grupo' ? 'grupo' : 'lugar'}; la última barra es el total.`,
      indexName: 'categoria',
      variables: [{ id: 'valor', name: proportion ? 'Porcentaje' : 'Promedio', color: SERIES_COLOR }],
      data: part
        .filter((r) => present(r[value]))
        .sort((a, b) => Number(a.es_total === 'sí') - Number(b.es_total === 'sí'))
        .map((r) => ({
          categoria: r.es_total === 'sí' ? `${String(r.nombre ?? '')} (total)` : String(r[index] ?? ''),
          valor: Number(r[value]),
        })),
    }));
    return { id: `cell-${t}`, label: breakdowns.length ? key : 'Resultado', charts };
  });
}
