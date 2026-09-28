import { CardsSectionSkeleton } from '../shared/cards-section/CardsSectionSkeleton';
import { HorizontalCardSkeleton } from '../shared/horizontal-card/HorizontalCardSkeleton';
import { SkeletonStatus } from '../shared/skeleton/SkeletonStatus';

const ITEMS = 5;

export function DatasetsListItemsSkeleton() {
  return (
    <SkeletonStatus label="Cargando conjuntos de datos…">
      <ul className="cards-section__list">
        {Array.from({ length: ITEMS }, (_, index) => (
          <li key={index}>
            <HorizontalCardSkeleton />
          </li>
        ))}
      </ul>
    </SkeletonStatus>
  );
}

export function DatasetsListSkeleton() {
  return (
    <CardsSectionSkeleton className="c-datasets-list">
      <DatasetsListItemsSkeleton />
    </CardsSectionSkeleton>
  );
}
