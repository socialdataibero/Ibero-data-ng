import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useParams } from 'react-router-dom';
import { datasetsService } from '../../core/services/datasets.service';
import { organizationsService } from '../../core/services/organizations.service';
import { isNotFound } from '../../core/api/http';
import type { Dataset, Organization } from '../../core/models/dataset.model';
import type { Crumb } from '../shared/page-header/PageHeader';
import { DATASET_FILTERS, mapFilterOptions } from '../../data/dataset-filters';
import type { SortOrder } from '../datasets-list/useDatasetsList';

const PAGE_SIZE = 10;
const OPTIONS_BY_ID = mapFilterOptions(DATASET_FILTERS.sections);

export function useOrganizationDetail() {
  const { organizationId = '' } = useParams();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizationNotFound, setOrganizationNotFound] = useState(false);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('recent');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Dataset | null>(null);

  const filterTerms = useMemo(
    () =>
      activeFilters
        .map((id) => OPTIONS_BY_ID.get(id)?.label)
        .filter((label): label is string => Boolean(label)),
    [activeFilters],
  );

  useEffect(() => {
    setPage(1);
  }, [organizationId, query, sortOrder, activeFilters]);

  useEffect(() => {
    let active = true;
    setOrganization(null);
    setOrganizationNotFound(false);
    void organizationsService
      .get(organizationId)
      .then((org) => {
        if (active) setOrganization(org);
      })
      .catch((err: unknown) => {
        if (!active) return;
        if (isNotFound(err)) {
          setOrganizationNotFound(true);
        } else {
          setError('No se pudo cargar la organización.');
        }
      });
    return () => {
      active = false;
    };
  }, [organizationId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const { total: count, items } = await datasetsService.listPaged(organizationId, {
          q: query,
          terms: filterTerms,
          sort: sortOrder,
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
        });
        if (!active) return;
        setDatasets(items);
        setTotal(count);
      } catch (err) {
        if (active && !isNotFound(err)) setError('No se pudieron cargar los datasets.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [organizationId, query, filterTerms, sortOrder, page, refreshKey]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const goTo = (target: number) => setPage(Math.min(Math.max(1, target), totalPages));

  const crumbs: Crumb[] = useMemo(
    () => [
      { label: 'Inicio', href: '/dashboard' },
      { label: 'Organizaciones', href: '/organizations' },
      { label: organization?.name ?? 'Organización' },
    ],
    [organization?.name],
  );

  const requestRemoveDataset = (dataset: Dataset, event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setPendingDelete(dataset);
  };

  const cancelRemoveDataset = () => setPendingDelete(null);

  const confirmRemoveDataset = async () => {
    if (!pendingDelete) return;
    const dataset = pendingDelete;
    setRemovingId(dataset.id);
    setError(null);
    try {
      await datasetsService.remove(organizationId, dataset.id);
      if (datasets.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        setRefreshKey((key) => key + 1);
      }
    } catch {
      setError('No se pudo borrar el dataset.');
    } finally {
      setRemovingId(null);
      setPendingDelete(null);
    }
  };

  return {
    organizationId,
    organization,
    organizationNotFound,
    datasets,
    page,
    totalPages,
    goTo,
    hasCriteria: query.trim() !== '' || activeFilters.length > 0,
    sortOrder,
    onSearch: setQuery,
    onSortChange: setSortOrder,
    filtersOpen,
    setFiltersOpen,
    activeFilters,
    setActiveFilters,
    loading,
    error,
    removingId,
    pendingDelete,
    requestRemoveDataset,
    cancelRemoveDataset,
    confirmRemoveDataset,
    crumbs,
  };
}
