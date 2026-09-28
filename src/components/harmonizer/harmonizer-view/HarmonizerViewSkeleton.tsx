import { PageHeaderSkeleton } from '../../shared/page-header/PageHeaderSkeleton';
import { Skeleton } from '../../shared/skeleton/Skeleton';
import { SkeletonStatus } from '../../shared/skeleton/SkeletonStatus';
import { TableSkeleton } from '../../shared/skeleton/TableSkeleton';
import './harmonizer-view.css';

export function HarmonizerViewContentSkeleton() {
  return (
    <SkeletonStatus label="Cargando vista armonizada…" className="skeleton-stack">
      <div className="c-harmonizer-view__summary" aria-hidden="true">
        <Skeleton width="9rem" height="1.75rem" className="skeleton--round" />
        <Skeleton width="6rem" height="1.75rem" className="skeleton--round" />
      </div>
      <section className="c-harmonizer-view__panel" aria-hidden="true">
        <header className="c-harmonizer-view__panel-heading">
          <Skeleton width="12rem" height="1.25rem" />
        </header>
        <div className="c-harmonizer-view__panel-body skeleton-row">
          <Skeleton width="7rem" height="1.25rem" />
          <Skeleton width="6rem" height="1.25rem" />
          <Skeleton width="8rem" height="1.25rem" />
          <Skeleton width="5rem" height="1.25rem" />
        </div>
      </section>
      <TableSkeleton columns={5} rows={8} />
    </SkeletonStatus>
  );
}

export function HarmonizerViewSkeleton() {
  return (
    <div className="c-harmonizer-view">
      <PageHeaderSkeleton />
      <div className="container width-fixed c-harmonizer-view__body">
        <HarmonizerViewContentSkeleton />
      </div>
    </div>
  );
}
