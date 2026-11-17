import { useEffect, useMemo, useRef, useState } from 'react';
import * as Plot from '@observablehq/plot';
import type { Base, ChartType, ResultRow, TemplateResult } from '../../../core/models/analysis-template.model';
import {
  formatCount,
  formatValue,
  groupLabel,
  interval,
  isMissingLabel,
  percentDigits,
  precisionOf,
  rowSe,
  rowValue,
  seriesLabel,
  shortSeries,
  type Precision,
  type SingleBase,
} from '../../../core/utils/template-result';
import './result-chart.css';

/**
 * The generic chart of the analysis templates (section 6 of the proposal), drawn with Observable
 * Plot from the result rows and their roles (`dimensions`), never from the template itself. Every
 * panel of one result shares the same scale, so they can be compared.
 */

export interface ResultChartOptions {
  chart: Exclude<ChartType, 'tabla'>;
  base: Base;
  showInterval: boolean;
  showReference: boolean;
  sort: 'catalog' | 'value';
}

const BASE_LABEL: Record<SingleBase, string> = { own: 'Universo propio', total: 'Población total' };
const BASE_COLOR: Record<SingleBase, string> = { own: '#2f6db3', total: '#c46a1b' };
const BAR_COLOR = '#2f6db3';
const GRAY = '#9a9a9a';
const PALETTE = ['#2f6db3', '#c46a1b', '#3d8f4f', '#8a5cb8', '#b8434b', '#2a8c8c', '#a07b1f'];

interface Point {
  group: string;
  series: string | null;
  base: string;
  value: number | null;
  lo: number | null;
  hi: number | null;
  precision: Precision | null;
  title: string;
  row: ResultRow;
}

function useContainerWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.floor(entry.contentRect.width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

function PlotFigure({ options }: { options: Plot.PlotOptions }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const figure = Plot.plot(options);
    ref.current?.replaceChildren(figure);
    return () => figure.remove();
  }, [options]);
  return <div ref={ref} className="c-result-chart__figure" />;
}

function pointsOf(rows: ResultRow[], result: TemplateResult, bases: SingleBase[], digits: number): Point[] {
  return rows.flatMap((row) =>
    bases.map((base) => {
      const value = rowValue(row, base);
      const se = rowSe(row, base);
      const range = interval(value, se, result.value.kind);
      const precision = precisionOf(value, se, result);
      const den = base === 'total' ? row.den_total : row.den;
      const lines = [
        `${groupLabel(row, result)}${seriesLabel(row, result) ? ` · ${shortSeries(seriesLabel(row, result))}` : ''}`,
        bases.length > 1 ? BASE_LABEL[base] : null,
        formatValue(value, result, digits),
        result.value.kind === 'proportion'
          ? `${formatCount(row.num)} de ${formatCount(den ?? 0)} ${result.source.unitPlural}`
          : `${formatCount(den ?? 0)} ${result.source.unitPlural} con dato`,
        precision ? `Precisión: ${precision}` : null,
        `Registros en la muestra: ${formatCount(row.casos)}`,
      ];
      return {
        group: groupLabel(row, result),
        series: seriesLabel(row, result),
        base: BASE_LABEL[base],
        value,
        lo: range?.[0] ?? null,
        hi: range?.[1] ?? null,
        precision,
        title: lines.filter(Boolean).join('\n'),
        row,
      };
    }),
  );
}

/** Big figure(s) for a result without groups: one per series. */
function HighlightNumbers({ result, base }: { result: TemplateResult; base: SingleBase }) {
  const totals = result.rows.filter((r) => r.es_total);
  const digits = percentDigits(totals.map((r) => rowValue(r, base)));
  return (
    <div className="c-result-chart__numbers">
      {totals.map((row, i) => {
        const value = rowValue(row, base);
        const precision = precisionOf(value, rowSe(row, base), result);
        const den = base === 'total' ? row.den_total : row.den;
        return (
          <div className="c-result-chart__number" key={i}>
            <span className="c-result-chart__number-value">{formatValue(value, result, digits)}</span>
            <span className="c-result-chart__number-label">{seriesLabel(row, result) ?? row.indicador}</span>
            <span className="c-result-chart__number-detail">
              {result.value.kind === 'proportion'
                ? `${formatCount(row.num)} de ${formatCount(den ?? 0)} ${result.source.unitPlural}`
                : `${formatCount(den ?? 0)} ${result.source.unitPlural} con dato`}
              {precision ? ` · precisión ${precision}` : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ResultChart({ result, options }: { result: TemplateResult; options: ResultChartOptions }) {
  const { ref, width } = useContainerWidth();
  const bases: SingleBase[] = options.base === 'both' ? ['own', 'total'] : [options.base];
  const grouped = result.dimensions.group !== null;
  const proportion = result.value.kind === 'proportion';

  const panels = useMemo(() => {
    const allValues = result.rows.flatMap((r) => bases.map((b) => rowValue(r, b)));
    const digits = percentDigits(allValues);
    const tick = (d: number) =>
      proportion ? `${(d * 100).toLocaleString('es-MX', { maximumFractionDigits: digits + 1 })}%` : d.toLocaleString('es-MX');

    if (options.chart === 'barras_apiladas_100') {
      const groupRows = result.rows.filter((r) => !r.es_total);
      const totalRows = result.rows.filter((r) => r.es_total);
      const points = pointsOf([...groupRows, ...totalRows], result, ['own'], digits);
      const groups = [...new Set(points.map((p) => p.group))];
      const series = [...new Set(points.map((p) => p.series ?? ''))];
      const range = series.map((s, i) => (isMissingLabel(s) ? GRAY : PALETTE[i % PALETTE.length]));
      return [
        {
          key: 'stacked',
          title: null as string | null,
          options: {
            width,
            height: groups.length * 28 + 70,
            marginLeft: Math.min(260, 12 + 7 * Math.max(...groups.map((g) => g.length))),
            style: { fontSize: '13px', fontFamily: 'inherit', background: 'transparent' },
            x: { domain: [0, 1], tickFormat: tick, label: null, grid: true },
            y: { domain: groups, label: null },
            color: { domain: series, range, legend: true },
            marks: [
              Plot.barX(
                points,
                Plot.stackX({ x: 'value', y: 'group', fill: 'series', order: series, title: 'title', tip: true }),
              ),
              Plot.ruleX([0]),
            ],
          } as Plot.PlotOptions,
        },
      ];
    }

    // One panel per series when there is a group (all with the same scale); otherwise one panel.
    const seriesValues = grouped
      ? [...new Set(result.rows.map((r) => seriesLabel(r, result)))]
      : [null];
    const allPoints = pointsOf(result.rows, result, bases, digits);
    const maxValue = Math.max(
      0,
      ...allPoints.map((p) => (options.showInterval ? (p.hi ?? p.value ?? 0) : (p.value ?? 0))),
    );
    const domainMax = proportion ? (maxValue < 0.1 ? maxValue * 1.15 || 0.01 : 1) : maxValue * 1.1 || 1;

    return seriesValues.map((series) => {
      const rows = grouped
        ? result.rows.filter((r) => !r.es_total && seriesLabel(r, result) === series)
        : result.rows.filter((r) => r.es_total);
      const total = grouped ? result.rows.find((r) => r.es_total && seriesLabel(r, result) === series) : undefined;
      let points = pointsOf(rows, result, bases, digits);
      // Without a group, each bar is a series (a condition, or a category of a distribution).
      if (!grouped) points = points.map((p) => ({ ...p, group: shortSeries(p.series) || p.group }));
      if (options.sort === 'value') {
        const first = (g: string) => points.find((p) => p.group === g)?.value ?? -1;
        points = [...points].sort((a, b) => first(b.group) - first(a.group));
      }
      const groups = [...new Set(points.map((p) => p.group))];
      const both = bases.length > 1;
      const yKey = both ? 'base' : 'group';
      const fy = both ? 'group' : undefined;
      const fill = both
        ? 'base'
        : (p: Point) => (isMissingLabel(p.group) || isMissingLabel(p.series) ? GRAY : BAR_COLOR);
      const opacity = (p: Point) => (p.precision === 'baja' ? 0.45 : 1);
      const withInterval = points.filter((p) => p.lo !== null);
      const empty = points.filter((p) => p.value === null);
      const reference = total ? rowValue(total, bases[0]) : null;
      const lollipop = options.chart === 'lollipop';

      const marks: Plot.Markish[] = [Plot.ruleX([0])];
      if (lollipop) {
        marks.push(
          Plot.ruleY(points, { y: yKey, fy, x1: 0, x2: 'value', stroke: fill, strokeOpacity: opacity }),
          Plot.dot(points, { x: 'value', y: yKey, fy, fill, fillOpacity: opacity, r: 5, title: 'title', tip: true }),
        );
      } else {
        marks.push(
          Plot.barX(points, { x: 'value', y: yKey, fy, fill, fillOpacity: opacity, title: 'title', tip: true }),
        );
      }
      if (options.showInterval) {
        marks.push(
          Plot.ruleY(withInterval, { y: yKey, fy, x1: 'lo', x2: 'hi', stroke: 'currentColor', strokeWidth: 1.5 }),
          Plot.tickX(withInterval, { x: 'lo', y: yKey, fy, stroke: 'currentColor', inset: 6 }),
          Plot.tickX(withInterval, { x: 'hi', y: yKey, fy, stroke: 'currentColor', inset: 6 }),
        );
      }
      if (empty.length > 0) {
        marks.push(
          Plot.text(empty, {
            x: 0,
            y: yKey,
            fy,
            text: () => 'Sin población en el universo',
            textAnchor: 'start',
            dx: 4,
            fill: 'currentColor',
            fillOpacity: 0.7,
          }),
        );
      }
      if (options.showReference && reference !== null && !both) {
        marks.push(
          Plot.ruleX([reference], { stroke: 'currentColor', strokeDasharray: '4 3' }),
          Plot.text([reference], {
            x: (d: number) => d,
            frameAnchor: 'top',
            dy: -14,
            text: () => `${total!.nombre}: ${formatValue(reference, result, digits)}`,
            fill: 'currentColor',
          }),
        );
      }
      const labelWidth = Math.min(260, 12 + 7 * Math.max(...groups.map((g) => g.length)));
      return {
        key: series ?? 'all',
        title: grouped && series ? series : null,
        options: {
          width,
          height: both ? groups.length * 44 + 60 : groups.length * 28 + 56,
          marginLeft: both ? 8 : labelWidth,
          marginTop: options.showReference && reference !== null && !both ? 30 : 16,
          marginRight: 24,
          style: { fontSize: '13px', fontFamily: 'inherit', background: 'transparent' },
          x: { domain: [0, domainMax], tickFormat: tick, label: null, grid: true },
          y: both ? { axis: null, domain: bases.map((b) => BASE_LABEL[b]) } : { domain: groups, label: null },
          ...(both
            ? {
                fy: { domain: groups, label: null, axis: 'left' as const },
                marginLeft: labelWidth,
                color: {
                  domain: bases.map((b) => BASE_LABEL[b]),
                  range: bases.map((b) => BASE_COLOR[b]),
                  legend: true,
                },
              }
            : {}),
          marks,
        } as Plot.PlotOptions,
      };
    });
  }, [result, options, width, grouped, proportion, bases.join()]);

  if (options.chart === 'numero_destacado') {
    return <HighlightNumbers result={result} base={bases[0]} />;
  }

  return (
    <div className="c-result-chart" ref={ref}>
      {panels.map((panel) => (
        <figure key={panel.key} className="c-result-chart__panel">
          {panel.title ? <figcaption className="c-result-chart__caption">{panel.title}</figcaption> : null}
          <PlotFigure options={panel.options} />
        </figure>
      ))}
      {result.source.design === 'sample' && options.chart !== 'barras_apiladas_100' ? (
        <p className="c-result-chart__legend-note">
          Las marcas más claras tienen precisión baja (coeficiente de variación mayor a 30%).
          {options.showInterval ? ' Las líneas negras son el intervalo de confianza al 95%.' : ''}
        </p>
      ) : null}
    </div>
  );
}
