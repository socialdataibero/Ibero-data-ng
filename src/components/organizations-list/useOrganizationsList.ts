import { useEffect, useMemo, useState } from 'react';
import type { Crumb } from '../shared/page-header/PageHeader';
import type { Organization } from '../../core/models/dataset.model';
import { ORGANIZATION_FILTERS, mapFilterOptions } from '../../data/organization-filters';
import type { OrganizationCardProps } from '../shared/organization-card/OrganizationCard';
import { organizationsService, type OrganizationSort } from '../../core/services/organizations.service';

export type SortOrder = OrganizationSort;

export type OrganizationListItem = OrganizationCardProps & {
  id: string;
  createdAt?: string;
  type?: string;
  scope?: string;
};

export const CRUMBS: Crumb[] = [
  { label: 'Inicio', href: '/dashboard' },
  { label: 'Organizaciones' },
];

export const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'recent', label: 'Más recientes' },
  { value: 'name-asc', label: 'Nombre (A–Z)' },
  { value: 'name-desc', label: 'Nombre (Z–A)' },
  { value: 'datasets-desc', label: 'Más conjuntos' },
  { value: 'members-desc', label: 'Más miembros' },
];

const PAGE_SIZE = 10;
const OPTIONS_BY_ID = mapFilterOptions(ORGANIZATION_FILTERS.sections);

export function organizationToCardProps(org: Organization): OrganizationListItem {
  return {
    id: org.id,
    name: org.name,
    description: org.description ?? undefined,
    datasets: org._count?.datasets ?? 0,
    members: org._count?.members ?? 0,
    href: `/organizations/${org.id}`,
    createdAt: org.createdAt,
  };
}

export function useOrganizationsList() {
  const [query, setQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('recent');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const [organizations, setOrganizations] = useState<OrganizationListItem[]>([]);
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
        const { total: count, items } = await organizationsService.listPaged({
          q: query,
          terms: filterTerms,
          sort: sortOrder,
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
        });
        if (!active) return;
        setOrganizations(items.map(organizationToCardProps));
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
    organizations,
    loading,
    sortOrder,
    page,
    totalPages,
    pageItems: organizations,
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
