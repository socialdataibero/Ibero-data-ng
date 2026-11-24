import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { analysisTemplatesService } from '../../core/services/analysis-templates.service';
import { errorMessage } from '../../core/api/http';
import { hasTemplateMetadata } from '../../core/utils/source-metadata';
import { useTemplateSource } from './useTemplateSource';
import type {
  Base,
  ChartType,
  MissingChoice,
  TemplateCatalog,
  TemplateId,
  TemplateListing,
  TemplateRequest,
  TemplateResult,
} from '../../core/models/analysis-template.model';

export interface Choices {
  variable: string;
  conditions: string[];
  measure: string;
  group: string;
  breakdowns: string[];
}

const EMPTY_CHOICES: Choices = {
  variable: '',
  conditions: [],
  measure: '',
  group: '',
  breakdowns: [],
};

/** Reasonable first choices so the user sees a result with one click: the first options. */
function defaultChoices(template: TemplateListing): Choices {
  const options = (name: string) => template.inputs.find((i) => i.name === name)?.options ?? [];
  const groups = options('group');
  const firstNonGeographic = options('variable').find((o) => o.role !== 'geographic');
  const choices = {
    variable: firstNonGeographic?.column ?? options('variable')[0]?.column ?? '',
    conditions: options('conditions')[0] ? [options('conditions')[0].column] : [],
    measure: options('measure')[0]?.column ?? '',
    group: groups.find((o) => o.role === 'geographic')?.column ?? '',
    breakdowns: [],
  };
  const mainColumns = [choices.variable, choices.measure, ...choices.conditions];
  if (mainColumns.includes(choices.group)) choices.group = '';
  return choices;
}

const toggled = (list: string[], column: string) =>
  list.includes(column) ? list.filter((c) => c !== column) : [...list, column];

/** Drops the group and the breakdowns read from a column the analysis already uses. */
function prune(choices: Choices, originOf: (column: string) => string): Choices {
  const main = [choices.variable, choices.measure, ...choices.conditions].map(originOf);
  const group = choices.group && main.includes(originOf(choices.group)) ? '' : choices.group;
  const used = group ? [...main, originOf(group)] : main;
  const breakdowns = choices.breakdowns.filter((c) => !used.includes(originOf(c)));
  return { ...choices, group, breakdowns };
}

function toRequest(
  resourceId: string,
  edition: string | null,
  template: TemplateListing,
  choices: Choices,
  missing: MissingChoice,
): TemplateRequest | null {
  const request: TemplateRequest = {
    resourceId,
    templateId: template.id,
    group: choices.group || null,
    ...(choices.breakdowns.length ? { breakdowns: choices.breakdowns } : {}),
    ...(edition ? { edition } : {}),
  };
  if (template.id === 'proportion') {
    const limits = template.inputs.find((input) => input.name === 'conditions')?.multiple;
    if (choices.conditions.length < (limits?.min ?? 1) || choices.conditions.length > (limits?.max ?? 6))
      return null;
    return { ...request, conditions: choices.conditions, missing };
  }
  if (template.id === 'distribution') {
    if (!choices.variable) return null;
    return { ...request, variable: choices.variable, missing };
  }
  if (!choices.measure) return null;
  return { ...request, measure: choices.measure };
}

export function useAnalysisTemplate() {
  const { organizationId = '', datasetId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const source = useTemplateSource(organizationId, datasetId);
  const { resources } = source;
  const [catalog, setCatalog] = useState<TemplateCatalog | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogAttempt, setCatalogAttempt] = useState(0);

  const [templateId, setTemplateId] = useState<TemplateId | null>(null);
  const [choices, setChoices] = useState<Choices>(EMPTY_CHOICES);
  const [missing, setMissing] = useState<MissingChoice>('exclude');

  const [result, setResult] = useState<TemplateResult | null>(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [runAttempt, setRunAttempt] = useState(0);
  const shape = useRef('');

  const [base, setBase] = useState<Base>('own');
  const [chart, setChart] = useState<ChartType>('barras_horizontales');
  const [showInterval, setShowInterval] = useState(false);
  const [showReference, setShowReference] = useState(true);
  const [sort, setSort] = useState<'catalog' | 'value'>('catalog');

  // The resource of `?resource=`, or the first one the templates can use.
  const resourceId = useMemo(() => {
    const wanted = searchParams.get('resource');
    if (wanted && resources?.some((r) => r.id === wanted)) return wanted;
    return resources?.find((r) => hasTemplateMetadata(r.sourceMetadata))?.id ?? resources?.[0]?.id ?? '';
  }, [resources, searchParams]);

  // The edition of the analysis, when the file has several (`?edition=`, else its first one).
  const editions = useMemo(
    () => resources?.find((r) => r.id === resourceId)?.sourceMetadata?.editions ?? [],
    [resources, resourceId],
  );
  const edition = useMemo(() => {
    if (editions.length < 2) return null;
    const wanted = searchParams.get('edition');
    return editions.find((e) => e.id === wanted)?.id ?? editions[0].id;
  }, [editions, searchParams]);

  const selectEdition = useCallback(
    (id: string) =>
      setSearchParams(
        (params) => {
          params.set('edition', id);
          return params;
        },
        { replace: true },
      ),
    [setSearchParams],
  );

  const selectResource = useCallback(
    (id: string) =>
      setSearchParams(
        (params) => {
          params.set('resource', id);
          params.delete('edition');
          return params;
        },
        { replace: true },
      ),
    [setSearchParams],
  );

  useEffect(() => {
    const controller = new AbortController();
    setCatalog(null);
    setCatalogError(null);
    setTemplateId(null);
    setChoices(EMPTY_CHOICES);
    setResult(null);
    setLive(false);
    setRunError(null);
    setRunning(false);
    if (!resourceId) return;
    analysisTemplatesService
      .list(organizationId, datasetId, resourceId, edition, controller.signal)
      .then((answer) => {
        if (!controller.signal.aborted) setCatalog(answer);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted)
          setCatalogError(errorMessage(err, 'No se pudieron cargar las plantillas.'));
      });
    return () => controller.abort();
  }, [organizationId, datasetId, resourceId, edition, catalogAttempt]);

  const template = useMemo(
    () =>
      catalog?.resourceId === resourceId
        ? (catalog.templates.find((t) => t.id === templateId) ?? null)
        : null,
    [catalog, resourceId, templateId],
  );

  const chooseTemplate = useCallback(
    (id: TemplateId) => {
      const next = catalog?.templates.find((t) => t.id === id);
      if (!next?.compatible) return;
      setTemplateId(id);
      setChoices(defaultChoices(next));
      setMissing(next.missing?.default ?? 'exclude');
      setResult(null);
      setRunError(null);
      setLive(false);
      setBase('own');
      shape.current = '';
    },
    [catalog],
  );

  const request = useMemo(
    () => (template && resourceId ? toRequest(resourceId, edition, template, choices, missing) : null),
    [template, resourceId, edition, choices, missing],
  );

  useEffect(() => {
    let active = true;
    setResult(null);
    setRunError(null);
    setRunning(false);
    if (!live || !request) return;
    setRunning(true);
    void analysisTemplatesService
      .preview(organizationId, datasetId, request)
      .then((answer) => {
        if (!active) return;
        const nextShape = `${answer.template.id}|${answer.inputs.group ?? ''}|${answer.inputs.conditions.length}`;
        const sameShape = shape.current === nextShape;
        setChart((current) =>
          sameShape && answer.charts.compatible.includes(current) ? current : answer.charts.recommended,
        );
        shape.current = nextShape;
        setResult(answer);
      })
      .catch((err: unknown) => {
        if (active) setRunError(errorMessage(err, 'No se pudo calcular el análisis.'));
      })
      .finally(() => {
        if (active) setRunning(false);
      });
    return () => {
      active = false;
    };
  }, [organizationId, datasetId, request, live, runAttempt]);

  const originOf = useCallback(
    (column: string) =>
      template?.inputs.flatMap((i) => i.options).find((o) => o.column === column)?.origin ?? column,
    [template],
  );

  const calculate = useCallback(() => {
    setLive(true);
    setRunAttempt((value) => value + 1);
  }, []);

  const setChoice = useCallback(
    <K extends keyof Choices>(key: K, value: Choices[K]) =>
      setChoices((current) => prune({ ...current, [key]: value }, originOf)),
    [originOf],
  );

  const toggleCondition = useCallback(
    (column: string) =>
      setChoices((current) => prune({ ...current, conditions: toggled(current.conditions, column) }, originOf)),
    [originOf],
  );

  const toggleBreakdown = useCallback(
    (column: string) =>
      setChoices((current) =>
        prune({ ...current, breakdowns: toggled(current.breakdowns, column).slice(0, 2) }, originOf),
      ),
    [originOf],
  );

  return {
    organizationId,
    datasetId,
    ...source,
    resourceId,
    selectResource,
    editions,
    edition,
    selectEdition,
    catalog,
    catalogError,
    retryCatalog: () => setCatalogAttempt((value) => value + 1),
    template,
    chooseTemplate,
    choices,
    setChoice,
    toggleCondition,
    toggleBreakdown,
    originOf,
    missing,
    setMissing,
    request,
    calculate,
    running,
    runError,
    result,
    base,
    setBase,
    chart,
    setChart,
    showInterval,
    setShowInterval,
    showReference,
    setShowReference,
    sort,
    setSort,
  };
}
