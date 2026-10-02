import { Button } from 'sectei-library';
import { PageHeader } from '../../shared/page-header/PageHeader';
import { CRUMBS, useHarmonizerUpload } from './useHarmonizerUpload';
import './harmonizer-upload.css';

export function HarmonizerUpload() {
  const {
    surveys,
    datasetName,
    setDatasetName,
    datasetYear,
    setDatasetYear,
    uploadSurveyId,
    setUploadSurveyId,
    newSurveyName,
    setNewSurveyName,
    onFileSelected,
    uploading,
    error,
    fieldErrors,
    canUpload,
    submit,
    newOption,
  } = useHarmonizerUpload();

  return (
    <div className="c-harmonizer-upload">
      <PageHeader
        title="Subir CSV"
        intro="Sube una edición (CSV) a una encuesta existente o crea una encuesta nueva al mismo tiempo."
        crumbs={CRUMBS}
        action={
          <Button type="button" variant="secondary" icon="pictogram-arrow-left" href="/harmonizer">
            Encuestas
          </Button>
        }
      />

      <div className="container width-fixed c-harmonizer-upload__body">
        <form className="c-harmonizer-upload__form" onSubmit={submit} noValidate>
          <fieldset className="c-harmonizer-upload__section">
            <legend className="c-harmonizer-upload__legend">Edición a subir</legend>

            <div className="c-harmonizer-upload__field">
              <label htmlFor="dataset-name">Nombre de la edición *</label>
              <input
                id="dataset-name"
                type="text"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                name="datasetName"
                placeholder="Ej: ENIGH 2024"
                required
                aria-invalid={!!fieldErrors.datasetName}
                aria-describedby={fieldErrors.datasetName ? 'dataset-name-error' : undefined}
              />
              {fieldErrors.datasetName ? (
                <p id="dataset-name-error" className="c-harmonizer-upload__error" role="alert">
                  {fieldErrors.datasetName}
                </p>
              ) : null}
            </div>

            <div className="c-harmonizer-upload__field">
              <label htmlFor="dataset-year">Año *</label>
              <input
                id="dataset-year"
                type="number"
                min={1900}
                max={2100}
                value={datasetYear}
                onChange={(e) =>
                  setDatasetYear(e.target.value === '' ? '' : Number(e.target.value))
                }
                name="datasetYear"
                required
                aria-invalid={!!fieldErrors.datasetYear}
                aria-describedby={fieldErrors.datasetYear ? 'dataset-year-error' : undefined}
              />
              {fieldErrors.datasetYear ? (
                <p id="dataset-year-error" className="c-harmonizer-upload__error" role="alert">
                  {fieldErrors.datasetYear}
                </p>
              ) : null}
            </div>

            <div className="c-harmonizer-upload__field">
              <label htmlFor="dataset-survey">Encuesta *</label>
              <select
                id="dataset-survey"
                value={uploadSurveyId}
                onChange={(e) => setUploadSurveyId(e.target.value)}
                name="uploadSurveyId"
              >
                <option value={newOption}>Crear nueva encuesta…</option>
                {surveys.map((survey) => (
                  <option key={survey.id} value={survey.id}>
                    {survey.name}
                  </option>
                ))}
              </select>
            </div>

            {uploadSurveyId === newOption ? (
              <div className="c-harmonizer-upload__field">
                <label htmlFor="new-survey">Nombre de la nueva encuesta *</label>
                <input
                  id="new-survey"
                  type="text"
                  value={newSurveyName}
                  onChange={(e) => setNewSurveyName(e.target.value)}
                  name="newSurveyName"
                  required
                  aria-invalid={!!fieldErrors.newSurveyName}
                  aria-describedby={fieldErrors.newSurveyName ? 'new-survey-error' : undefined}
                />
                {fieldErrors.newSurveyName ? (
                  <p id="new-survey-error" className="c-harmonizer-upload__error" role="alert">
                    {fieldErrors.newSurveyName}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="c-harmonizer-upload__field">
              <label htmlFor="dataset-file">Archivo CSV *</label>
              <input
                id="dataset-file"
                type="file"
                accept=".csv,text/csv"
                onChange={onFileSelected}
                required
                aria-invalid={!!fieldErrors.file}
                aria-describedby={fieldErrors.file ? 'dataset-file-error' : undefined}
              />
              <p className="form-help">
                Se guarda todo como texto, sin inferir tipos; las celdas vacías quedan como cadena
                vacía.
              </p>
              {fieldErrors.file ? (
                <p id="dataset-file-error" className="c-harmonizer-upload__error" role="alert">
                  {fieldErrors.file}
                </p>
              ) : null}
            </div>

            {error ? <p className="c-harmonizer-upload__error">{error}</p> : null}

            <div className="c-harmonizer-upload__actions">
              <Button
                type="submit"
                variant="primary"
                icon="pictogram-file-upload"
                disabled={uploading || !canUpload}
              >
                {uploading ? 'Subiendo…' : 'Subir y mapear'}
              </Button>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
