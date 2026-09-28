import { Button } from 'sectei-library';
import { PageHeader, type Crumb } from '../shared/page-header/PageHeader';
import { useOrganizationCreate } from './useOrganizationCreate';
import '../dataset-create/dataset-create.css';

const CRUMBS: Crumb[] = [
  { label: 'Inicio', href: '/dashboard' },
  { label: 'Organizaciones', href: '/organizations' },
  { label: 'Nueva organización' },
];

export function OrganizationCreate() {
  const { saving, error, fields, fieldErrors, submit } = useOrganizationCreate();

  return (
    <div className="c-dataset-create c-organization-create">
      <PageHeader
        title="Nueva organización"
        intro="Registra una organización para publicar y administrar datasets."
        crumbs={CRUMBS}
        action={
          <Button type="button" variant="secondary" href="/organizations">
            Cancelar
          </Button>
        }
      />

      <div className="container width-fixed c-dataset-create__body">
        <form className="c-dataset-create__form" onSubmit={submit} noValidate>
          <div className="c-dataset-create__columns">
            <div className="c-dataset-create__column">
              <fieldset className="c-dataset-create__section">
                <legend className="c-dataset-create__legend">Identificación</legend>

                <div className="c-dataset-create__field">
                  <label htmlFor="name">Nombre *</label>
                  <input
                    id="name"
                    type="text"
                    value={fields.name}
                    onChange={(e) => fields.setName(e.target.value)}
                    name="name"
                    placeholder="Ej: Universidad Iberoamericana"
                    aria-invalid={!!fieldErrors.name}
                    aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                  />
                  {fieldErrors.name ? (
                    <p id="name-error" className="c-dataset-create__error" role="alert">
                      {fieldErrors.name}
                    </p>
                  ) : null}
                </div>

                <div className="c-dataset-create__field">
                  <label htmlFor="slug">URL de la organización *</label>
                  <input
                    id="slug"
                    type="text"
                    value={fields.slug}
                    onChange={(e) => fields.setSlug(e.target.value)}
                    name="slug"
                    placeholder="ej. ibero"
                    aria-invalid={!!fieldErrors.slug}
                    aria-describedby={fieldErrors.slug ? 'slug-error' : 'slug-help'}
                  />
                  {fieldErrors.slug ? (
                    <p id="slug-error" className="c-dataset-create__error" role="alert">
                      {fieldErrors.slug}
                    </p>
                  ) : (
                    <p id="slug-help" className="form-help">
                      Solo minúsculas, números y guiones (ej. universidad-ibero).
                    </p>
                  )}
                </div>

                <div className="c-dataset-create__field">
                  <label htmlFor="description">Descripción</label>
                  <textarea
                    id="description"
                    rows={3}
                    value={fields.description}
                    onChange={(e) => fields.setDescription(e.target.value)}
                    name="description"
                    placeholder="A qué se dedica la organización y qué tipo de datos publica."
                  />
                </div>
              </fieldset>
            </div>
          </div>

          {error ? (
            <p className="c-dataset-create__error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="c-dataset-create__footer">
            <div className="c-dataset-create__actions">
              <Button type="button" variant="secondary" href="/organizations">
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={saving} icon="pictogram-add">
                {saving ? 'Creando…' : 'Crear organización'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
