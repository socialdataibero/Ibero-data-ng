import { useMemo } from 'react';
import { portalCatalogService } from '../../../core/services/portal-catalog.service';
import { usePortalRequest } from '../../../core/hooks/usePortalRequest';
import cardMotif1 from '../../../assets/card-motif-1.png';
import cardMotif2 from '../../../assets/card-motif-2.png';
import cardMotif3 from '../../../assets/card-motif-3.png';
import type { PortalTopicCard } from '../portal-topics-section/PortalTopicsSection';
import { countLabel } from '../../../core/utils/count-label';

const IMAGES = [cardMotif1, cardMotif2, cardMotif3];
const PREVIEW_COUNT = 3;

export function usePortalHome() {
  const { data, loading } = usePortalRequest(
    ({ signal }) =>
      Promise.all([
        portalCatalogService.listOrganizations({ rows: PREVIEW_COUNT }, signal),
        portalCatalogService.organizationCounts(signal),
        portalCatalogService.searchPackages({ rows: 1 }, signal),
      ]),
    [],
  );

  const organizations = data?.[0]?.items ?? [];
  const totalOrganizations = data?.[0]?.total ?? 0;
  const counts = data?.[1] ?? {};
  const totalDatasets = data?.[2]?.total ?? 0;

  const topicCards: PortalTopicCard[] = useMemo(
    () =>
      organizations.map((organization, index) => {
        const title = organization.title || organization.name;
        const count = counts[organization.name] ?? { sources: 0, charts: 0 };
        return {
          id: organization.id,
          imageSrc: IMAGES[index % IMAGES.length],
          title,
          sources: countLabel(count.sources, 'fuente', 'fuentes'),
          charts: countLabel(count.charts, 'gráfica', 'gráficas'),
          description: organization.description || 'Sin descripción registrada en el catálogo.',
          sourcesLabel: title,
          buttonText: 'Ir a los datos',
          variant: 'link-inner',
          href: `/data?org=${encodeURIComponent(organization.name)}`,
        };
      }),
    [organizations, counts],
  );

  return {
    topicCards,
    loading,
    totalDatasets,
    totalOrganizations,
  };
}
