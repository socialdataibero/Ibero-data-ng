import { Skeleton } from './Skeleton';

export interface CardSkeletonProps {
  className?: string;
  imageHeight?: string;
  lines?: number;
}

export function CardSkeleton({ className = '', imageHeight, lines = 2 }: CardSkeletonProps) {
  return (
    <div className={['card', className].filter(Boolean).join(' ')} aria-hidden="true">
      {imageHeight ? <Skeleton height={imageHeight} className="card-image skeleton--flat" /> : null}
      <div className="card-body skeleton-stack">
        <Skeleton width="70%" height="1.25rem" />
        {Array.from({ length: lines }, (_, index) => (
          <Skeleton key={index} width={index === lines - 1 ? '50%' : '90%'} height="0.875rem" />
        ))}
      </div>
    </div>
  );
}
