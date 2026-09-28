import { HorizontalCardSkeleton } from '../shared/horizontal-card/HorizontalCardSkeleton';
import { OrganizationCardSkeleton } from '../shared/organization-card/OrganizationCardSkeleton';
import { PageHeaderSkeleton } from '../shared/page-header/PageHeaderSkeleton';
import { CardSkeleton } from '../shared/skeleton/CardSkeleton';
import { Skeleton } from '../shared/skeleton/Skeleton';
import { SkeletonStatus } from '../shared/skeleton/SkeletonStatus';
import './home.css';

const RECENT_ROWS = 3;
const ACCESS_ITEMS = 3;

export function HomeRecentSkeleton() {
  return (
    <SkeletonStatus label="Cargando contenido reciente…" className="c-home__recent">
      <div className="c-home__recent-header" aria-hidden="true">
        <div className="c-home__recent-header-side">
          <Skeleton width="16rem" height="1.5rem" />
        </div>
        <div className="c-home__recent-divider c-home__recent-divider--header" />
        <div className="c-home__recent-header-side">
          <Skeleton width="14rem" height="1.5rem" />
        </div>
      </div>

      <ul className="c-home__recent-rows">
        {Array.from({ length: RECENT_ROWS }, (_, index) => (
          <li key={index} className="c-home__recent-row">
            <div className="c-home__recent-cell">
              <HorizontalCardSkeleton compact />
            </div>
            <div className="c-home__recent-divider" aria-hidden="true" />
            <div className="c-home__recent-cell">
              <OrganizationCardSkeleton layout="horizontal" compact />
            </div>
          </li>
        ))}
      </ul>
    </SkeletonStatus>
  );
}

export function HomeSkeleton() {
  return (
    <div className="c-home">
      <PageHeaderSkeleton action={false} />

      <section className="container width-fixed c-home__section" aria-hidden="true">
        <div className="width-read skeleton-stack">
          <Skeleton width="12rem" height="1.5rem" />
          <Skeleton height="1rem" />
          <Skeleton width="80%" height="1rem" />
        </div>
      </section>

      <section className="container width-fixed c-home__section" aria-hidden="true">
        <Skeleton width="12rem" height="1.5rem" className="m-b-3" />
        <ul className="c-home__access-list">
          {Array.from({ length: ACCESS_ITEMS }, (_, index) => (
            <li key={index}>
              <CardSkeleton className="access-widget" />
            </li>
          ))}
        </ul>
      </section>

      <section className="container width-fixed c-home__section">
        <HomeRecentSkeleton />
      </section>
    </div>
  );
}
