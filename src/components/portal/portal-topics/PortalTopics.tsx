import { Icon } from '../../shared/icon/Icon';
import { PageHeader } from '../../shared/page-header/PageHeader';
import { PortalCatalogSection } from '../portal-catalog-section/PortalCatalogSection';
import { usePortalTopics } from './usePortalTopics';
import './portal-topics.css';

export default function PortalTopics() {
  const {
    catalog,
    total,
    loading,
    error,
    sort,
    setSort,
    setQuery,
    page,
    totalPages,
    pageNumbers,
    goTo,
  } = usePortalTopics();

  return (
    <main id="main-content" className="c-portal-topics">
      <PageHeader
        title="Temas"
        intro="Los temas son las categorías en las que se han agrupado los datos para facilitar su consulta. Cada tema tiene una o más fuentes de datos asociadas. Busca por tema o por fuente de datos:"
        crumbs={[{ label: 'Inicio', href: '/' }, { label: 'Temas' }]}
      />

      {error ? (
        <section className="container width-fixed" style={{ paddingBlock: '2rem' }}>
          <p role="alert" className="text-color-secondary">
            No se pudieron cargar los temas: {error.message}
          </p>
        </section>
      ) : (
        <>
          <PortalCatalogSection
            items={catalog}
            total={total}
            sort={sort}
            onSortChange={setSort}
            onSearch={setQuery}
            searchLabel="Buscar tema"
            countLabel="Temas"
            loading={loading}
          />

          {totalPages > 1 ? (
            <nav className="paginator container width-fixed" aria-label="Paginación">
              <button
                type="button"
                className="paginator__control"
                aria-label="Página anterior"
                disabled={page <= 1}
                onClick={() => goTo(page - 1)}
              >
                <Icon name="chevron-left" size={16} />
              </button>

              <ul className="paginator__list">
                {pageNumbers.map((number) => (
                  <li key={number}>
                    <button
                      type="button"
                      className={`paginator__page${
                        number === page ? ' paginator__page--current' : ''
                      }`}
                      aria-label={`Página ${number}`}
                      aria-current={number === page ? 'page' : undefined}
                      onClick={() => goTo(number)}
                    >
                      {number}
                    </button>
                  </li>
                ))}
              </ul>

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
