import { useEffect, useState } from 'react';
import { harmonizerService } from '../../../core/services/harmonizer.service';
import { errorMessage } from '../../../core/api/http';
import type { HarmonizerSurvey } from '../../../core/models/harmonizer.model';
import type { Crumb } from '../../shared/page-header/PageHeader';

export const CRUMBS: Crumb[] = [{ label: 'Inicio', href: '/dashboard' }, { label: 'Armonizador' }];

const PAGE_SIZE = 10;

export function useHarmonizerHome() {
  const [surveys, setSurveys] = useState<HarmonizerSurvey[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<HarmonizerSurvey | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const { total: count, items } = await harmonizerService.listSurveysPaged(
          { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE },
          controller.signal,
        );
        if (!active) return;
        setSurveys(items);
        setTotal(count);
      } catch (err) {
        if (!active) return;
        setLoadError(errorMessage(err, 'No se pudieron cargar las encuestas.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [page, refreshKey]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const goTo = (target: number) => setPage(Math.min(Math.max(1, target), totalPages));

  const requestRemoveSurvey = (survey: HarmonizerSurvey) => {
    setDeleteError(null);
    setPendingDelete(survey);
  };

  const cancelRemoveSurvey = () => setPendingDelete(null);

  const confirmRemoveSurvey = async () => {
    if (!pendingDelete) return;
    const survey = pendingDelete;
    setRemovingId(survey.id);
    setDeleteError(null);
    try {
      await harmonizerService.removeSurvey(survey.id);
      if (surveys.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        setRefreshKey((key) => key + 1);
      }
    } catch (err) {
      setDeleteError(errorMessage(err, 'No se pudo borrar la encuesta.'));
    } finally {
      setRemovingId(null);
      setPendingDelete(null);
    }
  };

  return {
    surveys,
    total,
    page,
    totalPages,
    goTo,
    loading,
    loadError,
    pendingDelete,
    removingId,
    deleteError,
    requestRemoveSurvey,
    cancelRemoveSurvey,
    confirmRemoveSurvey,
  };
}
