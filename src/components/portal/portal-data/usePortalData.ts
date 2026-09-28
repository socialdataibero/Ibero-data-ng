import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { portalCatalogService, type CatalogPackage, type CatalogSort } from '../../../core/services/portal-catalog.service';
import { usePortalRequest } from '../../../core/hooks/usePortalRequest';
import cardMotif1 from '../../../assets/card-motif-1.png';
import cardMotif2 from '../../../assets/card-motif-2.png';
import cardMotif3 from '../../../assets/card-motif-3.png';
import type { PortalDataResultItem } from '../portal-data-results-section/PortalDataResultsSection';
import type { PortalSortOption } from '../portal-search-header/usePortalSearchHeader';

const IMAGES = [cardMotif1, cardMotif2, cardMotif3];
const PAGE_SIZE = 10;

const SORT_OPTIONS: PortalSortOption[] = [
  { value: 'relevancia', label: 'Relevancia' },
  { value: 'az', label: 'De la A a la Z' },
  { value: 'za', label: 'De la Z a la A' },
];

const SORT_TO_BACKEND: Record<string, CatalogSort> = {
  relevancia: 'recent',
  az: 'title-asc',
  za: 'title-desc',
};

function yearOf(pkg: CatalogPackage): number | null {
  const date = pkg.metadata_modified ?? pkg.metadata_created;
  const year = date ? new Date(date).getFullYear() : null;
  return Number.isFinite(year) ? year : null;
}

function lastUpdatedOf(packages: CatalogPackage[]): string {
  const dates = packages.map((p) => p.metadata_modified).filter(Boolean).sort();
  const last = dates.at(-1);
  if (!last) return '';
  return new Date(last).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

function packageToCard(pkg: CatalogPackage, index: number): PortalDataResultItem {
  const organization = pkg.organization ?? { id: '', name: '' };
  const isAnalysis = pkg.type === 'analysis';

  return {
    id: pkg.id,
    imageSrc: IMAGES[index % IMAGES.length],
    imageAlt: '',
    title: pkg.title || pkg.name,
    label: isAnalysis ? 'Análisis' : 'Datos',
    source: organization.title || organization.name || 'Sin organización',
    year: yearOf(pkg) ?? undefined,
    institutions: pkg.notes ? pkg.notes.slice(0, 60) : undefined,
    href: `/datos/vista-datos?id=${encodeURIComponent(pkg.name)}`,
  };
}

export function usePortalData() {
  const [searchParams, setSearchParams] = useSearchParams();
  const orgFilter = searchParams.get('org') ?? '';
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [sort, setSort] = useState('relevancia');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [query, orgFilter, sort]);

  const { data, loading, error } = usePortalRequest(
    ({ signal }) =>
      portalCatalogService.searchPackages(
        {
          q: query,
          org: orgFilter,
          sort: SORT_TO_BACKEND[sort],
          rows: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
        },
        signal,
      ),
    [query, orgFilter, sort, page],
  );

  const packages = useMemo(() => data?.packages ?? [], [data]);
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const items = useMemo(() => packages.map(packageToCard), [packages]);

  const orgFilterLabel = useMemo(() => {
    if (!orgFilter) return null;
    return packages[0]?.organization?.title ?? packages[0]?.organization?.name ?? orgFilter;
  }, [orgFilter, packages]);

  const clearOrgFilter = () => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.delete('org');
      return params;
    });
  };

  const goTo = (target: number) => setPage(Math.min(Math.max(1, target), totalPages));

  return {
    query,
    setQuery,
    sort,
    setSort,
    loading,
    error,
    items,
    total,
    page,
    totalPages,
    goTo,
    sortOptions: SORT_OPTIONS,
    lastUpdated: lastUpdatedOf(packages),
    orgFilter: orgFilter || null,
    orgFilterLabel,
    clearOrgFilter,
  };
}
