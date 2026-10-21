import { Button } from 'sectei-library';
import { PageHeader } from '../page-header/PageHeader';

/** Shown for a dataset that does not exist or that the user cannot see (a private one of another organization). */
export function DatasetNotFound() {
  return (
    <PageHeader
      title="Conjunto de datos no encontrado"
      intro="No existe un conjunto de datos con esta dirección, o es privado de una organización a la que no perteneces."
      crumbs={[
        { label: 'Inicio', href: '/dashboard' },
        { label: 'Conjuntos de datos', href: '/datasets' },
        { label: 'No encontrado' },
      ]}
      action={
        <Button type="button" variant="secondary" icon="pictogram-arrow-left" href="/datasets">
          Conjuntos de datos
        </Button>
      }
    />
  );
}
