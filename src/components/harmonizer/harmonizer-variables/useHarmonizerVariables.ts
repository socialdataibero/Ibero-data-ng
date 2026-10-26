import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { harmonizerService } from '../../../core/services/harmonizer.service';
import { errorMessage } from '../../../core/api/http';
import {
  VALUE_TYPE_LABEL,
  type SurveyCanonicalVariable,
  type SurveyCanonicalVariables,
} from '../../../core/models/harmonizer.model';
import { canonicalNameProblem, sameCanonicalName } from '../../../core/utils/validation';
import type { Crumb } from '../../shared/page-header/PageHeader';

export function useHarmonizerVariables() {
  const { surveyId = '' } = useParams();
  const [data, setData] = useState<SurveyCanonicalVariables | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');
  const [renaming, setRenaming] = useState(false);

  const [downloadingCatalog, setDownloadingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [pendingDelete, setPendingDelete] = useState<SurveyCanonicalVariable | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoadError(null);
    (async () => {
      try {
        const result = await harmonizerService.listVariables(surveyId, controller.signal);
        if (!active) return;
        setData(result);
      } catch (err) {
        if (!active) return;
        setLoadError(errorMessage(err, 'No se pudieron cargar las variables.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [surveyId, refreshKey]);

  const crumbs = useMemo<Crumb[]>(
    () => [
      { label: 'Inicio', href: '/dashboard' },
      { label: 'Armonizador', href: '/harmonizer' },
      { label: data ? `Variables de ${data.survey.name}` : 'Variables' },
    ],
    [data],
  );

  const startRename = (variable: SurveyCanonicalVariable) => {
    setDeleteError(null);
    setEditingId(variable.id);
    setEditName(variable.name);
    setEditError('');
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditError('');
  };

  const submitRename = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      if (!editingId || !data) return;
      const name = editName.trim();
      const problem = canonicalNameProblem(name);
      if (problem) {
        setEditError(`El nombre no es válido: ${problem}.`);
        return;
      }
      const clash = data.items.find((v) => v.id !== editingId && sameCanonicalName(v.name, name));
      if (clash) {
        setEditError(
          `Ya existe la variable «${clash.name}» en esta encuesta (los nombres no distinguen mayúsculas).`,
        );
        return;
      }
      setEditError('');
      setRenaming(true);
      void (async () => {
        try {
          await harmonizerService.renameVariable(surveyId, editingId, name);
          setEditingId(null);
          setRefreshKey((key) => key + 1);
        } catch (err) {
          // canonical_variable_name_invalid / _taken traen el motivo en español.
          setEditError(errorMessage(err, 'No se pudo renombrar la variable.'));
        } finally {
          setRenaming(false);
        }
      })();
    },
    [editingId, editName, data, surveyId],
  );

  const requestRemove = (variable: SurveyCanonicalVariable) => {
    setDeleteError(null);
    setPendingDelete(variable);
  };

  const cancelRemove = () => setPendingDelete(null);

  const confirmRemove = async () => {
    if (!pendingDelete) return;
    const variable = pendingDelete;
    setRemovingId(variable.id);
    setDeleteError(null);
    try {
      await harmonizerService.removeVariable(surveyId, variable.id);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setDeleteError(errorMessage(err, 'No se pudo borrar la variable.'));
    } finally {
      setRemovingId(null);
      setPendingDelete(null);
    }
  };

  const downloadCatalog = () => {
    setDownloadingCatalog(true);
    setCatalogError(null);
    void (async () => {
      try {
        await harmonizerService.downloadCatalog(surveyId);
      } catch (err) {
        setCatalogError(errorMessage(err, 'No se pudo descargar el catálogo.'));
      } finally {
        setDownloadingCatalog(false);
      }
    })();
  };

  // Variables con códigos distintos entre ediciones que nadie ha revisado (SDI-50).
  const warningCount = data?.items.filter((v) => v.comparison.status === 'warning').length ?? 0;
  const hasCatalog = data?.items.some((v) => v.categories.length > 0) ?? false;

  return {
    surveyId,
    data,
    warningCount,
    hasCatalog,
    downloadCatalog,
    downloadingCatalog,
    catalogError,
    loading,
    loadError,
    crumbs,
    editingId,
    editName,
    setEditName,
    editError,
    renaming,
    startRename,
    cancelRename,
    submitRename,
    pendingDelete,
    removingId,
    deleteError,
    requestRemove,
    cancelRemove,
    confirmRemove,
    valueTypeLabel: VALUE_TYPE_LABEL,
  };
}
