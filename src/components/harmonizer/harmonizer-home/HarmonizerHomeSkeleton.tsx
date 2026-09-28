import { PageHeaderSkeleton } from '../../shared/page-header/PageHeaderSkeleton';
import { Skeleton } from '../../shared/skeleton/Skeleton';
import { SkeletonStatus } from '../../shared/skeleton/SkeletonStatus';
import { SurveyModuleSkeleton } from '../../shared/survey-module/SurveyModuleSkeleton';
import './harmonizer-home.css';

const ITEMS = 2;

export function HarmonizerHomeListSkeleton() {
  return (
    <SkeletonStatus label="Cargando encuestas…" className="c-harmonizer-home__list">
      {Array.from({ length: ITEMS }, (_, index) => (
        <SurveyModuleSkeleton key={index} />
      ))}
    </SkeletonStatus>
  );
}

export function HarmonizerHomeSkeleton() {
  return (
    <div className="c-harmonizer-home">
      <PageHeaderSkeleton />
      <section className="container width-fixed c-harmonizer-home__body">
        <Skeleton width="10rem" height="1.75rem" className="c-harmonizer-home__subtitle" />
        <HarmonizerHomeListSkeleton />
      </section>
    </div>
  );
}
