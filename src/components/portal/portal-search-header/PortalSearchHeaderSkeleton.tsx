import { Skeleton } from '../../shared/skeleton/Skeleton';
import './portal-search-header.css';

export function PortalSearchHeaderSkeleton() {
  return (
    <header className="search-header" aria-hidden="true">
      <div className="container width-fixed search-header__frame">
        <Skeleton width="10rem" height="0.875rem" className="m-b-3 hidden-mobile" />
        <div className="search-header__content">
          <Skeleton width="16rem" height="2.25rem" className="m-b-3" />
          <div className="search-header__controls">
            <div className="search-header__search">
              <Skeleton height="2.5rem" />
            </div>
            <div className="search-header__sort">
              <Skeleton width="12rem" height="2.5rem" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
