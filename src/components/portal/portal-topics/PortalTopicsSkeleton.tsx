import { PortalCatalogSection } from '../portal-catalog-section/PortalCatalogSection';
import { PageHeaderSkeleton } from '../../shared/page-header/PageHeaderSkeleton';
import './portal-topics.css';

export function PortalTopicsSkeleton() {
  return (
    <main id="main-content" className="c-portal-topics">
      <PageHeaderSkeleton action={false} />
      <PortalCatalogSection loading disabled />
    </main>
  );
}
