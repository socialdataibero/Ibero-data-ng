import { useEffect, useMemo, useState } from 'react';
import type { Crumb } from '../shared/page-header/PageHeader';
import type { Dataset } from '../../core/models/dataset.model';
import { DATASET_FILTERS, mapFilterOptions } from '../../data/dataset-filters';
import type { HorizontalCardProps } from '../shared/horizontal-card/HorizontalCard';
import { datasetsService, type DatasetSort } from '../../core/services/datasets.service';

export type SortOrder = DatasetSort;

export type DatasetListItem = HorizontalCardProps & {
  id: string;
  organizationId: string;
  createdAt?: string;
  updatedAt?: string;
};

export const CRUMBS: Crumb[] = [
  { label: 'Inicio', href: '/dashboard' },
  { label: 'Conjuntos de datos' },
];

export const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'recent', label: 'Más recientes' },
  { value: 'title-asc', label: 'Título (A–Z)' },
  { value: 'title-desc', label: 'Título (Z–A)' },
  { value: 'year-desc', label: 'Año (más reciente)' },
  { value: 'year-asc', label: 'Año (más antiguo)' },
];

const PAGE_SIZE = 10;
const OPTIONS_BY_ID = mapFilterOptions(DATASET_FILTERS.sections);

export function datasetToCardProps(dataset: Dataset): DatasetListItem {
  const updated = dataset.updatedAt
    ? new Date(dataset.updatedAt).toLocaleDateString('es-MX')
    : undefined;

  return {
    id: dataset.id,
    organizationId: dataset.organizationId,
    title: dataset.title,
    label: dataset.tags?.[0] ?? dataset.survey ?? undefined,
    source: dataset.sourceOrg ?? undefined,
    year: dataset.year ?? undefined,
    institution: dataset.organization?.name ?? dataset.sourceOrg ?? undefined,
    updated,
    createdAt: dataset.createdAt,
    updatedAt: dataset.updatedAt,
  };
}

export function useDatasetsList() {
  const [query, setQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('recent');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const [datasets, setDatasets] = useState<DatasetListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const filterTerms = useMemo(
    () => activeFilters.map((id) => OPTIONS_BY_ID.get(id)?.label).filter((label): label is string => Boolean(label)),
    [activeFilters],
  );

  useEffect(() => {
    setPage(1);
  }, [query, sortOrder, activeFilters]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    (async () => {
      try {
        const { total: count, items } = await datasetsService.listAllPaged({
          q: query,
          terms: filterTerms,
          sort: sortOrder,
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
        });
        if (!active) return;
        setDatasets(items.map(datasetToCardProps));
        setTotal(count);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filterTerms, sortOrder, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const goTo = (target: number) => setPage(Math.min(Math.max(1, target), totalPages));

  const onSearch = (text: string) => setQuery(text);

  const onSortChange = (value: SortOrder) => {
    setSortOrder(value);
  };

  return {
    datasets,
    loading,
    sortOrder,
    page,
    totalPages,
    pageItems: datasets,
    total,
    goTo,
    onSearch,
    onSortChange,
    filtersOpen,
    setFiltersOpen,
    activeFilters,
    setActiveFilters,
  };
}
