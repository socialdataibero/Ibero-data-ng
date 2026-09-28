import { PortalDataResultsSection } from '../portal-data-results-section/PortalDataResultsSection';
import { PortalSearchHeaderSkeleton } from '../portal-search-header/PortalSearchHeaderSkeleton';

export function PortalDataSkeleton() {
  return (
    <main id="main-content">
      <PortalSearchHeaderSkeleton />
      <PortalDataResultsSection loading />
    </main>
  );
}
