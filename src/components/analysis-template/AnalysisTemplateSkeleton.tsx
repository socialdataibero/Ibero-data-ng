import { PageHeaderSkeleton } from '../shared/page-header/PageHeaderSkeleton';
import { Skeleton } from '../shared/skeleton/Skeleton';
import { SkeletonStatus } from '../shared/skeleton/SkeletonStatus';
import './analysis-template.css';

export function TemplateStepsSkeleton() {
  return (
    <SkeletonStatus label="Cargando…" className="skeleton-stack">
      <Skeleton width="4rem" height="1rem" />
      <Skeleton width="24rem" height="2.5rem" />
    </SkeletonStatus>
  );
}

export function AnalysisTemplateSkeleton() {
  return (
    <div className="c-analysis-template">
      <PageHeaderSkeleton />
      <div className="container width-fixed c-analysis-template__body">
        <section className="c-analysis-template__step">
          <Skeleton width="8rem" height="1.5rem" />
          <TemplateStepsSkeleton />
        </section>
        <section className="c-analysis-template__step" aria-hidden="true">
          <Skeleton width="14rem" height="1.5rem" />
          <div className="c-analysis-template__cards">
            <Skeleton height="7rem" />
            <Skeleton height="7rem" />
            <Skeleton height="7rem" />
          </div>
        </section>
      </div>
    </div>
  );
}
