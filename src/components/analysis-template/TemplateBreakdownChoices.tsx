import type { TemplateInput } from '../../core/models/analysis-template.model';
import type { Choices } from './useAnalysisTemplate';
import { Choice } from './TemplateChoice';

export function TemplateBreakdownChoices({
  input,
  choices,
  originOf,
  onToggle,
}: {
  input?: TemplateInput;
  choices: Choices;
  originOf: (column: string) => string;
  onToggle: (column: string) => void;
}) {
  if (!input) return null;
  const used = new Set(
    [choices.variable, choices.measure, choices.group, ...choices.conditions].map(originOf),
  );
  return (
    <fieldset className="c-analysis-template__fieldset">
      <legend className="c-analysis-template__label">Cruzar por (opcional)</legend>
      <p className="c-analysis-template__help">Elige como máximo dos cruces.</p>
      {input.options.map((option) => {
        const checked = choices.breakdowns.includes(option.column);
        const unavailable = used.has(originOf(option.column));
        return (
          <Choice
            key={option.column}
            type="checkbox"
            checked={checked}
            disabled={unavailable || (!checked && choices.breakdowns.length >= 2)}
            onChange={() => onToggle(option.column)}
          >
            {option.label}
            {unavailable ? (
              <span className="c-analysis-template__muted"> (ya se usa en otra selección)</span>
            ) : null}
          </Choice>
        );
      })}
    </fieldset>
  );
}
