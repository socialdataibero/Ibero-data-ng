import { Button } from 'sectei-library';
import { PageHeader } from '../page-header/PageHeader';

export function OrganizationNotFound() {
  return (
    <PageHeader
      title="Organización no encontrada"
      intro="No existe una organización con esta dirección. Puede que se haya borrado o que la dirección esté mal escrita."
      crumbs={[
        { label: 'Inicio', href: '/dashboard' },
        { label: 'Organizaciones', href: '/organizations' },
        { label: 'No encontrada' },
      ]}
      action={
        <Button type="button" variant="secondary" icon="pictogram-arrow-left" href="/organizations">
          Organizaciones
        </Button>
      }
    />
  );
}
