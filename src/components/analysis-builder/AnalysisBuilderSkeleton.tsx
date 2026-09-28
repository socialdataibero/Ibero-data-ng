import { Skeleton } from '../shared/skeleton/Skeleton';
import { SkeletonStatus } from '../shared/skeleton/SkeletonStatus';
import { TableSkeleton } from '../shared/skeleton/TableSkeleton';

const SAVED_ITEMS = 3;

export function SavedAnalysesSkeleton() {
  return (
    <SkeletonStatus label="Cargando análisis guardados…">
      <ul className="c-analysis-builder__list" aria-hidden="true">
        {Array.from({ length: SAVED_ITEMS }, (_, index) => (
          <li className="c-analysis-builder__item" key={index}>
            <div className="c-analysis-builder__item-header">
              <div className="skeleton-row">
                <Skeleton width="4rem" height="1rem" />
                <Skeleton width="14rem" height="1.25rem" />
                <Skeleton width="3.5rem" height="1.25rem" className="skeleton--round" />
              </div>
              <div className="c-analysis-builder__item-actions">
                <Skeleton width="5.5rem" height="2.5rem" />
                <Skeleton width="6.5rem" height="2.5rem" />
                <Skeleton width="5.5rem" height="2.5rem" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </SkeletonStatus>
  );
}

export function AnalysisResultSkeleton() {
  return (
    <SkeletonStatus label="Cargando resultado…">
      <TableSkeleton rows={4} />
    </SkeletonStatus>
  );
}
