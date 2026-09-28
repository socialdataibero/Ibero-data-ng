import { useId, type MouseEvent } from 'react';
import { Button, SearchField } from 'sectei-library';
import { PageHeader } from '../shared/page-header/PageHeader';
import { Paginator } from '../shared/paginator/Paginator';
import { ConfirmDialog } from '../shared/confirm-dialog/ConfirmDialog';
import { Filters } from '../shared/filters/Filters';
import { DATASET_FILTERS } from '../../data/dataset-filters';
import { SORT_OPTIONS, type SortOrder } from '../datasets-list/useDatasetsList';
import { useOrganizationDetail } from './useOrganizationDetail';
import { OrganizationDetailGridSkeleton } from './OrganizationDetailSkeleton';
import '../shared/cards-section/cards-section.css';
import './organization-detail.css';

function visibilityLabel(visibility: string): string {
  if (visibility === 'PUBLIC') return 'Público';
  if (visibility === 'PRIVATE') return 'Privado';
  return visibility;
}

export function OrganizationDetail() {
  const sortId = useId();
  const {
    organizationId,
    organization,
    datasets,
    page,
    totalPages,
    goTo,
    hasCriteria,
    sortOrder,
    onSearch,
    onSortChange,
    filtersOpen,
    setFiltersOpen,
    activeFilters,
    setActiveFilters,
    loading,
    error,
    removingId,
    pendingDelete,
    requestRemoveDataset,
    cancelRemoveDataset,
    confirmRemoveDataset,
    crumbs,
  } = useOrganizationDetail();

  return (
    <div className="c-organization-detail">
      <PageHeader
        title="Datasets"
        intro={
          organization
            ? `Datasets publicados por ${organization.name}.`
            : 'Datasets de esta organización.'
        }
        crumbs={crumbs}
        action={
          <Button
            type="button"
            variant="primary"
            icon="pictogram-add"
            href={`/organizations/${organizationId}/datasets/new`}
          >
            Nuevo dataset
          </Button>
        }
      />

      <section className="container width-fixed c-organization-detail__body" aria-label="Listado">
        {error ? <p className="c-organization-detail__error">{error}</p> : null}

        <div className="cards-section__tools">
          <div className="cards-section__search">
            <SearchField
              searchProperty="title"
              placeholder='Busca por título, por ejemplo "ENADIS"…'
              id="search-organization-datasets"
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
          <OrganizationDetailGridSkeleton />
        ) : datasets.length === 0 ? (
          <p className="c-organization-detail__empty">
            {hasCriteria
              ? 'No hay datasets que coincidan con la búsqueda o los filtros.'
              : 'Todavía no hay datasets en esta organización.'}
          </p>
        ) : (
          <ul className="c-organization-detail__grid">
            {datasets.map((dataset) => (
              <li key={dataset.id}>
                <article className="card c-organization-detail__card">
                  <div className="c-organization-detail__tags">
                    <span className="c-organization-detail__chip">
                      {visibilityLabel(dataset.visibility)}
                    </span>
                    {dataset.survey ? (
                      <span className="c-organization-detail__chip">{dataset.survey}</span>
                    ) : null}
                    {dataset.year ? (
                      <span className="c-organization-detail__chip">{dataset.year}</span>
                    ) : null}
                    {dataset.revision > 1 ? (
                      <span className="c-organization-detail__chip">v{dataset.revision}</span>
                    ) : null}
                  </div>

                  <p className="card-title c-organization-detail__title">{dataset.title}</p>

                  {dataset.supersededById ? (
                    <p className="c-organization-detail__meta">
                      Hay una revisión más reciente
                    </p>
                  ) : null}

                  <div className="c-organization-detail__actions">
                    <Button
                      type="button"
                      variant="primary"
                      size="small"
                      icon="pictogram-eye-view"
                      href={`/organizations/${organizationId}/datasets/${dataset.id}`}
                    >
                      Ver
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="small"
                      icon="pictogram-delete"
                      aria-label={`Eliminar dataset ${dataset.title}`}
                      disabled={removingId === dataset.id}
                      onClick={(event) => requestRemoveDataset(dataset, event as MouseEvent)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </article>
              </li>
            ))}
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

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Borrar dataset"
        message={
          pendingDelete ? (
            <>
              ¿Borrar el dataset "{pendingDelete.title}"? Se borran también sus resources y
              análisis. Esto no se puede deshacer.
            </>
          ) : null
        }
        confirmLabel="Borrar"
        danger
        confirming={removingId === pendingDelete?.id}
        onConfirm={() => void confirmRemoveDataset()}
        onCancel={cancelRemoveDataset}
      />
    </div>
  );
}
