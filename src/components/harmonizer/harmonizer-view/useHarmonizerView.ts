import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import type {
  DatasetHarmonizedView,
  ExportFormat,
  SurveyHarmonizedView,
} from '../../../core/models/harmonizer.model';
import { harmonizerService } from '../../../core/services/harmonizer.service';
import { datasetsService } from '../../../core/services/datasets.service';
import { resourcesService } from '../../../core/services/resources.service';
import { errorMessage } from '../../../core/api/http';
import type { Dataset } from '../../../core/models/dataset.model';
import type { Crumb } from '../../shared/page-header/PageHeader';

const ATTACH_RESULTS_LIMIT = 8;

// Columnas que agrega el servidor a la vista por encuesta. En las descargas se
// llaman igual (`_dataset`, `_year`, `_row`); en pantalla se muestran con
// `label` y `title` explica de dónde salen.
export const SURVEY_ORIGIN_COLUMNS: Record<string, { label: string; title: string }> = {
  _dataset: {
    label: 'Edición',
    title: 'Edición de la que viene la fila. En las descargas es la columna _dataset.',
  },
  _year: {
    label: 'Año',
    title: 'Año de la edición. En las descargas es la columna _year.',
  },
  _row: {
    label: 'Fila',
    title:
      'Número de registro en el archivo original, sin contar el encabezado. En las descargas es la columna _row.',
  },
};
const SURVEY_ORIGIN_KEYS = Object.keys(SURVEY_ORIGIN_COLUMNS);

// Filas por página (SDI-93). El servidor admite hasta 500.
export const PAGE_SIZES = [50, 100, 500];
const DEFAULT_PAGE_SIZE = 100;

function pageSizeFrom(value: string | null): number {
  const size = Number(value);
  return PAGE_SIZES.includes(size) ? size : DEFAULT_PAGE_SIZE;
}

export function useHarmonizerView() {
  const { datasetId, surveyId } = useParams<{ datasetId?: string; surveyId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [datasetView, setDatasetView] = useState<DatasetHarmonizedView | null>(null);
  const [surveyView, setSurveyView] = useState<SurveyHarmonizedView | null>(null);
  // `loading` es la primera carga (esqueleto); `refreshing`, un cambio de página o de
  // variables con la tabla ya en pantalla.
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadedFor = useRef<string | null>(null);

  const [selectedVariables, setSelectedVariables] = useState<string[]>(() =>
    searchParams.getAll('variables'),
  );
  const selectionKey = selectedVariables.join('\u0000');
  const [pageSize, setPageSizeState] = useState(() => pageSizeFrom(searchParams.get('limit')));
  const [page, setPage] = useState(1);

  const [downloading, setDownloading] = useState<ExportFormat | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const [attachOpen, setAttachOpen] = useState(false);
  const [attachQuery, setAttachQuery] = useState('');
  const [attachResults, setAttachResults] = useState<Dataset[]>([]);
  const [attachSearching, setAttachSearching] = useState(false);
  const [attachTarget, setAttachTarget] = useState<Dataset | null>(null);
  const [attaching, setAttaching] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [attachedTo, setAttachedTo] = useState<Dataset | null>(null);

  // El servidor manda solo la página pedida (SDI-93). Las variables elegidas también se
  // aplican en el servidor, así que la tabla coincide con la descarga.
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const target = datasetId ?? surveyId ?? null;
    if (loadedFor.current === target) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);
    const request = { limit: pageSize, offset: (page - 1) * pageSize };
    (async () => {
      try {
        if (datasetId) {
          const view = await harmonizerService.getDatasetHarmonized(
            datasetId,
            request,
            controller.signal,
          );
          if (!active) return;
          setDatasetView(view);
          setSurveyView(null);
        } else if (surveyId) {
          const view = await harmonizerService.getSurveyHarmonized(
            surveyId,
            selectedVariables,
            request,
            controller.signal,
          );
          if (!active) return;
          setSurveyView(view);
          setDatasetView(null);
        }
        loadedFor.current = target;
      } catch (err) {
        if (!active) return;
        setLoadError(errorMessage(err, 'No se pudo cargar la vista armonizada.'));
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
    // `selectionKey` representa a `selectedVariables`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId, surveyId, page, pageSize, selectionKey]);

  const headers = useMemo(() => {
    if (datasetView) return datasetView.headers;
    if (surveyView) return [...SURVEY_ORIGIN_KEYS, ...surveyView.headers];
    return [];
  }, [datasetView, surveyView]);

  const rows = datasetView?.rows ?? surveyView?.rows ?? [];
  const total = datasetView?.total ?? surveyView?.total ?? 0;
  const offset = datasetView?.offset ?? surveyView?.offset ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const firstRow = rows.length > 0 ? offset + 1 : 0;
  const lastRow = offset + rows.length;

  const goToPage = useCallback(
    (target: number) => setPage(Math.min(Math.max(1, target), totalPages)),
    [totalPages],
  );

  const setPageSize = useCallback(
    (size: number) => {
      setPageSizeState(size);
      setPage(1);
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set('limit', String(size));
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const title = datasetView
    ? `${datasetView.dataset.name} (${datasetView.dataset.year})`
    : (surveyView?.survey.name ?? '');

  const isSelected = useCallback(
    (variable: string) =>
      selectedVariables.length === 0 || selectedVariables.includes(variable),
    [selectedVariables],
  );

  const toggleVariable = useCallback(
    (variable: string) => {
      if (!surveyView) return;
      const current =
        selectedVariables.length === 0
          ? [...surveyView.availableVariables]
          : [...selectedVariables];
      // Al volver a marcar una variable, regresa a su lugar en vez de irse al final (H-14).
      const next = current.includes(variable)
        ? current.filter((v) => v !== variable)
        : surveyView.availableVariables.filter((v) => v === variable || current.includes(v));
      setSelectedVariables(next);
      setPage(1);
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.delete('variables');
          for (const value of next) params.append('variables', value);
          return params;
        },
        { replace: true },
      );
    },
    [surveyView, selectedVariables, setSearchParams],
  );

  const download = useCallback(
    (format: ExportFormat) => {
      setDownloading(format);
      setDownloadError(null);
      void (async () => {
        try {
          if (datasetId) {
            await harmonizerService.downloadDatasetExport(datasetId, format);
          } else if (surveyId) {
            await harmonizerService.downloadSurveyExport(surveyId, format, selectedVariables);
          }
        } catch (err) {
          setDownloadError(errorMessage(err, 'No se pudo descargar el archivo.'));
        } finally {
          setDownloading(null);
        }
      })();
    },
    [datasetId, surveyId, selectedVariables],
  );

  useEffect(() => {
    if (!attachOpen) return;
    let active = true;
    const controller = new AbortController();
    setAttachSearching(true);
    (async () => {
      try {
        const { items } = await datasetsService.listAllPaged({
          q: attachQuery,
          limit: ATTACH_RESULTS_LIMIT,
        });
        if (!active) return;
        setAttachResults(items);
      } catch {
        if (!active) return;
        setAttachResults([]);
      } finally {
        if (active) setAttachSearching(false);
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [attachOpen, attachQuery]);

  const openAttach = useCallback(() => {
    setAttachOpen(true);
    setAttachedTo(null);
    setAttachError(null);
  }, []);

  const closeAttach = useCallback(() => {
    setAttachOpen(false);
    setAttachQuery('');
    setAttachResults([]);
    setAttachTarget(null);
    setAttachError(null);
  }, []);

  const confirmAttach = useCallback(() => {
    if (!attachTarget) return;
    setAttaching(true);
    setAttachError(null);
    void (async () => {
      try {
        const { blob, filename } = datasetId
          ? await harmonizerService.getDatasetExportBlob(datasetId, 'parquet')
          : surveyId
            ? await harmonizerService.getSurveyExportBlob(surveyId, 'parquet', selectedVariables)
            : { blob: null, filename: null };
        if (!blob) throw new Error('missing source');

        const file = new File([blob], filename ?? `${title || 'armonizado'}.parquet`, {
          type: 'application/octet-stream',
        });
        await resourcesService.upload(attachTarget.organizationId, attachTarget.id, file);

        setAttachedTo(attachTarget);
        setAttachOpen(false);
        setAttachQuery('');
        setAttachResults([]);
        setAttachTarget(null);
      } catch (err) {
        setAttachError(errorMessage(err, 'No se pudo adjuntar al dataset.'));
      } finally {
        setAttaching(false);
      }
    })();
  }, [attachTarget, datasetId, surveyId, selectedVariables, title]);

  const crumbs: Crumb[] = [
    { label: 'Inicio', href: '/dashboard' },
    { label: 'Armonizador', href: '/harmonizer' },
    { label: 'Vista armonizada' },
  ];

  return {
    datasetId,
    surveyId,
    datasetView,
    surveyView,
    loading,
    refreshing,
    loadError,
    downloading,
    downloadError,
    headers,
    originCount: surveyView ? SURVEY_ORIGIN_KEYS.length : 0,
    rows,
    total,
    firstRow,
    lastRow,
    page,
    totalPages,
    goToPage,
    pageSize,
    setPageSize,
    title,
    isSelected,
    toggleVariable,
    download,
    attachOpen,
    attachQuery,
    setAttachQuery,
    attachResults,
    attachSearching,
    attachTarget,
    attaching,
    attachError,
    attachedTo,
    openAttach,
    closeAttach,
    selectAttachTarget: setAttachTarget,
    confirmAttach,
    crumbs,
  };
}
