import { Skeleton } from '../skeleton/Skeleton';
import './page-header.css';

export interface PageHeaderSkeletonProps {
  action?: boolean;
}

export function PageHeaderSkeleton({ action = true }: PageHeaderSkeletonProps) {
  return (
    <header className="page-header" aria-hidden="true">
      <div className="container width-fixed page-header__frame p-y-3">
        <div className="header__crumbs m-b-3 hidden-mobile">
          <Skeleton width="14rem" height="0.875rem" />
        </div>

        <div
          className={
            action ? 'page-header__row' : 'width-read align-centered page-header-skeleton--centered'
          }
        >
          <div className={action ? 'page-header__text' : undefined}>
            <Skeleton width="60%" height="2.25rem" className="m-b-3" />
            <Skeleton width="90%" height="1rem" />
          </div>

          {action ? (
            <div className="page-header__action">
              <Skeleton width="8rem" height="2.5rem" />
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
