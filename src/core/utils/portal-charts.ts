import type { ReactNode } from 'react';

export interface TableColumn {
  id: string;
  type?: string;
}

export interface TableData {
  columns: TableColumn[];
  rows: Record<string, unknown>[];
  total?: number;
  source?: string;
}

export interface ChartVariable {
  id: string;
  name: string;
  color: string;
}

export interface ChartBlock {
  id: string;
  title: string;
  description: string;
  indexName: string;
  variables: ChartVariable[];
  data: Record<string, unknown>[];
}

const SERIES_COLOR = 'var(--color-primario-3)';
const NOT_A_MEASURE = /^(_?id|.*_id|folio.*|clave.*|cve(_.*)?|c(o|ó)digo.*|a(n|ñ)i?o|year|fecha)$/i;
const MAX_BARS = 12;
const MAX_CHARTS = 3;
const MAX_CATEGORIES = 15;

function isNumber(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return false;
  return !Number.isNaN(Number(value));
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Text that only looks like a number: "01001" is a place, and adding it up means nothing. */
const LEADING_ZERO = /^0\d/;

interface ProfiledColumn extends TableColumn {
  distinct: number;
  present: number;
  numeric: boolean;
  code: boolean;
}

function profile(columns: TableColumn[], rows: Record<string, unknown>[]): ProfiledColumn[] {
  return columns.map((column) => {
    const values = rows.map((row) => row[column.id]);
    const present = values.filter((v) => v !== null && v !== undefined && v !== '');
    const distinct = new Set(present.map((v) => String(v))).size;
    return {
      ...column,
      distinct,
      present: present.length,
      numeric: present.length > 0 && present.every(isNumber),
      code: NOT_A_MEASURE.test(column.id) || present.some((v) => typeof v === 'string' && LEADING_ZERO.test(v)),
    };
  });
}

export function labelColumn(name: string | undefined | null): string {
  const clean = String(name ?? '')
    .replace(/[_-]+/g, ' ')
    .trim();
  if (!clean) return 'Sin nombre';
  if (/^\d+$/.test(clean)) return `Columna ${clean}`;
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function aggregate(
  rows: Record<string, unknown>[],
  categoryKey: string,
  measureKey?: string,
): { categoria: string; valor: number }[] {
  const accumulator = new Map<string, number>();

  for (const row of rows) {
    const raw = row[categoryKey];
    if (raw === null || raw === undefined || raw === '') continue;
    const category = String(raw);
    const sum = accumulator.get(category) ?? 0;
    accumulator.set(category, sum + (measureKey ? toNumber(row[measureKey]) : 1));
  }

  return [...accumulator.entries()]
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, MAX_BARS);
}

export function deriveCharts(
  table: TableData | null | undefined,
  options: { seriesName?: string; maxCharts?: number } = {},
): ChartBlock[] {
  const { seriesName = 'Total', maxCharts = MAX_CHARTS } = options;
  const columns = table?.columns ?? [];
  const rows = table?.rows ?? [];
  if (!columns.length || !rows.length) return [];

  const profiled = profile(columns, rows);

  const measure = profiled.find((c) => c.numeric && c.distinct > 1 && !c.code);

  const candidates = profiled.filter(
    (c) => c.id !== measure?.id && c.distinct > 1 && c.present > 0,
  );
  // Another measure is not a category, unless there is nothing else to split by.
  const named = candidates.filter((c) => !c.numeric || c.code);
  const pool = named.length ? named : candidates;
  const readable = pool.filter((c) => c.distinct <= MAX_CATEGORIES);
  const chosen = (readable.length ? readable : pool)
    .sort((a, b) => a.distinct - b.distinct)
    .slice(0, maxCharts);

  return chosen
    .map((category): ChartBlock | null => {
      const data = aggregate(rows, category.id, measure?.id);
      if (!data.length) return null;

      return {
        id: `chart-${category.id}`,
        title: labelColumn(category.id),
        description: measure
          ? `Suma de ${labelColumn(measure.id)} por ${labelColumn(category.id).toLowerCase()}`
          : `Número de registros por ${labelColumn(category.id).toLowerCase()}`,
        indexName: 'categoria',
        variables: [
          {
            id: 'valor',
            name: measure ? labelColumn(measure.id) : seriesName,
            color: SERIES_COLOR,
          },
        ],
        data,
      };
    })
    .filter((chart): chart is ChartBlock => chart !== null);
}

export function tableForModal(
  table: TableData | null | undefined,
  maxRows = 25,
): { columns: { id: string; label: string }[]; rows: (Record<string, ReactNode> & { key: string })[] } {
  const columns = (table?.columns ?? []).map((c) => ({ id: c.id, label: labelColumn(c.id) }));
  const rows = (table?.rows ?? []).slice(0, maxRows).map((row, index) => ({
    key: `row-${index}`,
    ...Object.fromEntries(columns.map((c) => [c.id, (row[c.id] as ReactNode) ?? ''])),
  }));
  return { columns, rows };
}

export function tableToCsv(table: TableData | null | undefined): string {
  const columns = (table?.columns ?? []).map((c) => c.id);
  const escape = (value: unknown) => {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const header = columns.map(escape).join(',');
  const body = (table?.rows ?? []).map((row) => columns.map((c) => escape(row[c])).join(','));
  return [header, ...body].join('\n');
}
