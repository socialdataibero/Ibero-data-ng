import { Link } from 'react-router-dom';
import type { HarmonizerSurvey } from '../../../core/models/harmonizer.model';
import { MappingStatusBadge } from '../mapping-status-badge/MappingStatusBadge';
import './survey-module.css';

interface Props {
  survey: HarmonizerSurvey;
  onDelete?: (survey: HarmonizerSurvey) => void;
  deleting?: boolean;
}

export function SurveyModule({ survey, onDelete, deleting = false }: Props) {
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
          <Link to="/harmonizer/upload" className="hyperlink">
            Subir CSV
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
                      </nav>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
