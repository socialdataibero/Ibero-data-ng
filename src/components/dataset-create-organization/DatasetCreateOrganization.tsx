import { Navigate } from 'react-router-dom';
import { Button } from 'sectei-library';
import { PageHeader } from '../shared/page-header/PageHeader';
import { FormSkeleton } from '../shared/skeleton/FormSkeleton';
import { useDatasetCreateOrganization } from './useDatasetCreateOrganization';
import '../dataset-create/dataset-create.css';
import './dataset-create-organization.css';

const CRUMBS = [
  { label: 'Inicio', href: '/dashboard' },
  { label: 'Conjuntos de datos', href: '/datasets' },
  { label: 'Nuevo conjunto de datos' },
];

const newDatasetHref = (organizationId: string) => `/organizations/${organizationId}/datasets/new`;

/**
 * "Agregar conjunto de datos" from the datasets catalog (SDI-119). A dataset always belongs to an organization, so
 * this asks which one first, or goes straight to the form when the user can only add datasets to one.
 */
export function DatasetCreateOrganization() {
  const { options, error } = useDatasetCreateOrganization();

  if (!options && !error) return <FormSkeleton columns={[[{ fields: ['input'] }]]} actions={0} headerAction={false} />;
  if (options?.length === 1) return <Navigate to={newDatasetHref(options[0].id)} replace />;

  return (
    <div className="c-dataset-create">
      <PageHeader
        title="Nuevo conjunto de datos"
        intro="Cada conjunto de datos pertenece a una organización. Elige en cuál lo vas a publicar."
        crumbs={CRUMBS}
      />
      <div className="container width-fixed c-dataset-create__body">
        {error ? (
          <p className="c-dataset-create__error" role="alert">
            {error}
          </p>
        ) : options?.length === 0 ? (
          <p>
            Para agregar conjuntos de datos necesitas el rol de Administrador o Editor en una organización. Pídeselo a
            quien administra tu organización.
          </p>
        ) : (
          <ul className="c-dataset-create-organization__list">
            {options?.map((org) => (
              <li key={org.id}>
                <Button type="button" variant="secondary" icon="pictogram-add" href={newDatasetHref(org.id)}>
                  {org.name}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
