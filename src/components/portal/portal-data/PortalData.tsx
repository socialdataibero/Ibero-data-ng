import { Icon } from '../../shared/icon/Icon';
import { PortalSearchHeader } from '../portal-search-header/PortalSearchHeader';
import { PortalDataResultsSection } from '../portal-data-results-section/PortalDataResultsSection';
import { usePortalData } from './usePortalData';

export default function PortalData() {
  const {
    sort,
    setSort,
    setQuery,
    loading,
    error,
    items,
    total,
    page,
    totalPages,
    goTo,
    sortOptions,
    lastUpdated,
    orgFilter,
    orgFilterLabel,
    clearOrgFilter,
  } = usePortalData();

  return (
    <main id="main-content">
      <PortalSearchHeader
        title="Buscar datos"
        searchLabel={'Busca por tema "educación", "gasto"...'}
        sortOptions={sortOptions}
        sort={sort}
        onSortChange={setSort}
        onSearch={(text) => setQuery(String(text ?? ''))}
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Datos', href: orgFilter ? '/datos' : undefined },
          ...(orgFilter ? [{ label: orgFilterLabel ?? orgFilter }] : []),
        ]}
      />

      {orgFilter ? (
        <section className="container width-fixed" style={{ paddingBlock: '1rem 0' }}>
          <p className="text-color-secondary">
            Mostrando datos de <strong>{orgFilterLabel ?? orgFilter}</strong>.{' '}
            <button type="button" className="hyperlink" onClick={clearOrgFilter}>
              Quitar filtro
            </button>
          </p>
        </section>
      ) : null}

      {error ? (
        <section className="container width-fixed" style={{ paddingBlock: '2rem' }}>
          <p role="alert" className="text-color-secondary">
            No se pudo consultar el catálogo: {error.message}
          </p>
        </section>
      ) : (
        <>
          <PortalDataResultsSection
            total={total}
            lastUpdated={lastUpdated}
            items={items}
            loading={loading}
          />

          {totalPages > 1 ? (
            <nav className="paginator container width-fixed" aria-label="Paginación" style={{ paddingBlock: '1rem 2rem' }}>
              <button
                type="button"
                className="paginator__control"
                aria-label="Página anterior"
                disabled={page <= 1}
                onClick={() => goTo(page - 1)}
              >
                <Icon name="chevron-left" size={16} />
              </button>

              <span className="paginator__page paginator__page--current" aria-current="page">
                {page}
              </span>
              <span className="text-color-secondary"> de {totalPages}</span>

              <button
                type="button"
                className="paginator__control"
                aria-label="Página siguiente"
                disabled={page >= totalPages}
                onClick={() => goTo(page + 1)}
              >
                <Icon name="chevron-right" size={16} />
              </button>
            </nav>
          ) : null}
        </>
      )}
    </main>
  );
}
