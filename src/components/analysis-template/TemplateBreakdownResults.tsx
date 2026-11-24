import { useId } from 'react';
import type { BreakdownDimension } from '../../core/models/analysis-template.model';
import type {
  BreakdownSelection,
  BreakdownSelections,
  breakdownView,
} from '../../core/utils/template-breakdowns';
import { valueDomain } from '../../core/utils/template-result';
import { ResultChart, type ResultChartOptions } from '../shared/result-chart/ResultChart';

export function TemplateBreakdownControls({
  dimensions,
  selections,
  onSelect,
}: {
  dimensions: BreakdownDimension[];
  selections: BreakdownSelections;
  onSelect: (column: string, selection: BreakdownSelection) => void;
}) {
  const id = useId();
  return dimensions.map((dimension, index) => {
    const selection = selections[dimension.column];
    const value =
      selection?.mode === 'category' ? `category:${selection.code}` : (selection?.mode ?? 'all');
    const fieldId = `${id}-${index}`;
    return (
      <div className="c-analysis-template__control" key={dimension.column}>
        <label className="c-analysis-template__label" htmlFor={fieldId}>
          {dimension.label}
        </label>
        <select
          id={fieldId}
          value={value}
          onChange={(event) => {
            const selected = event.target.value;
            onSelect(
              dimension.column,
              selected === 'all' || selected === 'compare'
                ? { mode: selected }
                : { mode: 'category', code: selected.slice('category:'.length) },
            );
          }}
        >
          <option value="all">Todos</option>
          {dimension.categories.map((category) => (
            <option key={category.code} value={`category:${category.code}`}>
              {category.label}
            </option>
          ))}
          <option value="compare">Comparar todas</option>
        </select>
      </div>
    );
  });
}

export function TemplateBreakdownCharts({
  view,
  options,
}: {
  view: ReturnType<typeof breakdownView>;
  options: ResultChartOptions;
}) {
  if (!view.compared) return <ResultChart result={view.result} options={options} />;
  const xDomain = valueDomain(view.result, options.base, options.showInterval);
  return (
    <div className="c-analysis-template__multiples">
      {view.panels.map((panel) => (
        <section className="c-analysis-template__multiple" key={panel.key}>
          <h3 className="c-analysis-template__subtitle">{panel.label}</h3>
          <ResultChart result={panel.result} options={{ ...options, xDomain }} />
        </section>
      ))}
    </div>
  );
}
