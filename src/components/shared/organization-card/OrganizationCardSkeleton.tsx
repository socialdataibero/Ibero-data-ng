import { Skeleton } from '../skeleton/Skeleton';
import './organization-card.css';

export interface OrganizationCardSkeletonProps {
  layout?: 'vertical' | 'horizontal';
  compact?: boolean;
}

export function OrganizationCardSkeleton({
  layout = 'vertical',
  compact = false,
}: OrganizationCardSkeletonProps) {
  const isHorizontal = layout === 'horizontal';
  const classes = [
    'card',
    'organization-card',
    isHorizontal ? 'organization-card--horizontal' : '',
    compact ? 'organization-card--compact' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} aria-hidden="true">
      <div className="organization-card__media">
        <Skeleton height="100%" className="card-image skeleton--flat" />
      </div>
      <div className="card-body skeleton-stack">
        <Skeleton width="60%" height="1.25rem" />
        <Skeleton width="90%" height="0.875rem" />
        {isHorizontal ? (
          <div className="skeleton-row">
            <Skeleton width="2.5rem" height="0.875rem" />
            <Skeleton width="2.5rem" height="0.875rem" />
          </div>
        ) : (
          <>
            <Skeleton width="40%" height="0.875rem" />
            <Skeleton width="35%" height="0.875rem" />
          </>
        )}
      </div>
    </div>
  );
}
