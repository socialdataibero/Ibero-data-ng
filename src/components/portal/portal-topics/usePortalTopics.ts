import { useEffect, useState } from 'react';
import { portalCatalogService, type CatalogOrganization } from '../../../core/services/portal-catalog.service';
import { usePortalRequest } from '../../../core/hooks/usePortalRequest';
import cardMotif1 from '../../../assets/card-motif-1.png';
import cardMotif2 from '../../../assets/card-motif-2.png';
import cardMotif3 from '../../../assets/card-motif-3.png';
import type { PortalCatalogItem } from '../portal-catalog-section/PortalCatalogSection';
import { SORT_AZ } from '../portal-catalog-section/usePortalCatalogSection';

const IMAGES = [cardMotif1, cardMotif2, cardMotif3];
const PAGE_SIZE = 10;

function organizationToTopic(
  organization: CatalogOrganization,
  index: number,
  counts: Record<string, { sources: number; charts: number }>,
): PortalCatalogItem {
  const name = organization.name;
  const title = organization.title || name;
  const count = counts[name] ?? { sources: 0, charts: 0 };

  return {
    id: organization.id,
    name: title,
    title,
    imageSrc: IMAGES[index % IMAGES.length],
    sources: count.sources,
    charts: count.charts,
    description: organization.description || 'Sin descripción registrada en el catálogo.',
    sourcesLabel: title,
    buttonText: 'Ir a los datos',
    variant: 'link-inner',
    href: `/datos?org=${encodeURIComponent(name)}`,
  };
}

export function usePortalTopics() {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(SORT_AZ);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [query, sort]);

  const { data, loading, error } = usePortalRequest(
    ({ signal }) =>
      Promise.all([
        portalCatalogService.listOrganizations(
          { q: query, sort: sort as 'name-asc' | 'name-desc', rows: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE },
          signal,
        ),
        portalCatalogService.organizationCounts(signal),
      ]).then(([{ total, items: organizations }, counts]) => ({
        total,
        catalog: organizations.map((organization, index) => organizationToTopic(organization, index, counts)),
      })),
    [query, sort, page],
  );

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  const goTo = (target: number) => setPage(Math.min(Math.max(1, target), totalPages));

  return {
    catalog: data?.catalog ?? [],
    total,
    loading,
    error,
    sort,
    setSort,
    setQuery,
    page,
    totalPages,
    pageNumbers,
    goTo,
  };
}
