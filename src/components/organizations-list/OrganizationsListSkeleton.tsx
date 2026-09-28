import { CardsSectionSkeleton } from '../shared/cards-section/CardsSectionSkeleton';
import { OrganizationCardSkeleton } from '../shared/organization-card/OrganizationCardSkeleton';
import { SkeletonStatus } from '../shared/skeleton/SkeletonStatus';

const ITEMS = 6;

export function OrganizationsListItemsSkeleton() {
  return (
    <SkeletonStatus label="Cargando organizaciones…">
      <ul className="cards-section__grid">
        {Array.from({ length: ITEMS }, (_, index) => (
          <li key={index}>
            <OrganizationCardSkeleton />
          </li>
        ))}
      </ul>
    </SkeletonStatus>
  );
}

export function OrganizationsListSkeleton() {
  return (
    <CardsSectionSkeleton className="c-organizations-list">
      <OrganizationsListItemsSkeleton />
    </CardsSectionSkeleton>
  );
}
