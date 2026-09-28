import { CardsSectionToolsSkeleton } from '../shared/cards-section/CardsSectionSkeleton';
import { PageHeaderSkeleton } from '../shared/page-header/PageHeaderSkeleton';
import { Skeleton } from '../shared/skeleton/Skeleton';
import { SkeletonStatus } from '../shared/skeleton/SkeletonStatus';
import './organization-detail.css';

const ITEMS = 4;

export function OrganizationDetailGridSkeleton() {
  return (
    <SkeletonStatus label="Cargando datasets…">
      <ul className="c-organization-detail__grid">
        {Array.from({ length: ITEMS }, (_, index) => (
          <li key={index}>
            <div className="card c-organization-detail__card" aria-hidden="true">
              <div className="c-organization-detail__tags">
                <Skeleton width="4rem" height="1.5rem" className="skeleton--round" />
                <Skeleton width="3rem" height="1.5rem" className="skeleton--round" />
              </div>
              <Skeleton width="75%" height="1.25rem" />
              <div className="c-organization-detail__actions">
                <Skeleton width="4.5rem" height="2rem" />
                <Skeleton width="6rem" height="2rem" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </SkeletonStatus>
  );
}

export function OrganizationDetailSkeleton() {
  return (
    <div className="c-organization-detail">
      <PageHeaderSkeleton />
      <section className="container width-fixed c-organization-detail__body">
        <CardsSectionToolsSkeleton />
        <OrganizationDetailGridSkeleton />
      </section>
    </div>
  );
}
