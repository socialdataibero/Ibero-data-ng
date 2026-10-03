import { Button } from 'sectei-library';
import {
  PERIOD_TYPE_OPTIONS,
  SURVEY_OPTIONS,
  type DatasetVisibility,
  type PeriodType,
  type Survey,
} from '../../core/models/dataset.model';
import { PageHeader } from '../shared/page-header/PageHeader';
import { OrganizationNotFound } from '../shared/organization-not-found/OrganizationNotFound';
import { useDatasetCreate } from './useDatasetCreate';
import { DatasetCreateSkeleton } from './DatasetCreateSkeleton';
import './dataset-create.css';

export function DatasetCreate() {
  const {
    organizationId,
    checkingOrganization,
    organizationNotFound,
    saving,
    error,
    revisionOf,
    fields,
    fieldErrors,
    submit,
  } = useDatasetCreate();

  if (organizationNotFound) return <OrganizationNotFound />;
  if (checkingOrganization) return <DatasetCreateSkeleton />;

  const crumbs = [
    { label: 'Inicio', href: '/dashboard' },
    { label: 'Organizaciones', href: '/organizations' },
    { label: 'Datasets', href: `/organizations/${organizationId}` },
    { label: revisionOf ? 'Nueva revisión' : 'Nuevo dataset' },
  ];

  return (
    <div className="c-dataset-create">
      <PageHeader
        title={revisionOf ? 'Nueva revisión' : 'Nuevo dataset'}
        intro={
          revisionOf ? (
            <p className="c-dataset-create__revision m-0">
              Esta es una <strong>revisión</strong> de <strong>{revisionOf.title}</strong> (v
              {revisionOf.revision}).
            </p>
          ) : (
            'Define la identificación, clasificación y visibilidad del conjunto de datos.'
          )
        }
        crumbs={crumbs}
        action={
          <Button type="button" variant="secondary" href={`/organizations/${organizationId}`}>
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
                  <label htmlFor="title">Título *</label>
                  <input
                    id="title"
                    type="text"
                    value={fields.title}
                    onChange={(e) => fields.setTitle(e.target.value)}
                    name="title"
                    placeholder="Ej: ENIGH 2024 — Encuesta Nacional de Ingresos y Gastos"
                    aria-invalid={!!fieldErrors.title}
                    aria-describedby={fieldErrors.title ? 'title-error' : undefined}
                  />
                  {fieldErrors.title ? (
                    <p id="title-error" className="c-dataset-create__error" role="alert">
                      {fieldErrors.title}
                    </p>
                  ) : null}
                </div>

                <div className="c-dataset-create__field">
                  <label htmlFor="slug">Identificador del dataset *</label>
                  <input
                    id="slug"
                    type="text"
                    value={fields.slug}
                    onChange={(e) => fields.setSlug(e.target.value)}
                    name="slug"
                    placeholder="ej. enigh-2024-v1"
                    aria-invalid={!!fieldErrors.slug}
                    aria-describedby={fieldErrors.slug ? 'slug-error' : 'slug-help'}
                  />
                  {fieldErrors.slug ? (
                    <p id="slug-error" className="c-dataset-create__error" role="alert">
                      {fieldErrors.slug}
                    </p>
                  ) : (
                    <p id="slug-help" className="form-help">
                      Nombre corto para reconocer el dataset en el sistema. No es una URL: solo
                      minúsculas, números y guiones (ej. enigh-2024-v1).
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
                    placeholder="Qué contiene el dataset, metodología, fuente y notas relevantes."
                  />
                </div>
              </fieldset>

              <fieldset className="c-dataset-create__section">
                <legend className="c-dataset-create__legend">Clasificación temática</legend>

                <div className="c-dataset-create__field">
                  <label htmlFor="survey">Programa / Encuesta</label>
                  <select
                    id="survey"
                    value={fields.survey}
                    onChange={(e) => fields.setSurvey(e.target.value as Survey | '')}
                    name="survey"
                  >
                    <option value="">— Selecciona —</option>
                    {SURVEY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="c-dataset-create__row">
                  <div className="c-dataset-create__field">
                    <label htmlFor="year">Año de la encuesta</label>
                    <input
                      id="year"
                      type="number"
                      min={1990}
                      max={2099}
                      value={fields.year}
                      onChange={(e) => fields.setYear(e.target.value)}
                      name="year"
                      placeholder="2024"
                      aria-invalid={!!fieldErrors.year}
                      aria-describedby={fieldErrors.year ? 'year-error' : undefined}
                    />
                    {fieldErrors.year ? (
                      <p id="year-error" className="c-dataset-create__error" role="alert">
                        {fieldErrors.year}
                      </p>
                    ) : null}
                  </div>

                  <div className="c-dataset-create__field">
                    <label htmlFor="periodType">Tipo de periodo</label>
                    <select
                      id="periodType"
                      value={fields.periodType}
                      onChange={(e) => fields.setPeriodType(e.target.value as PeriodType | '')}
                      name="periodType"
                    >
                      <option value="">— Selecciona —</option>
                      {PERIOD_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </fieldset>
            </div>

            <div className="c-dataset-create__column">
              <fieldset className="c-dataset-create__section">
                <legend className="c-dataset-create__legend">Fuente y descubribilidad</legend>

                <div className="c-dataset-create__field">
                  <label htmlFor="sourceOrg">Organización fuente</label>
                  <input
                    id="sourceOrg"
                    type="text"
                    value={fields.sourceOrg}
                    onChange={(e) => fields.setSourceOrg(e.target.value)}
                    name="sourceOrg"
                    placeholder="Ej: INEGI, CONEVAL, SEP. Vacío si es interno."
                  />
                </div>

                <div className="c-dataset-create__field">
                  <label htmlFor="sourceUrl">URL de la fuente original</label>
                  <input
                    id="sourceUrl"
                    type="url"
                    value={fields.sourceUrl}
                    onChange={(e) => fields.setSourceUrl(e.target.value)}
                    name="sourceUrl"
                    autoComplete="off"
                    placeholder="https://www.inegi.org.mx/programas/enigh/2024/"
                    aria-invalid={!!fieldErrors.sourceUrl}
                    aria-describedby={fieldErrors.sourceUrl ? 'sourceUrl-error' : undefined}
                  />
                  {fieldErrors.sourceUrl ? (
                    <p id="sourceUrl-error" className="c-dataset-create__error" role="alert">
                      {fieldErrors.sourceUrl}
                    </p>
                  ) : null}
                </div>

                <div className="c-dataset-create__field">
                  <label htmlFor="tags">Etiquetas</label>
                  <input
                    id="tags"
                    type="text"
                    value={fields.tagsText}
                    onChange={(e) => fields.setTagsText(e.target.value)}
                    name="tags"
                    placeholder="encuesta, hogares, ingreso"
                  />
                  <p className="form-help">Separa las etiquetas con comas.</p>
                </div>

                <div className="c-dataset-create__field">
                  <label htmlFor="licenseId">Licencia</label>
                  <input
                    id="licenseId"
                    type="text"
                    value={fields.licenseId}
                    onChange={(e) => fields.setLicenseId(e.target.value)}
                    name="licenseId"
                    placeholder="Ej: cc-by, cc0"
                  />
                </div>
              </fieldset>

              {revisionOf ? (
                <fieldset className="c-dataset-create__section">
                  <legend className="c-dataset-create__legend">Versionado</legend>
                  <div className="c-dataset-create__field">
                    <label htmlFor="changelog">Cambios respecto a la versión anterior</label>
                    <textarea
                      id="changelog"
                      rows={2}
                      value={fields.changelog}
                      onChange={(e) => fields.setChangelog(e.target.value)}
                      name="changelog"
                      placeholder="Ej: Corrección en columna ingreso_mensual."
                    />
                  </div>
                </fieldset>
              ) : null}

              <fieldset className="c-dataset-create__section">
                <legend className="c-dataset-create__legend">Visibilidad</legend>
                <div className="c-dataset-create__field">
                  <label htmlFor="visibility">Visibilidad</label>
                  <select
                    id="visibility"
                    value={fields.visibility}
                    onChange={(e) => fields.setVisibility(e.target.value as DatasetVisibility)}
                    name="visibility"
                  >
                    <option value="PRIVATE">Privado</option>
                    <option value="PUBLIC">Público</option>
                  </select>
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
              <Button type="button" variant="secondary" href={`/organizations/${organizationId}`}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={saving} icon="pictogram-add">
                {saving ? 'Creando…' : 'Crear dataset'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
