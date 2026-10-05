import { Button } from 'sectei-library';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../shared/page-header/PageHeader';
import { Paginator } from '../../shared/paginator/Paginator';
import { SurveyModule } from '../../shared/survey-module/SurveyModule';
import { ConfirmDialog } from '../../shared/confirm-dialog/ConfirmDialog';
import { CRUMBS, useHarmonizerHome } from './useHarmonizerHome';
import { HarmonizerHomeListSkeleton } from './HarmonizerHomeSkeleton';
import './harmonizer-home.css';

export function HarmonizerHome() {
  const {
    surveys,
    total,
    page,
    totalPages,
    goTo,
    loading,
    loadError,
    pendingDelete,
    removingId,
    deleteError,
    requestRemoveSurvey,
    cancelRemoveSurvey,
    confirmRemoveSurvey,
  } = useHarmonizerHome();

  return (
    <div className="c-harmonizer-home">
      <PageHeader
        title="Armonizador de encuestas"
        intro={
          <>
            Unifica variables que cambian de nombre entre ediciones (<code>age</code> en 2020,{' '}
            <code>edad1</code> en 2021) bajo un nombre canónico común, para compararlas a lo largo
            del tiempo.
          </>
        }
        crumbs={CRUMBS}
        action={
          <div className="c-harmonizer-home__header-actions" role="group" aria-label="Acciones">
            <Button
              type="button"
              variant="secondary"
              icon="pictogram-add"
              href="/harmonizer/new-survey"
            >
              Nueva encuesta
            </Button>
            <Button
              type="button"
              variant="primary"
              icon="pictogram-file-upload"
              href="/harmonizer/upload"
            >
              Subir CSV
            </Button>
          </div>
        }
      />

      <section
        className="container width-fixed c-harmonizer-home__body"
        aria-labelledby="surveys-title"
      >
        <h2 id="surveys-title" className="c-harmonizer-home__subtitle">
          Encuestas
          {!loading && !loadError ? (
            <span className="c-harmonizer-home__count text-color-secondary" aria-live="polite">
              {' '}
              · {total}
            </span>
          ) : null}
        </h2>

        {deleteError ? (
          <p className="c-harmonizer-home__empty-text" role="alert">
            {deleteError}
          </p>
        ) : null}

        {loadError ? (
          <p className="c-harmonizer-home__empty-text" role="alert">
            {loadError}
          </p>
        ) : loading ? (
          <HarmonizerHomeListSkeleton />
        ) : surveys.length === 0 ? (
          <div className="c-harmonizer-home__empty">
            <div className="c-harmonizer-home__empty-icon" aria-hidden="true">
              <span className="pictogram-layers" />
            </div>
            <p className="c-harmonizer-home__empty-title">Todavía no hay encuestas</p>
            <p className="c-harmonizer-home__empty-text">
              Crea una encuesta o sube un CSV para empezar a armonizar variables entre ediciones.
            </p>
            <div className="c-harmonizer-home__header-actions">
              <Button type="button" variant="secondary" href="/harmonizer/new-survey">
                Nueva encuesta
              </Button>
              <Button type="button" variant="primary" href="/harmonizer/upload">
                Subir CSV
              </Button>
            </div>
          </div>
        ) : (
          <div className="c-harmonizer-home__list">
            {surveys.map((survey) => (
              <SurveyModule
                key={survey.id}
                survey={survey}
                onDelete={requestRemoveSurvey}
                deleting={removingId === survey.id}
              />
            ))}
          </div>
        )}

        <Paginator page={page} totalPages={totalPages} onChange={goTo} />

        <p className="text-color-secondary c-harmonizer-home__footnote">
          ¿Necesitas otra edición?{' '}
          <Link to="/harmonizer/upload" className="hyperlink">
            Sube un CSV
          </Link>{' '}
          o{' '}
          <Link to="/harmonizer/new-survey" className="hyperlink">
            crea una encuesta
          </Link>
          .
        </p>
      </section>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Borrar encuesta"
        message={
          pendingDelete ? (
            <>
              ¿Borrar la encuesta "{pendingDelete.name}"? Se borran también sus ediciones, mapeos y
              variables canónicas. Esto no se puede deshacer.
            </>
          ) : null
        }
        confirmLabel="Borrar"
        danger
        confirming={removingId === pendingDelete?.id}
        onConfirm={() => void confirmRemoveSurvey()}
        onCancel={cancelRemoveSurvey}
      />
    </div>
  );
}
