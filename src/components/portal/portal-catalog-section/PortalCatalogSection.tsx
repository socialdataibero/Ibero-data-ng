import type { HTMLAttributes } from 'react';
import { SearchField, Card } from 'sectei-library';
import { CardSkeleton } from '../../shared/skeleton/CardSkeleton';
import { Skeleton } from '../../shared/skeleton/Skeleton';
import { SkeletonStatus } from '../../shared/skeleton/SkeletonStatus';
import { usePortalCatalogSection } from './usePortalCatalogSection';
import './portal-catalog-section.css';

export interface PortalCatalogItem {
  id?: string | number;
  key?: string;
  className?: string;
  [key: string]: unknown;
}

export interface PortalCatalogSectionProps<T extends PortalCatalogItem> extends HTMLAttributes<HTMLElement> {
  items?: T[];
  total?: number;
  searchLabel?: string;
  countLabel?: string;
  sort?: string;
  onSearch?: (query: string) => void;
  onSortChange?: (sort: string) => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const SKELETON_ITEMS = 6;

export function PortalCatalogSection<T extends PortalCatalogItem>({
  items = [],
  total,
  searchLabel = 'Buscar...',
  countLabel = 'Resultados',
  sort,
  onSearch,
  onSortChange,
  disabled = false,
  loading = false,
  className = '',
  ...rest
}: PortalCatalogSectionProps<T>) {
  const { sortId, classes, SORT_AZ, SORT_ZA } = usePortalCatalogSection({ className });

  return (
    <section className={classes} {...rest}>
      <div className="catalog-section__controls">
        <div className="catalog-section__search">
          <SearchField
            placeholder={searchLabel}
            disabled={disabled}
            onSearch={(query) => onSearch?.(String(query ?? ''))}
          />
        </div>
        <div className="catalog-section__sort">
          <label htmlFor={sortId}>Ordenar por:</label>
          <select
            id={sortId}
            value={sort}
            disabled={disabled}
            onChange={(event) => onSortChange?.(event.target.value)}
          >
            <option value={SORT_AZ}>De la A a la Z</option>
            <option value={SORT_ZA}>De la Z a la A</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Skeleton width="8rem" height="1rem" className="m-b-4" />
      ) : (
        <p className="text-color-secondary m-b-4" aria-live="polite">
          {countLabel}: {total ?? items.length}
        </p>
      )}

      {loading ? (
        <SkeletonStatus label="Cargando resultados…" className="catalog-section__grid">
          {Array.from({ length: SKELETON_ITEMS }, (_, index) => (
            <CardSkeleton
              key={index}
              className="catalog-section__card"
              imageHeight="10rem"
              lines={3}
            />
          ))}
        </SkeletonStatus>
      ) : items.length > 0 ? (
        <div className="catalog-section__grid">
          {items.map((item, index) => {
            const { id, key, name: _name, className: cardClassName, ...cardProps } = item as PortalCatalogItem & { name?: unknown };
            void _name;

            return (
              <Card
                key={key ?? id ?? `card-${index}`}
                className={['catalog-section__card', cardClassName].filter(Boolean).join(' ')}
                {...cardProps}
              />
            );
          })}
        </div>
      ) : (
        <p className="text-color-secondary">No se encontraron resultados que coincidan con la búsqueda.</p>
      )}
    </section>
  );
}
