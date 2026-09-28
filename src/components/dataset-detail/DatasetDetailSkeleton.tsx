import { PageHeaderSkeleton } from '../shared/page-header/PageHeaderSkeleton';
import { Skeleton } from '../shared/skeleton/Skeleton';
import { SkeletonStatus } from '../shared/skeleton/SkeletonStatus';
import './dataset-detail.css';

export function DatasetResourcesSkeleton() {
  return (
    <SkeletonStatus label="Cargando recursos…" className="skeleton-stack">
      <Skeleton width="4rem" height="1rem" />
      <Skeleton width="24rem" height="2.5rem" />
      <Skeleton width="11rem" height="2.5rem" />
    </SkeletonStatus>
  );
}

export function DatasetDetailSkeleton() {
  return (
    <div className="c-dataset-detail">
      <PageHeaderSkeleton />

      <div className="container width-fixed c-dataset-detail__body">
        <section className="c-dataset-detail__section" aria-hidden="true">
          <Skeleton width="14rem" height="1.5rem" />
          <Skeleton width="11rem" height="2.5rem" />
          <Skeleton width="70%" height="1rem" />
        </section>

        <section className="c-dataset-detail__section">
          <Skeleton width="8rem" height="1.5rem" />
          <DatasetResourcesSkeleton />
        </section>
      </div>
    </div>
  );
}
