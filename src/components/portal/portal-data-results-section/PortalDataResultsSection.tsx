import type { HTMLAttributes } from 'react';
import { Button } from 'sectei-library';
import { PortalGridViewIcon } from '../../shared/portal/portal-grid-view-icon/PortalGridViewIcon';
import {
  PortalDataCard,
  type PortalDataCardProps,
} from '../../shared/portal/portal-data-card/PortalDataCard';
import { CardSkeleton } from '../../shared/skeleton/CardSkeleton';
import { Skeleton } from '../../shared/skeleton/Skeleton';
import { SkeletonStatus } from '../../shared/skeleton/SkeletonStatus';
import { usePortalDataResultsSection } from './usePortalDataResultsSection';
import './portal-data-results-section.css';

export interface PortalDataResultItem extends PortalDataCardProps {
  id?: string | number;
  key?: string;
}

export interface PortalDataResultsSectionProps extends HTMLAttributes<HTMLElement> {
  total?: number;
  lastUpdated?: string;
  items?: PortalDataResultItem[];
  countLabel?: string;
  loading?: boolean;
  className?: string;
}

const SKELETON_ITEMS = 6;

export function PortalDataResultsSection({
  total,
  lastUpdated = '',
  items = [],
  countLabel = 'Datos disponibles',
  loading = false,
  className = '',
  ...rest
}: PortalDataResultsSectionProps) {
  const { titleId, count, classes } = usePortalDataResultsSection({ total, items, className });

  return (
    <section className={classes} aria-labelledby={titleId} {...rest}>
      <div className="data-results-section__header">
        <div className="data-results-section__info">
          <h2 id={titleId} className="data-results-section__title">
            {loading ? <Skeleton width="14rem" height="1.75rem" /> : `${count} ${countLabel}`}
          </h2>
          {lastUpdated ? <p className="data-results-section__updated">Última actualización: {lastUpdated}</p> : null}
        </div>

        <div className="data-results-section__views">
          <Button
            type="button"
            variant="primary"
            size="small"
            iconOnly
            aria-label="Vista de cuadrícula"
            aria-pressed={true}
            className="data-results-section__view data-results-section__view--active"
          >
            <PortalGridViewIcon className="data-results-section__icon" />
          </Button>
        </div>
      </div>

      {loading ? (
        <SkeletonStatus
          label="Cargando datos…"
          className="data-results-section__list data-results-section__list--grid"
        >
          {Array.from({ length: SKELETON_ITEMS }, (_, index) => (
            <CardSkeleton
              key={index}
              className="data-card data-results-section__card"
              imageHeight="7.5rem"
            />
          ))}
        </SkeletonStatus>
      ) : items.length > 0 ? (
        <div className="data-results-section__list data-results-section__list--grid">
          {items.map((item, index) => {
            const { id, key, className: cardClassName, ...cardProps } = item;

            return (
              <PortalDataCard
                key={key ?? id ?? `item-${index}`}
                className={['data-results-section__card', cardClassName].filter(Boolean).join(' ')}
                {...cardProps}
              />
            );
          })}
        </div>
      ) : (
        <p className="text-color-secondary" aria-live="polite">
          No hay datos disponibles.
        </p>
      )}
    </section>
  );
}
