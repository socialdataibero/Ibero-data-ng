import { PortalTopicsSection } from '../portal-topics-section/PortalTopicsSection';
import { Skeleton } from '../../shared/skeleton/Skeleton';
import './portal-home.css';

export function PortalHomeSkeleton() {
  return (
    <>
      <Skeleton height="28rem" className="skeleton--flat" />
      <main id="main-content">
        <PortalTopicsSection loading />
      </main>
    </>
  );
}
