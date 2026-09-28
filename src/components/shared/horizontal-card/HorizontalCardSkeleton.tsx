import { Skeleton } from '../skeleton/Skeleton';
import './horizontal-card.css';

export interface HorizontalCardSkeletonProps {
  compact?: boolean;
}

export function HorizontalCardSkeleton({ compact = false }: HorizontalCardSkeletonProps) {
  const classes = ['card', 'horizontal-card', compact ? 'horizontal-card--compact' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} aria-hidden="true">
      <div className="card-body">
        <div className="skeleton-row">
          <Skeleton width="55%" height="1.25rem" />
          <Skeleton width="4.5rem" height="1.25rem" className="skeleton--round" />
        </div>
        <div className="skeleton-row">
          <Skeleton width="7rem" height="0.875rem" />
          <Skeleton width="4rem" height="0.875rem" />
          {compact ? null : <Skeleton width="8rem" height="0.875rem" />}
        </div>
        {compact ? null : <Skeleton width="40%" height="0.875rem" />}
      </div>
    </div>
  );
}
