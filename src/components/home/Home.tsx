import { Link } from 'react-router-dom';
import { PageHeader } from '../shared/page-header/PageHeader';
import { AccessWidget } from '../shared/access-widget/AccessWidget';
import { HorizontalCard } from '../shared/horizontal-card/HorizontalCard';
import { OrganizationCard } from '../shared/organization-card/OrganizationCard';
import { datasetToCardProps } from '../datasets-list/useDatasetsList';
import { useHome } from './useHome';
import { HomeRecentSkeleton } from './HomeSkeleton';
import './home.css';

const CRUMBS = [{ label: 'Inicio' }];

export function Home() {
  const { loading, recentDatasets, recentOrganizations, totalDatasets, totalOrganizations } =
    useHome();

  const recentRows = Array.from(
    {
      length: Math.max(recentDatasets.length, recentOrganizations.length),
    },
    (_, index) => ({
      dataset: recentDatasets[index] ?? null,
      organization: recentOrganizations[index] ?? null,
    }),
  );

  return (
    <div className="c-home">
      <PageHeader
        title="Inicio"
        intro="Banco de bases de datos de Ibero Data MX. Datasets abiertos y privados, con acceso programático vía DuckDB."
        crumbs={CRUMBS}
      />

      <section
        className="container width-fixed c-home__section"
        aria-labelledby="inicio-como-funciona"
      >
        <div className="width-read">
          <h2 id="inicio-como-funciona" className="c-home__subtitle m-t-0">
            Cómo funciona
          </h2>
          <ul className="c-home__how-list">
            <li>
              <strong>Catálogo abierto:</strong> Explora datasets de organizaciones de sociedad
              civil mexicana.
            </li>
            <li>
              <strong>Privacidad:</strong> Cada organización gestiona quién accede a sus datasets.
            </li>
          </ul>
        </div>
      </section>

      <section
        className="container width-fixed c-home__section"
        aria-labelledby="inicio-accesos"
      >
        <h2 id="inicio-accesos" className="c-home__subtitle m-t-0">
          Accesos rápidos
        </h2>

        <ul className="c-home__access-list">
          <li>
            <AccessWidget
              title="Conjuntos de datos"
              description="Explora, filtra y agrega datasets del catálogo."
              meta={`${totalDatasets} conjuntos`}
              href="/datasets"
              pictogram="pictogram-layers"
            />
          </li>
          <li>
            <AccessWidget
              title="Organizaciones"
              description="Consulta organizaciones, conjuntos y miembros."
              meta={`${totalOrganizations} organizaciones`}
              href="/organizations"
              pictogram="pictogram-group"
            />
          </li>
          <li>
            <AccessWidget
              title="Configuración de perfil"
              description="Actualiza tus datos, imagen y contraseña."
              meta="Datos de tu cuenta"
              href="/profile"
              pictogram="pictogram-person"
            />
          </li>
        </ul>
      </section>

      <section className="container width-fixed c-home__section" aria-label="Contenido reciente">
        {loading ? (
          <HomeRecentSkeleton />
        ) : (
          <div className="c-home__recent">
            <div className="c-home__recent-header">
              <div className="c-home__recent-header-side">
                <h2 id="inicio-conjuntos-recientes" className="c-home__subtitle m-t-0 m-b-0">
                  Conjuntos de datos recientes
                </h2>
                <Link to="/datasets" className="c-home__see-all">
                  Ver todos
                </Link>
              </div>

              <div
                className="c-home__recent-divider c-home__recent-divider--header"
                aria-hidden="true"
              />

              <div className="c-home__recent-header-side">
                <h2 id="inicio-orgs-recientes" className="c-home__subtitle m-t-0 m-b-0">
                  Organizaciones recientes
                </h2>
                <Link to="/organizations" className="c-home__see-all">
                  Ver todas
                </Link>
              </div>
            </div>

            {recentRows.length === 0 ? (
              <p className="c-home__empty">Todavía no hay contenido reciente.</p>
            ) : (
              <ul className="c-home__recent-rows">
                {recentRows.map((row, index) => {
                  const dataset = row.dataset;
                  const organization = row.organization;
                  let datasetCard = null;
                  if (dataset) {
                    const mapped = datasetToCardProps(dataset);
                    const {
                      id: _id,
                      organizationId: _organizationId,
                      createdAt: _createdAt,
                      updatedAt: _updatedAt,
                      ...props
                    } = mapped;
                    datasetCard = props;
                  }

                  return (
                    <li
                      key={dataset?.id ?? organization?.id ?? `row-${index}`}
                      className="c-home__recent-row"
                    >
                      <div className="c-home__recent-cell">
                        {dataset && datasetCard ? (
                          <HorizontalCard
                            compact
                            {...datasetCard}
                            href={`/organizations/${dataset.organizationId}/datasets/${dataset.id}`}
                          />
                        ) : null}
                      </div>

                      <div className="c-home__recent-divider" aria-hidden="true" />

                      <div className="c-home__recent-cell">
                        {organization ? (
                          <OrganizationCard
                            layout="horizontal"
                            compact
                            name={organization.name}
                            description={organization.description ?? ''}
                            datasets={organization._count?.datasets ?? 0}
                            members={organization._count?.members ?? 0}
                            href={`/organizations/${organization.id}`}
                          />
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
