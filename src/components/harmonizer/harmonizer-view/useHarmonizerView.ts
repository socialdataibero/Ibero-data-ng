import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import type {
  DatasetHarmonizedView,
  ExportFormat,
  HarmonizedRow,
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
export const MAX_VISIBLE_ROWS = 500;

export function useHarmonizerView() {
  const { datasetId, surveyId } = useParams<{ datasetId?: string; surveyId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [datasetView, setDatasetView] = useState<DatasetHarmonizedView | null>(null);
  const [baseSurveyView, setBaseSurveyView] = useState<SurveyHarmonizedView | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const selectedFromUrl = searchParams.getAll('variables');
  const [selectedVariables, setSelectedVariables] = useState<string[]>(selectedFromUrl);

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

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        if (datasetId) {
          const view = await harmonizerService.getDatasetHarmonized(datasetId, controller.signal);
          if (!active) return;
          setDatasetView(view);
          setBaseSurveyView(null);
        } else if (surveyId) {
          const view = await harmonizerService.getSurveyHarmonized(surveyId, selectedFromUrl, controller.signal);
          if (!active) return;
          setBaseSurveyView(view);
          setDatasetView(null);
          setSelectedVariables(selectedFromUrl.length > 0 ? selectedFromUrl : view.selected);
        }
      } catch (err) {
        if (!active) return;
        setLoadError(errorMessage(err, 'No se pudo cargar la vista armonizada.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId, surveyId]);

  const surveyView = useMemo(() => {
    if (!baseSurveyView) return null;
    // Siempre en el orden de la lista de variables, como en la descarga (H-14).
    const selected =
      selectedVariables.length === 0
        ? baseSurveyView.availableVariables
        : baseSurveyView.availableVariables.filter((v) => selectedVariables.includes(v));
    const headers = selected;
    const rows = baseSurveyView.rows.map((row) => {
      const next: HarmonizedRow = {
        _dataset: row._dataset,
        _year: row._year,
        _row: row._row,
      };
      for (const header of headers) {
        next[header] = row[header] ?? null;
      }
      return next;
    });
    return {
      ...baseSurveyView,
      headers,
      selected,
      selectedCount: selected.length,
      rows,
    };
  }, [baseSurveyView, selectedVariables]);

  const headers = useMemo(() => {
    if (datasetView) return datasetView.headers;
    if (surveyView) return [...SURVEY_ORIGIN_KEYS, ...surveyView.headers];
    return [];
  }, [datasetView, surveyView]);

  const rows = datasetView?.rows ?? surveyView?.rows ?? [];
  const visibleRows = rows.slice(0, MAX_VISIBLE_ROWS);

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
      if (!baseSurveyView) return;
      const current =
        selectedVariables.length === 0
          ? [...baseSurveyView.availableVariables]
          : [...selectedVariables];
      // Al volver a marcar una variable, regresa a su lugar en vez de irse al final (H-14).
      const next = current.includes(variable)
        ? current.filter((v) => v !== variable)
        : baseSurveyView.availableVariables.filter((v) => v === variable || current.includes(v));
      setSelectedVariables(next);
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
    [baseSurveyView, selectedVariables, setSearchParams],
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
    loadError,
    downloading,
    downloadError,
    headers,
    originCount: surveyView ? SURVEY_ORIGIN_KEYS.length : 0,
    rows,
    visibleRows,
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
    maxVisibleRows: MAX_VISIBLE_ROWS,
  };
}
