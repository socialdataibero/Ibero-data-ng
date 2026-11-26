import type { Base, ResultRow, TemplateResult } from '../models/analysis-template.model';
import { csvText } from './csv';
import { breakdownCode, breakdownLabel } from './template-breakdowns';

/**
 * Reading a template result in the browser. The server sends numerators and denominators, never
 * percentages (section 3.6 of the proposal): the share is computed here, so switching the base of a
 * proportion (`den` or `den_total`) needs no new request.
 */

export type SingleBase = 'own' | 'total';

/** The value of a row with a base: a share from 0 to 1, or a mean. `null`: nobody in the universe. */
export function rowValue(row: ResultRow, base: SingleBase): number | null {
  const den = base === 'total' ? row.den_total : row.den;
  if (den === null || den === 0) return null;
  return row.num / den;
}

export function rowSe(row: ResultRow, base: SingleBase): number | null {
  return base === 'total' ? row.ee_total : row.ee;
}

export type Precision = 'alta' | 'moderada' | 'baja' | 'no calculable' | 'no calculada' | 'sin error de muestreo';

/** Provisional thresholds of the proposal's preview: coefficient of variation up to 15% and 30%. */
export function precisionOf(
  value: number | null,
  se: number | null,
  result: Pick<TemplateResult, 'value' | 'source'>,
): Precision | null {
  if (value === null) return null;
  if (result.source.design === 'census') return 'sin error de muestreo';
  if (se === null) return 'no calculada';
  if (value === 0 || (result.value.kind === 'proportion' && value === 1)) return 'no calculable';
  const cv = se / Math.abs(value);
  return cv <= 0.15 ? 'alta' : cv <= 0.3 ? 'moderada' : 'baja';
}

const countFormat = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 });

export function formatCount(n: number): string {
  return countFormat.format(n);
}

/** Percentages use one decimal, two when every figure of the view is under 1% (section 6.7). */
export function percentDigits(values: (number | null)[]): number {
  const present = values.filter((v): v is number => v !== null);
  return present.length > 0 && present.every((v) => v < 0.01) ? 2 : 1;
}

export function formatValue(
  value: number | null,
  result: Pick<TemplateResult, 'value'>,
  digits = 1,
): string {
  if (value === null) return 'Sin población en el universo';
  if (result.value.kind === 'proportion') {
    return `${(value * 100).toLocaleString('es-MX', { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
  }
  const mean = value.toLocaleString('es-MX', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return result.value.unit ? `${mean} ${result.value.unit}` : mean;
}

/** The ±1.96 × ee interval (95%), only where the error exists and the share is not 0 or 1. */
export function interval(value: number | null, se: number | null, kind: 'proportion' | 'mean'): [number, number] | null {
  if (value === null || se === null || se === 0) return null;
  const lo = value - 1.96 * se;
  const hi = value + 1.96 * se;
  return kind === 'proportion' ? [Math.max(0, lo), Math.min(1, hi)] : [lo, hi];
}

/** Shared value scale for chart panels and breakdown small multiples. */
export function valueDomain(
  result: TemplateResult,
  base: Base,
  showInterval: boolean,
): [number, number] {
  const bases: SingleBase[] = base === 'both' ? ['own', 'total'] : [base];
  const ranges = result.rows.flatMap((row) =>
    bases.map((b) => {
      const value = rowValue(row, b);
      return (
        (showInterval ? interval(value, rowSe(row, b), result.value.kind) : null) ?? [
          value ?? 0,
          value ?? 0,
        ]
      );
    }),
  );
  const max = Math.max(0, ...ranges.map((range) => range[1]));
  const min = Math.min(0, ...ranges.map((range) => range[0])) * 1.1;
  return [
    min,
    result.value.kind === 'proportion' ? (max < 0.1 ? max * 1.15 || 0.01 : 1) : max * 1.1 || 1,
  ];
}

/** What the rows of a result are split by, as text: the group (place or category) and the series. */
export function groupLabel(row: ResultRow, result: TemplateResult): string {
  const group = result.dimensions.group;
  if (!group) return row.nombre;
  if (row.es_total) return `${result.rows.find((r) => r.es_total)?.nombre ?? row.nombre} (total)`;
  return (group.column === 'nombre' ? row.nombre : row.grupo) ?? '';
}

export function seriesLabel(row: ResultRow, result: TemplateResult): string | null {
  const series = result.dimensions.series;
  if (!series) return null;
  return row[series.column];
}

/** Short series label for headings: a proportion's criterion without its universe. */
export function shortSeries(label: string | null): string {
  return label?.split(', ')[0] ?? '';
}

/** "No especificado" and "No aplica" categories: always gray, never part of a scale (section 6.9). */
export function isMissingLabel(label: string | null): boolean {
  return !!label && /^no (especificado|aplica)/i.test(label);
}

/**
 * The result table as CSV (section 2.9): every row and column, numerators and denominators
 * included so it can be added up again, and a first comment line with the source and the date.
 */
export function resultCsvRows(result: TemplateResult, now = new Date()): string[][] {
  const columns: (keyof ResultRow)[] = [
    'fuente',
    'edicion',
    'indicador',
    'criterio',
    'nivel',
    'cve',
    'nombre',
    'grupo_codigo',
    'grupo',
    'corte_codigo',
    'corte',
    'num',
    'den',
    'den_total',
    'ee',
    'ee_total',
    'casos',
    'es_total',
  ];
  const used = columns.filter((c) => result.rows.some((r) => r[c] !== null));
  const cell = (v: unknown) =>
    v === null || v === undefined ? '' : typeof v === 'string' ? csvText(v) : String(v);
  const breakdowns = result.dimensions.breakdowns ?? [];
  const split = used.indexOf('num');
  return [
    [
      `# ${result.texts.title}. Fuente: ${result.source.title}. ${result.texts.note} Generado el ${now.toLocaleDateString('es-MX')}.`,
    ],
    [
      ...used.slice(0, split),
      ...breakdowns.flatMap((dimension) => {
        const name = csvText(`desag_${dimension.column.toLowerCase()}`);
        return [`${name}_codigo`, name];
      }),
      ...used.slice(split),
    ],
    ...result.rows.map((r) => [
      ...used.slice(0, split).map((c) => cell(r[c])),
      ...breakdowns.flatMap((dimension) => [
        csvText(breakdownCode(r, dimension)),
        csvText(breakdownLabel(r, dimension)),
      ]),
      ...used.slice(split).map((c) => cell(r[c])),
    ]),
  ];
}
