import { useId } from 'react';
import { Button, SearchField } from 'sectei-library';
import { PageHeader } from '../shared/page-header/PageHeader';
import { Paginator } from '../shared/paginator/Paginator';
import { Filters } from '../shared/filters/Filters';
import { HorizontalCard } from '../shared/horizontal-card/HorizontalCard';
import { DATASET_FILTERS } from '../../data/dataset-filters';
import { CRUMBS, SORT_OPTIONS, useDatasetsList, type SortOrder } from './useDatasetsList';
import { DatasetsListItemsSkeleton } from './DatasetsListSkeleton';
import '../shared/cards-section/cards-section.css';
import './datasets-list.css';

export function DatasetsList() {
  const sortId = useId();
  const {
    loading,
    sortOrder,
    page,
    totalPages,
    pageItems,
    goTo,
    onSearch,
    onSortChange,
    filtersOpen,
    setFiltersOpen,
    activeFilters,
    setActiveFilters,
  } = useDatasetsList();

  return (
    <div className="c-datasets-list cards-section">
      <PageHeader
        title="Conjuntos de datos"
        intro="Catálogo de datasets abiertos y privados. Explora, filtra y abre fichas para consultar recursos."
        crumbs={CRUMBS}
        action={
          <Button type="button" variant="primary" icon="pictogram-add" href="/organizations">
            Agregar conjunto de datos
          </Button>
        }
      />

      <section
        className="container width-fixed cards-section__body"
        aria-labelledby="datasets-subtitle"
      >
        <h2 id="datasets-subtitle" className="cards-section__subtitle m-t-0">
          Conjuntos de datos recientes
        </h2>

        <div className="cards-section__tools">
          <div className="cards-section__search">
            <SearchField
              searchProperty="title"
              placeholder='Busca por título, por ejemplo "ENADIS"…'
              id="search-datasets"
              onSearch={(text) => onSearch(String(text ?? ''))}
            />
          </div>

          <div className="cards-section__bar">
            <div className="cards-section__actions">
              <Button
                type="button"
                variant="secondary"
                icon="pictogram-filter"
                onClick={() => setFiltersOpen(true)}
              >
                Filtros
                {activeFilters.length > 0 ? ` (${activeFilters.length})` : ''}
              </Button>
            </div>

            <div className="cards-section__sort">
              <label htmlFor={sortId}>Ordenar por</label>
              <select
                id={sortId}
                name="sort"
                value={sortOrder}
                onChange={(e) => onSortChange(e.target.value as SortOrder)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <DatasetsListItemsSkeleton />
        ) : pageItems.length === 0 ? (
          <p className="text-color-secondary m-0">No hay elementos para mostrar.</p>
        ) : (
          <ul className="cards-section__list">
            {pageItems.map(
              ({ id, organizationId, createdAt: _createdAt, updatedAt: _updatedAt, ...card }) => (
                <li key={id}>
                  <HorizontalCard
                    {...card}
                    href={`/organizations/${organizationId}/datasets/${id}`}
                  />
                </li>
              ),
            )}
          </ul>
        )}

        <Paginator page={page} totalPages={totalPages} onChange={goTo} />
      </section>

      <Filters
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title={DATASET_FILTERS.title}
        sections={DATASET_FILTERS.sections}
        values={activeFilters}
        onChange={setActiveFilters}
        onApply={setActiveFilters}
        onClear={() => setActiveFilters([])}
      />
    </div>
  );
}
