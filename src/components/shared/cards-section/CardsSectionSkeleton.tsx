import type { ReactNode } from 'react';
import { PageHeaderSkeleton } from '../page-header/PageHeaderSkeleton';
import { Skeleton } from '../skeleton/Skeleton';
import './cards-section.css';

export interface CardsSectionSkeletonProps {
  className?: string;
  children: ReactNode;
}

export function CardsSectionToolsSkeleton() {
  return (
    <div className="cards-section__tools" aria-hidden="true">
      <div className="cards-section__search">
        <Skeleton height="2.5rem" />
      </div>
      <div className="cards-section__bar">
        <div className="cards-section__actions">
          <Skeleton width="7rem" height="2.5rem" />
        </div>
        <div className="cards-section__sort">
          <Skeleton width="12rem" height="2.5rem" />
        </div>
      </div>
    </div>
  );
}

export function CardsSectionSkeleton({ className = '', children }: CardsSectionSkeletonProps) {
  return (
    <div className={['cards-section', className].filter(Boolean).join(' ')}>
      <PageHeaderSkeleton />

      <section className="container width-fixed cards-section__body">
        <Skeleton width="16rem" height="1.75rem" className="cards-section__subtitle" />

        <CardsSectionToolsSkeleton />

        {children}
      </section>
    </div>
  );
}
