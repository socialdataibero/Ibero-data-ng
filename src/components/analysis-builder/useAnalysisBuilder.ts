import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from 'react';
import { analysesService } from '../../core/services/analyses.service';
import { errorMessage, fieldErrors } from '../../core/api/http';
import { isValidSlug } from '../../core/utils/validation';
import type {
  Analysis,
  OpCatalog,
  OpName,
  PreviewResult,
  Step,
} from '../../core/models/analysis.model';
import type { DatasetVisibility } from '../../core/models/dataset.model';
import type { Resource, ResourceColumn } from '../../core/models/resource.model';

export const OP_LABELS: Record<OpName, string> = {
  join: 'Cruzar con otro recurso',
  group_by: 'Agrupar por',
  aggregate: 'Calcular (suma/promedio/…)',
  compute: 'Crear columna (multiplicar)',
  percentage: 'Convertir a porcentaje',
  filter: 'Filtrar filas',
  sort: 'Ordenar',
  limit: 'Limitar filas (top N)',
};

/** The trimmed result name of a compute, aggregate or percentage step ('' while unnamed). */
function resultName(step: Step): string {
  return typeof step.params['as'] === 'string' ? step.params['as'].trim() : '';
}

export const OP_DESCRIPTIONS: Record<OpName, string> = {
  join: 'Cruza este dataset con otro resource por una columna en común (ej: hogares + personas por folio). El otro resource debe ser del mismo dataset.',
  group_by: 'Agrupa las filas por una o más columnas. Úsalo con cálculos para resumir por grupo.',
  aggregate: 'Calcula un valor por grupo: suma, promedio, conteo, mínimo, máximo o mediana.',
  compute:
    'Crea una columna nueva multiplicando dos columnas (o una columna por un número). Útil para aplicar el factor de expansión de una encuesta.',
  percentage: 'Convierte un cálculo en su porcentaje del total.',
  filter: 'Conserva solo las filas que cumplen una condición (antes de agrupar).',
  sort: 'Ordena el resultado por una columna, ascendente o descendente.',
  limit: 'Devuelve solo las primeras N filas (top N).',
};

export const AGG_FUNCS = ['SUM', 'AVG', 'COUNT', 'MIN', 'MAX', 'MEDIAN'];
export const OPERATORS = ['=', '!=', '<', '<=', '>', '>='];
export const JOIN_TYPES = ['inner', 'left'];

const DEFAULT_PARAMS: Record<OpName, Record<string, unknown>> = {
  join: { resourceId: '', alias: '', type: 'inner', onLeft: '', onRight: '' },
  group_by: { columns: [] },
  aggregate: { func: 'SUM', column: '', as: '', distinct: false },
  compute: { left: '', right: '', as: '' },
  percentage: { of: '', as: '' },
  filter: { column: '', operator: '=', value: '' },
  sort: { column: '', dir: 'desc' },
  limit: { n: 100 },
};

export interface AnalysisBuilderOptions {
  organizationId: string;
  datasetId: string;
  resourceId: string;
  resourceColumns?: ResourceColumn[] | null;
  datasetResources?: Resource[];
  editingAnalysis?: Analysis | null;
  onEditingConsumed?: () => void;
}

export function useAnalysisBuilder({
  organizationId,
  datasetId,
  resourceId,
  resourceColumns = null,
  datasetResources = [],
  editingAnalysis = null,
  onEditingConsumed,
}: AnalysisBuilderOptions) {
  const [opCatalog, setOpCatalog] = useState<OpCatalog | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [newOp, setNewOp] = useState<OpName>('group_by');

  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [roundDecimals, setRoundDecimals] = useState('');

  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAnalysis, setSavedAnalysis] = useState<Analysis | null>(null);
  const [editingAnalysisId, setEditingAnalysisId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [folder, setFolder] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<DatasetVisibility>('PRIVATE');

  const [errorTitle, setErrorTitle] = useState('');
  const [errorSlug, setErrorSlug] = useState('');
  const [errorFolder, setErrorFolder] = useState('');

  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(true);
  const [openAnalysisId, setOpenAnalysisId] = useState<string | null>(null);
  const [openAnalysisData, setOpenAnalysisData] = useState<PreviewResult | null>(null);

  const [openingVizCanvasId, setOpeningVizCanvasId] = useState<string | null>(null);
  const [vizCanvasError, setVizCanvasError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Analysis | null>(null);

  const reloadAnalyses = useCallback(async () => {
    setLoadingAnalyses(true);
    try {
      setAnalyses(await analysesService.list(organizationId, datasetId));
    } finally {
      setLoadingAnalyses(false);
    }
  }, [organizationId, datasetId]);

  useEffect(() => {
    void analysesService.operations(organizationId, datasetId).then(setOpCatalog);
    void reloadAnalyses();
  }, [organizationId, datasetId, reloadAnalyses]);

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setSteps([]);
    setPreviewResult(null);
  }, [resourceId]);

  useEffect(() => {
    if (!editingAnalysis) return;
    setEditingAnalysisId(editingAnalysis.id);
    setSteps(editingAnalysis.recipe);
    setTitle(editingAnalysis.title);
    setSlug(editingAnalysis.slug);
    setFolder(editingAnalysis.folder);
    setDescription(editingAnalysis.description ?? '');
    setVisibility(editingAnalysis.visibility);
    setRoundDecimals('');
    setShowSaveForm(true);
    setPreviewResult(null);
    setPreviewError(null);
    setSaveError(null);
    setSavedAnalysis(null);
    setErrorTitle('');
    setErrorSlug('');
    setErrorFolder('');
    onEditingConsumed?.();
  }, [editingAnalysis, onEditingConsumed]);

  const otherResources = useMemo(
    () => datasetResources.filter((r) => r.id !== resourceId),
    [datasetResources, resourceId],
  );

  const columnsForResource = useCallback(
    (id: string) => (datasetResources.find((r) => r.id === id)?.columns ?? []).map((c) => c.name),
    [datasetResources],
  );

  // Columns that exist on every row: the file, joined resources and "Crear columna" results.
  // Group by, filter, aggregate and compute run row by row, so only these work there.
  const rowColumns = useMemo<string[]>(() => {
    const base = (resourceColumns ?? []).map((c) => c.name);
    const derived: string[] = [];
    const joined: string[] = [];
    for (const step of steps) {
      if (step.op === 'compute' && resultName(step)) {
        derived.push(resultName(step));
      }
      if (step.op === 'join' && typeof step.params['resourceId'] === 'string') {
        joined.push(...columnsForResource(step.params['resourceId']));
      }
    }
    return [...new Set([...base, ...joined, ...derived])];
  }, [resourceColumns, steps, columnsForResource]);

  const aggregateAliases = useMemo<string[]>(
    () => steps.filter((s) => s.op === 'aggregate' && resultName(s)).map(resultName),
    [steps],
  );

  // Once the analysis groups or aggregates, its rows are groups: sort can only use the
  // grouped columns and the aggregate and percentage results.
  const sortColumns = useMemo<string[]>(() => {
    const groupBy = steps.flatMap((s) => (s.op === 'group_by' ? ((s.params['columns'] as string[]) ?? []) : []));
    if (groupBy.length === 0 && aggregateAliases.length === 0) return rowColumns;
    const percentages = steps.filter((s) => s.op === 'percentage' && resultName(s)).map(resultName);
    return [...new Set([...groupBy, ...aggregateAliases, ...percentages])];
  }, [steps, rowColumns, aggregateAliases]);

  const setParam = useCallback((index: number, key: string, value: unknown) => {
    setSteps((previous) =>
      previous.map((step, i) =>
        i === index ? { ...step, params: { ...step.params, [key]: value } } : step,
      ),
    );
  }, []);

  const onJoinResourceChange = (index: number, step: Step, newResourceId: string) => {
    const resource = datasetResources.find((r) => r.id === newResourceId);
    const alias =
      step.params['alias'] ||
      (resource ? resource.filename.replace(/\.[^./]+$/, '').replace(/[^a-zA-Z0-9_]/g, '_') : '');
    setSteps((previous) =>
      previous.map((s, i) =>
        i === index ? { ...s, params: { ...s.params, resourceId: newResourceId, alias } } : s,
      ),
    );
  };

  const addStep = () => {
    setSteps((previous) => [...previous, { op: newOp, params: { ...DEFAULT_PARAMS[newOp] } }]);
    setPreviewResult(null);
  };

  const removeStep = (index: number) => {
    setSteps((previous) => previous.filter((_, i) => i !== index));
    setPreviewResult(null);
  };

  const toggleGroupByColumn = (index: number, step: Step, column: string) => {
    const cols = (step.params['columns'] as string[]) ?? [];
    setParam(
      index,
      'columns',
      cols.includes(column) ? cols.filter((c) => c !== column) : [...cols, column],
    );
  };

  const isGroupByColumnSelected = (step: Step, column: string) =>
    ((step.params['columns'] as string[]) ?? []).includes(column);

  const runPreview = async () => {
    if (steps.length === 0) return;
    setPreviewing(true);
    setPreviewError(null);
    try {
      setPreviewResult(
        await analysesService.preview(
          organizationId,
          datasetId,
          resourceId,
          steps,
          roundDecimals === '' ? undefined : Number(roundDecimals),
        ),
      );
    } catch (err) {
      setPreviewError(errorMessage(err, 'El preview falló.'));
    } finally {
      setPreviewing(false);
    }
  };

  const cancelEdit = () => {
    setEditingAnalysisId(null);
    setSteps([]);
    setShowSaveForm(false);
    setTitle('');
    setSlug('');
    setFolder('');
    setDescription('');
    setPreviewResult(null);
    setSaveError(null);
    setErrorTitle('');
    setErrorSlug('');
    setErrorFolder('');
  };

  const validateSaveForm = (): boolean => {
    let ok = true;

    if (!title.trim()) {
      setErrorTitle('El título es obligatorio.');
      ok = false;
    }

    if (!slug.trim()) {
      setErrorSlug('El slug es obligatorio.');
      ok = false;
    } else if (!isValidSlug(slug)) {
      setErrorSlug('Solo se permiten minúsculas, números y guiones.');
      ok = false;
    }

    if (!folder.trim()) {
      setErrorFolder('La carpeta es obligatoria.');
      ok = false;
    }

    return ok;
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setErrorTitle('');
    setErrorSlug('');
    setErrorFolder('');
    setSaveError(null);

    if (!validateSaveForm()) return;

    setSaving(true);
    const payload = {
      resourceId,
      title,
      slug,
      folder,
      description: description || undefined,
      visibility,
      steps,
      roundDecimals: roundDecimals === '' ? undefined : Number(roundDecimals),
    };
    try {
      const analysis = editingAnalysisId
        ? await analysesService.update(organizationId, datasetId, editingAnalysisId, payload)
        : await analysesService.create(organizationId, datasetId, payload);
      setSavedAnalysis(analysis);
      setShowSaveForm(false);
      setEditingAnalysisId(null);
      setTitle('');
      setSlug('');
      setFolder('');
      setDescription('');
      setSteps([]);
      await reloadAnalyses();
    } catch (err) {
      const matched = fieldErrors(err, ['title', 'slug', 'folder']);
      if (matched.title) setErrorTitle(matched.title);
      if (matched.slug) setErrorSlug(matched.slug);
      if (matched.folder) setErrorFolder(matched.folder);

      if (Object.keys(matched).length === 0) {
        const message = errorMessage(
          err,
          editingAnalysisId ? 'No se pudo actualizar el análisis.' : 'No se pudo guardar el análisis.',
        );
        if (message.toLowerCase().includes('slug')) {
          setErrorSlug('Ese slug ya está en uso; prueba con otro.');
        } else {
          setSaveError(message);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const openAnalysis = async (analysis: Analysis) => {
    if (openAnalysisId === analysis.id) {
      setOpenAnalysisId(null);
      setOpenAnalysisData(null);
      return;
    }
    setOpenAnalysisId(analysis.id);
    setOpenAnalysisData(null);
    if (analysis.status === 'DONE') {
      setOpenAnalysisData(await analysesService.getData(organizationId, datasetId, analysis.id));
    }
  };

  const openInVizCanvas = async (analysis: Analysis, event: MouseEvent) => {
    event.stopPropagation();
    setOpeningVizCanvasId(analysis.id);
    setVizCanvasError(null);
    try {
      const { url } = await analysesService.vizcanvasHandoff(
        organizationId,
        datasetId,
        analysis.id,
      );
      window.location.href = url;
    } catch (err) {
      setVizCanvasError(errorMessage(err, 'No se pudo abrir en VizCanvas.'));
      setOpeningVizCanvasId(null);
    }
  };

  const requestRemoveAnalysis = (analysis: Analysis, event: MouseEvent) => {
    event.stopPropagation();
    setPendingDelete(analysis);
  };

  const cancelRemoveAnalysis = () => setPendingDelete(null);

  const confirmRemoveAnalysis = async () => {
    if (!pendingDelete) return;
    const analysis = pendingDelete;
    setRemovingId(analysis.id);
    setVizCanvasError(null);
    try {
      await analysesService.remove(organizationId, datasetId, analysis.id);
      if (openAnalysisId === analysis.id) {
        setOpenAnalysisId(null);
        setOpenAnalysisData(null);
      }
      await reloadAnalyses();
    } catch (err) {
      setVizCanvasError(errorMessage(err, 'No se pudo borrar el análisis.'));
    } finally {
      setRemovingId(null);
      setPendingDelete(null);
    }
  };

  return {
    opCatalog,
    opNames: opCatalog ? (Object.keys(opCatalog) as OpName[]) : [],
    steps,
    newOp,
    setNewOp,
    addStep,
    removeStep,
    setParam,
    onJoinResourceChange,
    toggleGroupByColumn,
    isGroupByColumnSelected,
    otherResources,
    columnsForResource,
    rowColumns,
    sortColumns,
    aggregateAliases,
    previewing,
    previewError,
    previewResult,
    roundDecimals,
    setRoundDecimals,
    runPreview,
    showSaveForm,
    setShowSaveForm,
    saving,
    saveError,
    savedAnalysis,
    editingAnalysisId,
    cancelEdit,
    save,
    form: {
      title,
      setTitle,
      slug,
      setSlug,
      folder,
      setFolder,
      description,
      setDescription,
      visibility,
      setVisibility,
    },
    formErrors: {
      title: errorTitle,
      slug: errorSlug,
      folder: errorFolder,
    },
    analyses,
    loadingAnalyses,
    openAnalysisId,
    openAnalysisData,
    openAnalysis,
    openingVizCanvasId,
    vizCanvasError,
    removingId,
    pendingDelete,
    openInVizCanvas,
    requestRemoveAnalysis,
    cancelRemoveAnalysis,
    confirmRemoveAnalysis,
  };
}
