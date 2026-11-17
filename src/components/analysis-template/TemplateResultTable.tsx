import type { Base, TemplateResult } from '../../core/models/analysis-template.model';
import {
  formatCount,
  formatValue,
  groupLabel,
  percentDigits,
  precisionOf,
  rowSe,
  rowValue,
  seriesLabel,
  type SingleBase,
} from '../../core/utils/template-result';

const BASE_HEADING: Record<SingleBase, string> = {
  own: 'universo propio',
  total: 'población total',
};

/**
 * The result as a table (section 6.10): every row with its numerator, denominator, value,
 * precision and records, so no information is lost by the chart. Totals go last, in bold.
 */
export function TemplateResultTable({ result, base }: { result: TemplateResult; base: Base }) {
  const proportion = result.value.kind === 'proportion';
  const bases: SingleBase[] = !proportion ? ['own'] : base === 'both' ? ['own', 'total'] : [base];
  const digits = percentDigits(result.rows.flatMap((r) => bases.map((b) => rowValue(r, b))));
  const group = result.dimensions.group;
  // A single condition or category does not need its own column: it is in the title.
  const series =
    result.dimensions.series && new Set(result.rows.map((r) => seriesLabel(r, result))).size > 1
      ? result.dimensions.series
      : null;
  const people = result.source.unitPlural;
  const distribution = result.template.id === 'distribution';

  return (
    <div
      className="c-analysis-template__table-wrap"
      role="region"
      aria-label="Tabla de resultados"
      tabIndex={0}
    >
      <table className="c-analysis-template__table">
        <caption className="c-analysis-template__help">{result.texts.title}</caption>
        <thead>
          <tr>
            {series ? <th scope="col">{series.label}</th> : null}
            <th scope="col">{group ? group.label : 'Lugar'}</th>
            {bases.map((b) => (
              <th scope="col" className="is-number" key={`v-${b}`}>
                {proportion
                  ? `% ${bases.length > 1 || base === 'total' ? BASE_HEADING[b] : ''}`.trim()
                  : result.value.label}
              </th>
            ))}
            <th scope="col" className="is-number">
              {distribution ? people.charAt(0).toUpperCase() + people.slice(1) : proportion ? `Cumplen (${people})` : `Suma (${result.value.unit ?? 'valor'} × factor)`}
            </th>
            {bases.map((b) => (
              <th scope="col" className="is-number" key={`d-${b}`}>
                {distribution ? 'Total del grupo' : proportion ? `Base: ${BASE_HEADING[b]}` : `Con dato (${people})`}
              </th>
            ))}
            {bases.map((b) => (
              <th scope="col" key={`p-${b}`}>
                Precisión{bases.length > 1 ? `: ${BASE_HEADING[b]}` : ''}
              </th>
            ))}
            <th scope="col" className="is-number">
              Registros
            </th>
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, i) => (
            <tr key={i} className={row.es_total ? 'is-total' : undefined}>
              {series ? <td>{seriesLabel(row, result)}</td> : null}
              <td>{group ? groupLabel(row, result) : row.nombre}</td>
              {bases.map((b) => (
                <td className="is-number" key={`v-${b}`}>
                  {formatValue(rowValue(row, b), result, digits)}
                </td>
              ))}
              <td className="is-number">{formatCount(row.num)}</td>
              {bases.map((b) => (
                <td className="is-number" key={`d-${b}`}>
                  {formatCount((b === 'total' ? row.den_total : row.den) ?? 0)}
                </td>
              ))}
              {bases.map((b) => (
                <td key={`p-${b}`}>{precisionOf(rowValue(row, b), rowSe(row, b), result) ?? '—'}</td>
              ))}
              <td className="is-number">{formatCount(row.casos)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {result.rows.length === 0 ? <p role="status">No hay población con dato para esta selección.</p> : null}
    </div>
  );
}
