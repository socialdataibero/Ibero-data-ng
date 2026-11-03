import { Button } from 'sectei-library';
import { PageHeader } from '../../shared/page-header/PageHeader';
import { useHarmonizerNewSurvey } from './useHarmonizerNewSurvey';
import { HarmonizerNewSurveySkeleton } from './HarmonizerNewSurveySkeleton';
import './harmonizer-new-survey.css';

export function HarmonizerNewSurvey() {
  const {
    isEdit,
    canSubmit,
    organizationId,
    setOrganizationId,
    organizations,
    crumbs,
    surveyName,
    setSurveyName,
    surveyDescription,
    setSurveyDescription,
    loading,
    loadError,
    saving,
    error,
    errorName,
    submit,
  } = useHarmonizerNewSurvey();

  const submitLabel = isEdit
    ? saving
      ? 'Guardando…'
      : 'Guardar cambios'
    : saving
      ? 'Creando…'
      : 'Crear encuesta';

  if (loading) return <HarmonizerNewSurveySkeleton />;

  return (
    <div className="c-harmonizer-new-survey">
      <PageHeader
        title={isEdit ? 'Editar encuesta' : 'Nueva encuesta'}
        intro={
          isEdit
            ? 'Cambia el nombre o la descripción de la encuesta. Sus ediciones y mapeos no se modifican.'
            : 'Crea una encuesta para agrupar ediciones (CSV o DBF) y armonizar sus variables.'
        }
        crumbs={crumbs}
        action={
          <Button type="button" variant="secondary" icon="pictogram-arrow-left" href="/harmonizer">
            Encuestas
          </Button>
        }
      />

      {loadError ? (
        <div className="container width-fixed c-harmonizer-new-survey__body">
          <p className="c-harmonizer-new-survey__error" role="alert">
            {loadError}
          </p>
        </div>
      ) : (
        <div className="container width-fixed c-harmonizer-new-survey__body">
          <form className="c-harmonizer-new-survey__form" onSubmit={submit} noValidate>
            <fieldset className="c-harmonizer-new-survey__section" disabled={saving || (isEdit && !canSubmit)}>
              <legend className="c-harmonizer-new-survey__legend">Datos de la encuesta</legend>

              {isEdit && !canSubmit ? (
                <p role="status">Solo lectura. No tienes permiso para modificar esta encuesta.</p>
              ) : null}
              {!isEdit ? (
                <div className="c-harmonizer-new-survey__field">
                  <label htmlFor="survey-organization">Organización *</label>
                  <select
                    id="survey-organization"
                    name="organizationId"
                    value={organizationId}
                    onChange={(event) => setOrganizationId(event.target.value)}
                    required
                    disabled={organizations.length === 0}
                    aria-describedby={organizations.length === 0 ? 'survey-organization-help' : undefined}
                  >
                    <option value="">Selecciona una organización</option>
                    {organizations.map((organization) => (
                      <option key={organization.id} value={organization.id}>{organization.name}</option>
                    ))}
                  </select>
                  {organizations.length === 0 ? (
                    <p id="survey-organization-help" role="status">
                      Necesitas el rol Administrador o Editor en una organización para crear encuestas.
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="c-harmonizer-new-survey__field">
                <label htmlFor="survey-name">Nombre *</label>
                <input
                  id="survey-name"
                  type="text"
                  value={surveyName}
                  onChange={(e) => setSurveyName(e.target.value)}
                  name="surveyName"
                  placeholder="Ej: Socioeconómica"
                  required
                  aria-invalid={!!errorName}
                  aria-describedby={errorName ? 'survey-name-error' : undefined}
                />
                {errorName ? (
                  <p id="survey-name-error" className="c-harmonizer-new-survey__error" role="alert">
                    {errorName}
                  </p>
                ) : null}
              </div>

              <div className="c-harmonizer-new-survey__field">
                <label htmlFor="survey-description">Descripción</label>
                <input
                  id="survey-description"
                  type="text"
                  value={surveyDescription}
                  onChange={(e) => setSurveyDescription(e.target.value)}
                  name="surveyDescription"
                />
              </div>

              {error ? <p className="c-harmonizer-new-survey__error">{error}</p> : null}

              <div className="c-harmonizer-new-survey__actions">
                <Button
                  type="submit"
                  variant="primary"
                  icon={isEdit ? 'pictogram-edit' : 'pictogram-add'}
                  disabled={saving || !canSubmit || !surveyName.trim()}
                >
                  {submitLabel}
                </Button>
              </div>
            </fieldset>
          </form>
        </div>
      )}
    </div>
  );
}
