import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { datasetsService } from '../../core/services/datasets.service';
import { resourcesService } from '../../core/services/resources.service';
import { analysisTemplatesService } from '../../core/services/analysis-templates.service';
import { errorMessage, isNotFound } from '../../core/api/http';
import type { Dataset } from '../../core/models/dataset.model';
import type { Resource } from '../../core/models/resource.model';
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
  return {
    variable: firstNonGeographic?.column ?? options('variable')[0]?.column ?? '',
    conditions: options('conditions')[0] ? [options('conditions')[0].column] : [],
    measure: options('measure')[0]?.column ?? '',
    group: groups.find((o) => o.role === 'geographic')?.column ?? '',
  };
}

function toRequest(resourceId: string, template: TemplateListing, choices: Choices, missing: MissingChoice): TemplateRequest | null {
  const request: TemplateRequest = { resourceId, templateId: template.id, group: choices.group || null };
  if (template.id === 'proportion') {
    if (choices.conditions.length === 0) return null;
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

  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [resources, setResources] = useState<Resource[] | null>(null);
  const [catalog, setCatalog] = useState<TemplateCatalog | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [templateId, setTemplateId] = useState<TemplateId | null>(null);
  const [choices, setChoices] = useState<Choices>(EMPTY_CHOICES);
  const [missing, setMissing] = useState<MissingChoice>('exclude');

  const [result, setResult] = useState<TemplateResult | null>(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  // After the first "Calcular", any change of the choices recomputes on its own.
  const [live, setLive] = useState(false);
  const runId = useRef(0);

  const [base, setBase] = useState<Base>('own');
  const [chart, setChart] = useState<ChartType>('barras_horizontales');
  const [showInterval, setShowInterval] = useState(false);
  const [showReference, setShowReference] = useState(true);
  const [sort, setSort] = useState<'catalog' | 'value'>('catalog');

  useEffect(() => {
    setNotFound(false);
    void datasetsService
      .get(organizationId, datasetId)
      .then(setDataset)
      .catch((err: unknown) => {
        if (isNotFound(err)) setNotFound(true);
      });
    void resourcesService
      .list(organizationId, datasetId)
      .then(setResources)
      .catch((err: unknown) => {
        if (isNotFound(err)) setNotFound(true);
        setResources([]);
      });
  }, [organizationId, datasetId]);

  // The resource of `?resource=`, or the first one the templates can use.
  const resourceId = useMemo(() => {
    const wanted = searchParams.get('resource');
    if (wanted && resources?.some((r) => r.id === wanted)) return wanted;
    return resources?.find((r) => r.variableMetadata)?.id ?? resources?.[0]?.id ?? '';
  }, [resources, searchParams]);

  const selectResource = useCallback(
    (id: string) => setSearchParams((params) => {
      params.set('resource', id);
      return params;
    }, { replace: true }),
    [setSearchParams],
  );

  useEffect(() => {
    if (!resourceId) return;
    const controller = new AbortController();
    setCatalog(null);
    setCatalogError(null);
    setTemplateId(null);
    setResult(null);
    setLive(false);
    analysisTemplatesService
      .list(organizationId, datasetId, resourceId, controller.signal)
      .then(setCatalog)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setCatalogError(errorMessage(err, 'No se pudieron cargar las plantillas.'));
      });
    return () => controller.abort();
  }, [organizationId, datasetId, resourceId]);

  const template = useMemo(
    () => catalog?.templates.find((t) => t.id === templateId) ?? null,
    [catalog, templateId],
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
    },
    [catalog],
  );

  const request = useMemo(
    () => (template && resourceId ? toRequest(resourceId, template, choices, missing) : null),
    [template, resourceId, choices, missing],
  );

  const run = useCallback(async () => {
    if (!request) return;
    const id = ++runId.current;
    setRunning(true);
    setRunError(null);
    try {
      const answer = await analysisTemplatesService.preview(organizationId, datasetId, request);
      if (id !== runId.current) return;
      setResult(answer);
      setChart((current) => (answer.charts.compatible.includes(current) ? current : answer.charts.recommended));
      setLive(true);
    } catch (err) {
      if (id !== runId.current) return;
      setRunError(errorMessage(err, 'No se pudo calcular el análisis.'));
    } finally {
      if (id === runId.current) setRunning(false);
    }
  }, [organizationId, datasetId, request]);

  // Recompute when a choice changes once a result is on screen.
  const requestKey = JSON.stringify(request);
  const lastKey = useRef<string | null>(null);
  useEffect(() => {
    if (!live || requestKey === lastKey.current) return;
    lastKey.current = requestKey;
    void run();
  }, [live, requestKey, run]);

  const calculate = useCallback(() => {
    lastKey.current = requestKey;
    void run();
  }, [requestKey, run]);

  // A new grouping or template changes which charts fit: show the recommended one.
  const shape = result ? `${result.template.id}|${result.inputs.group ?? ''}|${result.inputs.conditions.length}` : '';
  useEffect(() => {
    if (result) setChart(result.charts.recommended);
    // Only when the shape changes, not on every recompute.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape]);

  const setChoice = useCallback(<K extends keyof Choices>(key: K, value: Choices[K]) => {
    setChoices((current) => ({ ...current, [key]: value }));
  }, []);

  const toggleCondition = useCallback((column: string) => {
    setChoices((current) => ({
      ...current,
      conditions: current.conditions.includes(column)
        ? current.conditions.filter((c) => c !== column)
        : [...current.conditions, column],
    }));
  }, []);

  return {
    organizationId,
    datasetId,
    dataset,
    notFound,
    resources,
    resourceId,
    selectResource,
    catalog,
    catalogError,
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
