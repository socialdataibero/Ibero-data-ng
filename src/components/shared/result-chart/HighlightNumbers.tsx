import type { TemplateResult } from '../../../core/models/analysis-template.model';
import {
  formatCount,
  formatValue,
  percentDigits,
  precisionOf,
  rowSe,
  rowValue,
  seriesLabel,
  type SingleBase,
} from '../../../core/utils/template-result';

const BASE_LABEL: Record<SingleBase, string> = { own: 'Universo propio', total: 'Población total' };

export function HighlightNumbers({ result, bases }: { result: TemplateResult; bases: SingleBase[] }) {
  const totals = result.rows.filter((r) => r.es_total);
  const digits = percentDigits(totals.flatMap((r) => bases.map((base) => rowValue(r, base))));
  return (
    <div className="c-result-chart__numbers">
      {totals.flatMap((row, i) =>
        bases.map((base) => {
          const value = rowValue(row, base);
          const precision = precisionOf(value, rowSe(row, base), result);
          const den = base === 'total' ? row.den_total : row.den;
          return (
            <div className="c-result-chart__number" key={`${i}-${base}`}>
              {bases.length > 1 ? (
                <span className="c-result-chart__number-label">{BASE_LABEL[base]}</span>
              ) : null}
              <span className="c-result-chart__number-value">{formatValue(value, result, digits)}</span>
              <span className="c-result-chart__number-label">
                {seriesLabel(row, result) ?? row.indicador}
              </span>
              <span className="c-result-chart__number-detail">
                {result.value.kind === 'proportion'
                  ? `${formatCount(row.num)} de ${formatCount(den ?? 0)} ${result.source.unitPlural}`
                  : `${formatCount(den ?? 0)} ${result.source.unitPlural} con dato`}
                {precision ? ` · precisión ${precision}` : ''}
              </span>
            </div>
          );
        }),
      )}
    </div>
  );
}
