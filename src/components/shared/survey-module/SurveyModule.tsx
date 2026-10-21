import { Link } from 'react-router-dom';
import type {
  HarmonizerDatasetSummary,
  HarmonizerSurvey,
} from '../../../core/models/harmonizer.model';
import { MappingStatusBadge } from '../mapping-status-badge/MappingStatusBadge';
import './survey-module.css';

interface Props {
  survey: HarmonizerSurvey;
  onDelete?: (survey: HarmonizerSurvey) => void;
  deleting?: boolean;
  onDeleteDataset?: (survey: HarmonizerSurvey, dataset: HarmonizerDatasetSummary) => void;
  deletingDatasetId?: string | null;
  onDownloadOriginal?: (dataset: HarmonizerDatasetSummary) => void;
  downloadingDatasetId?: string | null;
}

export function SurveyModule({
  survey,
  onDelete,
  deleting = false,
  onDeleteDataset,
  deletingDatasetId = null,
  onDownloadOriginal,
  downloadingDatasetId = null,
}: Props) {
  const datasetLabel = survey.datasets.length === 1 ? 'edición' : 'ediciones';
  const titleId = `survey-${survey.id}-title`;

  return (
    <section className="survey-module" aria-labelledby={titleId}>
      <header className="survey-module__heading">
        <h2 id={titleId}>
          {survey.name}
          <span className="survey-module__meta">
            {' '}
            · {survey.datasets.length} {datasetLabel}
          </span>
        </h2>
        <nav className="survey-module__actions" aria-label={`Acciones de ${survey.name}`}>
          {survey.datasets.length === 0 ? (
            <span className="text-color-secondary">Vista armonizada</span>
          ) : (
            <Link to={`/harmonizer/surveys/${survey.id}/harmonized`} className="hyperlink">
              Vista armonizada
            </Link>
          )}
          <span className="survey-module__link-separator" aria-hidden="true">
            |
          </span>
          <Link to={`/harmonizer/surveys/${survey.id}/variables`} className="hyperlink">
            Variables
          </Link>
          <span className="survey-module__link-separator" aria-hidden="true">
            |
          </span>
          <Link to="/harmonizer/upload" className="hyperlink">
            Subir archivo
            <span className="pictogram-file-upload" aria-hidden="true" />
          </Link>
          <span className="survey-module__link-separator" aria-hidden="true">
            |
          </span>
          <Link to={`/harmonizer/surveys/${survey.id}/edit`} className="hyperlink">
            Editar
            <span className="pictogram-edit" aria-hidden="true" />
          </Link>
          {onDelete ? (
            <>
              <span className="survey-module__link-separator" aria-hidden="true">
                |
              </span>
              <button
                type="button"
                className="hyperlink"
                aria-label={`Eliminar encuesta ${survey.name}`}
                disabled={deleting}
                onClick={() => onDelete(survey)}
              >
                Eliminar
                <span className="pictogram-delete" aria-hidden="true" />
              </button>
            </>
          ) : null}
        </nav>
      </header>

      <div className="survey-module__content">
        {survey.description ? (
          <p className="survey-module__description">{survey.description}</p>
        ) : null}

        {survey.datasets.length > 0 ? (
          <div className="container-table">
            <table className="table-condensed">
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Año</th>
                  <th scope="col">No. filas</th>
                  <th scope="col">Mapeo</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {survey.datasets.map((dataset) => (
                  <tr key={dataset.id}>
                    <td>{dataset.name}</td>
                    <td>{dataset.year}</td>
                    <td>{dataset.rowCount}</td>
                    <td>
                      <MappingStatusBadge
                        mappedColumns={dataset.mappedColumns}
                        totalColumns={dataset.totalColumns}
                      />
                    </td>
                    <td>
                      <nav
                        className="survey-module__row-actions"
                        aria-label={`Acciones de ${dataset.name}`}
                      >
                        <Link
                          to={`/harmonizer/datasets/${dataset.id}/mapping`}
                          className="hyperlink"
                        >
                          Mapear
                        </Link>
                        <span className="survey-module__link-separator" aria-hidden="true">
                          |
                        </span>
                        <Link
                          to={`/harmonizer/datasets/${dataset.id}/harmonized`}
                          className="hyperlink"
                        >
                          Vista armonizada
                        </Link>
                        {onDownloadOriginal ? (
                          <>
                            <span className="survey-module__link-separator" aria-hidden="true">
                              |
                            </span>
                            <button
                              type="button"
                              className="hyperlink"
                              aria-label={`Descargar el CSV original de ${dataset.name}`}
                              title="Todas las columnas del archivo subido, mapeadas o no, con los datos tal como se subieron"
                              disabled={downloadingDatasetId === dataset.id}
                              onClick={() => onDownloadOriginal(dataset)}
                            >
                              {downloadingDatasetId === dataset.id
                                ? 'Descargando…'
                                : 'Descargar original'}
                            </button>
                          </>
                        ) : null}
                        {onDeleteDataset ? (
                          <>
                            <span className="survey-module__link-separator" aria-hidden="true">
                              |
                            </span>
                            <button
                              type="button"
                              className="hyperlink"
                              aria-label={`Eliminar edición ${dataset.name}`}
                              disabled={deletingDatasetId === dataset.id}
                              onClick={() => onDeleteDataset(survey, dataset)}
                            >
                              Eliminar
                            </button>
                          </>
                        ) : null}
                      </nav>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {onDownloadOriginal ? (
              <p className="survey-module__note text-color-secondary">
                «Descargar original» trae todas las columnas con los datos tal como se subieron. Si
                lo abres en Excel, revisa que no haya celdas que empiecen con =, +, - o @: Excel
                podría ejecutarlas como fórmulas.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="survey-module__empty text-color-secondary">
            Sin ediciones todavía en esta encuesta.
          </p>
        )}
      </div>
    </section>
  );
}
