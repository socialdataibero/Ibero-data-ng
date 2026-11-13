import { useEffect, useRef } from 'react';
import { Button } from 'sectei-library';
import {
  ANALYSIS_UNIT_LABEL,
  SOURCE_DESIGN_LABEL,
  UPLOAD_ENCODING_LABEL,
  type AnalysisUnit,
  type HarmonizerImportPhase,
  type SourceDesign,
  type UploadEncoding,
} from '../../../core/models/harmonizer.model';
import { PageHeader } from '../../shared/page-header/PageHeader';
import { CRUMBS, useHarmonizerUpload } from './useHarmonizerUpload';
import './harmonizer-upload.css';

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

function formatBytes(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toLocaleString('es-MX', { maximumFractionDigits: unit === 0 ? 0 : 1 })} ${BYTE_UNITS[unit]}`;
}

const PHASE_TEXT: Record<HarmonizerImportPhase, string> = {
  checking: 'Revisando que el archivo esté en UTF-8…',
  reading: 'Leyendo las filas…',
  saving: 'Guardando la edición…',
};

export function HarmonizerUpload() {
  const {
    surveys,
    organizations,
    organizationId,
    setOrganizationId,
    accessLoading,
    accessError,
    datasetName,
    setDatasetName,
    datasetYear,
    setDatasetYear,
    uploadSurveyId,
    setUploadSurveyId,
    newSurveyName,
    setNewSurveyName,
    onFileSelected,
    isDbf,
    encoding,
    setEncoding,
    design,
    setDesign,
    unit,
    setUnit,
    uploading,
    stage,
    progress,
    processing,
    cancelUpload,
    error,
    fieldErrors,
    canUpload,
    submit,
    newOption,
  } = useHarmonizerUpload();

  // The progress panel is below the form: bring it into view when the upload starts and
  // again when the server starts processing.
  const progressRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (stage !== 'idle') progressRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [stage]);

  return (
    <div className="c-harmonizer-upload">
      <PageHeader
        title="Subir archivo"
        intro="Sube una edición (CSV o DBF) a una encuesta existente o crea una encuesta nueva al mismo tiempo."
        crumbs={CRUMBS}
        action={
          <Button type="button" variant="secondary" icon="pictogram-arrow-left" href="/harmonizer">
            Encuestas
          </Button>
        }
      />

      <div className="container width-fixed c-harmonizer-upload__body">
        {accessLoading ? <p role="status">Cargando organizaciones…</p> : null}
        {accessError ? <p className="c-harmonizer-upload__error" role="alert">{accessError}</p> : null}
        <form className="c-harmonizer-upload__form" onSubmit={submit} noValidate>
          <fieldset className="c-harmonizer-upload__section" disabled={uploading || accessLoading || !!accessError}>
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
                aria-required="true"
                aria-invalid={!!fieldErrors.datasetName}
                aria-describedby={
                  fieldErrors.datasetName
                    ? 'dataset-name-help dataset-name-error'
                    : 'dataset-name-help'
                }
              />
              <p id="dataset-name-help" className="form-help">
                Debe ser único dentro de la encuesta, por ejemplo «Censo 2020 – Personas». Es el
                nombre que identifica a la edición en la vista armonizada.
              </p>
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
                aria-required="true"
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
                <label htmlFor="upload-organization">Organización *</label>
                <select
                  id="upload-organization"
                  name="organizationId"
                  value={organizationId}
                  onChange={(event) => setOrganizationId(event.target.value)}
                  required
                  disabled={organizations.length === 0}
                  aria-describedby={organizations.length === 0 ? 'upload-organization-help' : undefined}
                >
                  <option value="">Selecciona una organización</option>
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>{organization.name}</option>
                  ))}
                </select>
                {!accessLoading && !accessError && organizations.length === 0 ? (
                  <p id="upload-organization-help" role="status">
                    Necesitas el rol Administrador o Editor en una organización para crear encuestas.
                  </p>
                ) : null}
              </div>
            ) : null}

            {uploadSurveyId === newOption ? (
              <div className="c-harmonizer-upload__field">
                <label htmlFor="new-survey">Nombre de la nueva encuesta *</label>
                <input
                  id="new-survey"
                  type="text"
                  value={newSurveyName}
                  onChange={(e) => setNewSurveyName(e.target.value)}
                  name="newSurveyName"
                  aria-required="true"
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
              <label htmlFor="dataset-file">Archivo CSV o DBF *</label>
              <input
                id="dataset-file"
                type="file"
                accept=".csv,text/csv,.gz,.dbf"
                onChange={onFileSelected}
                aria-required="true"
                aria-invalid={!!fieldErrors.file}
                aria-describedby={fieldErrors.file ? 'dataset-file-error' : undefined}
              />
              <p className="form-help">
                CSV en UTF-8, también comprimido con gzip (.csv.gz), o tabla DBF. Se guarda todo
                como texto, sin inferir tipos; las celdas vacías quedan como cadena vacía.
              </p>
              {fieldErrors.file ? (
                <p id="dataset-file-error" className="c-harmonizer-upload__error" role="alert">
                  {fieldErrors.file}
                </p>
              ) : null}
            </div>

            {isDbf ? (
              <div className="c-harmonizer-upload__field">
                <label htmlFor="dataset-encoding">Codificación del DBF</label>
                <select
                  id="dataset-encoding"
                  value={encoding}
                  onChange={(e) => setEncoding(e.target.value as UploadEncoding)}
                  name="encoding"
                  aria-describedby="dataset-encoding-help"
                >
                  {(Object.keys(UPLOAD_ENCODING_LABEL) as UploadEncoding[]).map((value) => (
                    <option key={value} value={value}>
                      {UPLOAD_ENCODING_LABEL[value]}
                    </option>
                  ))}
                </select>
                <p id="dataset-encoding-help" className="form-help">
                  Define cómo se leen los acentos y la ñ. «Detectar automáticamente» usa la que
                  indica el archivo o, si no la indica, la deduce del texto. Si después ves letras
                  raras (por ejemplo «Ca¤itas» o «CaÃ±itas»), elimina la edición y súbela de nuevo
                  eligiendo otra.
                </p>
              </div>
            ) : null}

            <div className="c-harmonizer-upload__field">
              <label htmlFor="dataset-design">Diseño de la fuente *</label>
              <select
                id="dataset-design"
                value={design}
                onChange={(e) => setDesign(e.target.value as SourceDesign | '')}
                name="design"
                aria-required="true"
                aria-invalid={!!fieldErrors.design}
                aria-describedby={
                  fieldErrors.design ? 'dataset-design-help dataset-design-error' : 'dataset-design-help'
                }
              >
                <option value="">Selecciona el diseño</option>
                {(Object.keys(SOURCE_DESIGN_LABEL) as SourceDesign[]).map((value) => (
                  <option key={value} value={value}>
                    {SOURCE_DESIGN_LABEL[value]}
                  </option>
                ))}
              </select>
              <p id="dataset-design-help" className="form-help">
                «Censal» si se enumeró a toda la población (como el Censo de Población). «Muestral» si
                cada registro representa a varias unidades (como la ENOE o la ENIGH): en el mapeo
                tendrás que marcar la columna del factor de expansión.
              </p>
              {fieldErrors.design ? (
                <p id="dataset-design-error" className="c-harmonizer-upload__error" role="alert">
                  {fieldErrors.design}
                </p>
              ) : null}
            </div>

            <div className="c-harmonizer-upload__field">
              <label htmlFor="dataset-unit">Unidad de análisis *</label>
              <select
                id="dataset-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value as AnalysisUnit | '')}
                name="unit"
                aria-required="true"
                aria-invalid={!!fieldErrors.unit}
                aria-describedby={
                  fieldErrors.unit ? 'dataset-unit-help dataset-unit-error' : 'dataset-unit-help'
                }
              >
                <option value="">Selecciona la unidad</option>
                {(Object.keys(ANALYSIS_UNIT_LABEL) as AnalysisUnit[]).map((value) => (
                  <option key={value} value={value}>
                    {ANALYSIS_UNIT_LABEL[value]}
                  </option>
                ))}
              </select>
              <p id="dataset-unit-help" className="form-help">
                Qué representa cada registro del archivo: una persona, una vivienda o un hogar.
              </p>
              {fieldErrors.unit ? (
                <p id="dataset-unit-error" className="c-harmonizer-upload__error" role="alert">
                  {fieldErrors.unit}
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
                {stage === 'processing' ? 'Procesando…' : uploading ? 'Subiendo…' : 'Subir y mapear'}
              </Button>
            </div>
          </fieldset>

          {stage === 'uploading' ? (
            <div className="c-harmonizer-upload__progress" role="status" ref={progressRef}>
              <label htmlFor="upload-progress">
                Subiendo {formatBytes(progress.sent)} de {formatBytes(progress.total)}
                {progress.total > 0 ? ` (${Math.floor((progress.sent / progress.total) * 100)} %)` : ''}
              </label>
              <progress id="upload-progress" max={progress.total || 1} value={progress.sent} />
              <p className="form-help">
                Si se corta la conexión, la subida se reintenta sola. No cierres esta página hasta
                que termine.
              </p>
              <Button type="button" variant="secondary" onClick={cancelUpload}>
                Cancelar subida
              </Button>
            </div>
          ) : null}

          {stage === 'processing' ? (
            <div className="c-harmonizer-upload__progress" role="status" ref={progressRef}>
              <p>
                Archivo recibido. {processing.phase ? PHASE_TEXT[processing.phase] : 'En espera de procesarse…'}
                {processing.phase === 'reading' && processing.rowsRead > 0
                  ? ` ${processing.rowsRead.toLocaleString('es-MX')} filas leídas.`
                  : ''}
              </p>
              <progress aria-label="Procesando el archivo" />
              <p className="form-help">
                Un archivo grande puede tardar varios minutos. Si sales de esta página, el proceso
                sigue en el servidor y la edición aparecerá en la lista de encuestas cuando termine.
              </p>
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}
