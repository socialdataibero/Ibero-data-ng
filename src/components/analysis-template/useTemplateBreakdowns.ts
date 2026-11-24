import { useState } from 'react';
import type { TemplateResult } from '../../core/models/analysis-template.model';
import {
  breakdownView,
  selectBreakdown,
  type BreakdownSelection,
  type BreakdownSelections,
} from '../../core/utils/template-breakdowns';

/** Local display choices are deliberately separate from the server request. */
export function useTemplateBreakdowns(result: TemplateResult | null) {
  const signature = JSON.stringify(result?.dimensions.breakdowns ?? []);
  const [state, setState] = useState<{ signature: string; selections: BreakdownSelections }>({
    signature,
    selections: {},
  });
  // Reset before rendering changed dimensions, including labels and category order.
  if (state.signature !== signature) setState({ signature, selections: {} });
  const selections = state.signature === signature ? state.selections : {};
  const select = (column: string, selection: BreakdownSelection) =>
    setState((current) => ({
      signature,
      selections: selectBreakdown(
        current.signature === signature ? current.selections : {},
        column,
        selection,
      ),
    }));
  return { selections, select, view: result ? breakdownView(result, selections) : null };
}
