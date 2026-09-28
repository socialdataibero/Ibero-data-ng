import { Skeleton } from '../../shared/skeleton/Skeleton';
import { SkeletonStatus } from '../../shared/skeleton/SkeletonStatus';
import '../portal-dataset-header/portal-dataset-header.css';

export function PortalChartsViewSkeleton() {
  return (
    <main id="main-content">
      <SkeletonStatus label="Cargando datos…">
        <header className="dataset-header" aria-hidden="true">
          <div className="container width-fixed dataset-header__frame">
            <Skeleton width="14rem" height="0.875rem" className="m-b-3 hidden-mobile" />
            <div className="dataset-header__body">
              <div className="dataset-header__main skeleton-stack">
                <Skeleton width="70%" height="2.25rem" />
                <Skeleton width="5rem" height="1.5rem" className="skeleton--round" />
              </div>
              <div className="dataset-header__meta skeleton-stack">
                <Skeleton width="12rem" height="1rem" />
                <Skeleton width="10rem" height="1rem" />
                <Skeleton width="14rem" height="1rem" />
              </div>
            </div>
          </div>
        </header>

        <section
          className="container width-fixed skeleton-stack"
          style={{ paddingBlock: '2rem' }}
          aria-hidden="true"
        >
          <Skeleton width="50%" height="2rem" />
          <div className="skeleton-row">
            <Skeleton width="7rem" height="2.25rem" />
            <Skeleton width="7rem" height="2.25rem" />
            <Skeleton width="7rem" height="2.25rem" />
          </div>
          <Skeleton height="20rem" />
          <div className="skeleton-row">
            <Skeleton width="14rem" height="1rem" />
            <Skeleton width="10rem" height="2.5rem" />
          </div>
        </section>
      </SkeletonStatus>
    </main>
  );
}
