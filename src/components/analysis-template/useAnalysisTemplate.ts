import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { analysisTemplatesService } from '../../core/services/analysis-templates.service';
import { errorMessage } from '../../core/api/http';
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
}

const EMPTY_CHOICES: Choices = { variable: '', conditions: [], measure: '', group: '' };

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
  };
  const mainColumns = [choices.variable, choices.measure, ...choices.conditions];
  if (mainColumns.includes(choices.group)) choices.group = '';
  return choices;
}

function toRequest(
  resourceId: string,
  template: TemplateListing,
  choices: Choices,
  missing: MissingChoice,
): TemplateRequest | null {
  const request: TemplateRequest = {
    resourceId,
    templateId: template.id,
    group: choices.group || null,
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
    return resources?.find((r) => r.variableMetadata)?.id ?? resources?.[0]?.id ?? '';
  }, [resources, searchParams]);

  const selectResource = useCallback(
    (id: string) =>
      setSearchParams(
        (params) => {
          params.set('resource', id);
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
    setResult(null);
    setLive(false);
    setRunError(null);
    setRunning(false);
    if (!resourceId) return;
    analysisTemplatesService
      .list(organizationId, datasetId, resourceId, controller.signal)
      .then((answer) => {
        if (!controller.signal.aborted) setCatalog(answer);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted)
          setCatalogError(errorMessage(err, 'No se pudieron cargar las plantillas.'));
      });
    return () => controller.abort();
  }, [organizationId, datasetId, resourceId, catalogAttempt]);

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
    () => (template && resourceId ? toRequest(resourceId, template, choices, missing) : null),
    [template, resourceId, choices, missing],
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

  const calculate = useCallback(() => {
    setLive(true);
    setRunAttempt((value) => value + 1);
  }, []);

  const setChoice = useCallback(<K extends keyof Choices>(key: K, value: Choices[K]) => {
    setChoices((current) => {
      const next = { ...current, [key]: value };
      if ([next.variable, next.measure, ...next.conditions].includes(next.group)) next.group = '';
      return next;
    });
  }, []);

  const toggleCondition = useCallback((column: string) => {
    setChoices((current) => {
      const conditions = current.conditions.includes(column)
        ? current.conditions.filter((c) => c !== column)
        : [...current.conditions, column];
      return {
        ...current,
        conditions,
        group: conditions.includes(current.group) ? '' : current.group,
      };
    });
  }, []);

  return {
    organizationId,
    datasetId,
    ...source,
    resourceId,
    selectResource,
    catalog,
    catalogError,
    retryCatalog: () => setCatalogAttempt((value) => value + 1),
    template,
    chooseTemplate,
    choices,
    setChoice,
    toggleCondition,
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
