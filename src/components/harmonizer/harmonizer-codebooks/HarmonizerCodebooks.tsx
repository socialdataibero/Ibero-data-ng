import { Button } from 'sectei-library';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../shared/page-header/PageHeader';
import { ConfirmDialog } from '../../shared/confirm-dialog/ConfirmDialog';
import { HarmonizerCodebooksSkeleton } from './HarmonizerCodebooksSkeleton';
import { useHarmonizerCodebooks } from './useHarmonizerCodebooks';
import {
  VALUE_TYPE_LABEL,
  type CodebookCategory,
} from '../../../core/models/harmonizer.model';
import './harmonizer-codebooks.css';

const KIND_LABEL: Record<CodebookCategory['kind'], string> = {
  value: '',
  missing: 'no especificado',
  blank: 'blanco por pase',
  range: 'rango',
  catalog: 'catálogo externo',
};

function CategoryList({ categories }: { categories: CodebookCategory[] }) {
  if (categories.length === 0) return <span className="text-color-secondary">—</span>;
  return (
    <ul className="c-harmonizer-codebooks__categories">
      {categories.map((c, i) => (
        <li key={`${c.code}-${i}`}>
          {c.code ? <code>{c.code}</code> : null} {c.label}
          {KIND_LABEL[c.kind] ? <span className="text-color-secondary"> ({KIND_LABEL[c.kind]})</span> : null}
        </li>
      ))}
    </ul>
  );
}

export function HarmonizerCodebooks() {
  const {
    surveyId,
    data,
    loading,
    loadError,
    crumbs,
    name,
    setName,
    chooseFile,
    fileInputKey,
    fieldErrors,
    uploading,
    uploadError,
    uploaded,
    submit,
    openId,
    detail,
    detailError,
    toggleDetail,
    pendingDelete,
    requestRemove,
    cancelRemove,
    confirmRemove,
    removingId,
    deleteError,
    downloadTemplate,
  } = useHarmonizerCodebooks();

  if (loading) return <HarmonizerCodebooksSkeleton />;

  return (
    <div className="c-harmonizer-codebooks">
      <PageHeader
        title="Diccionarios de variables"
        intro={
          data ? (
            <>
              Diccionarios de la encuesta «{data.survey.name}». Un diccionario describe cada columna
              de un archivo y el significado de sus códigos; se sube una vez y sirve para todas las
              ediciones que tengan esas columnas.
            </>
          ) : undefined
        }
        crumbs={crumbs}
        action={
          <Button type="button" variant="secondary" icon="pictogram-arrow-left" href="/harmonizer">
            Encuestas
          </Button>
        }
      />

      <div className="container width-fixed c-harmonizer-codebooks__body">
        {loadError ? (
          <p className="c-harmonizer-codebooks__error" role="alert">
            {loadError}
          </p>
        ) : data ? (
          <>
            <section className="c-harmonizer-codebooks__panel" aria-labelledby="codebook-upload-title">
              <h2 id="codebook-upload-title" className="c-harmonizer-codebooks__title">
                Subir un diccionario
              </h2>
              <p className="text-color-secondary">
                Acepta el <strong>descriptor del INEGI</strong> tal como se descarga (.xls o .xlsx, una
                hoja por tabla: VIVIENDAS, PERSONAS…) o la <strong>plantilla CSV</strong> de la
                plataforma, para otras encuestas o para descriptores que solo existen en PDF. Después,
                en el mapeo de cada edición elige el diccionario que le corresponde.
              </p>
              <form className="c-harmonizer-codebooks__form" onSubmit={submit} noValidate>
                <div className="c-harmonizer-codebooks__field">
                  <label htmlFor="codebook-name">Nombre</label>
                  <input
                    id="codebook-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ej. Censo 2010"
                    aria-required="true"
                    aria-invalid={!!fieldErrors.name}
                    aria-describedby={fieldErrors.name ? 'codebook-name-error' : undefined}
                  />
                  {fieldErrors.name ? (
                    <p id="codebook-name-error" className="c-harmonizer-codebooks__error" role="alert">
                      {fieldErrors.name}
                    </p>
                  ) : null}
                </div>
                <div className="c-harmonizer-codebooks__field">
                  <label htmlFor="codebook-file">Archivo (.xls, .xlsx o .csv)</label>
                  <input
                    key={fileInputKey}
                    id="codebook-file"
                    type="file"
                    accept=".xls,.xlsx,.csv"
                    onChange={(e) => chooseFile(e.target.files?.[0] ?? null)}
                    aria-required="true"
                    aria-invalid={!!fieldErrors.file}
                    aria-describedby={fieldErrors.file ? 'codebook-file-error' : 'codebook-file-help'}
                  />
                  {fieldErrors.file ? (
                    <p id="codebook-file-error" className="c-harmonizer-codebooks__error" role="alert">
                      {fieldErrors.file}
                    </p>
                  ) : (
                    <p id="codebook-file-help" className="form-help">
                      Máximo 20 MB. El CSV debe estar en UTF-8.
                    </p>
                  )}
                </div>
                <div className="c-harmonizer-codebooks__form-actions">
                  <Button type="submit" variant="primary" disabled={uploading}>
                    {uploading ? 'Subiendo…' : 'Subir diccionario'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    icon="pictogram-file-download"
                    onClick={downloadTemplate}
                  >
                    Plantilla CSV
                  </Button>
                </div>
              </form>
              <p className="form-help">
                Plantilla: una fila por variable o por categoría. La primera fila de cada variable lleva
                su descripción y su <code>tipo</code> (texto, entero o decimal); cada fila con{' '}
                <code>codigo</code> y <code>etiqueta</code> agrega una categoría, y{' '}
                <code>faltante = sí</code> la marca como «No especificado». <code>tabla</code> es
                opcional y separa archivos distintos (viviendas, personas).
              </p>
              {uploadError ? (
                <p className="c-harmonizer-codebooks__error" role="alert">
                  {uploadError}
                </p>
              ) : null}
              {uploaded ? (
                <p className="c-harmonizer-codebooks__success" role="status">
                  Se subió «{uploaded.name}»:{' '}
                  {uploaded.tables
                    .map((t) => `${t.name ? `${t.name}, ` : ''}${t.variableCount} variables`)
                    .join(' · ')}
                  .
                </p>
              ) : null}
            </section>

            {deleteError ? (
              <p className="c-harmonizer-codebooks__error" role="alert">
                {deleteError}
              </p>
            ) : null}

            {data.items.length === 0 ? (
              <p className="text-color-secondary">Esta encuesta todavía no tiene diccionarios.</p>
            ) : (
              <div className="container-table">
                <table className="table-condensed c-harmonizer-codebooks__table">
                  <thead>
                    <tr>
                      <th scope="col">Nombre</th>
                      <th scope="col">Tablas</th>
                      <th scope="col">Ediciones que lo usan</th>
                      <th scope="col">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((codebook) => (
                      <tr key={codebook.id}>
                        <td>
                          <strong>{codebook.name}</strong>
                          <div className="text-color-secondary c-harmonizer-codebooks__meta">
                            {codebook.fileName} ·{' '}
                            {codebook.format === 'inegi' ? 'descriptor del INEGI' : 'plantilla CSV'}
                          </div>
                        </td>
                        <td>
                          <ul className="c-harmonizer-codebooks__list">
                            {codebook.tables.map((t) => (
                              <li key={t.name}>
                                {t.name || 'sin tabla'}: {t.variableCount} variables
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td>
                          {codebook.datasets.length === 0 ? (
                            <span className="text-color-secondary">Ninguna</span>
                          ) : (
                            <ul className="c-harmonizer-codebooks__list">
                              {codebook.datasets.map((d) => (
                                <li key={d.id}>
                                  <Link to={`/harmonizer/datasets/${d.id}/mapping`} className="hyperlink">
                                    {d.name}
                                  </Link>{' '}
                                  <span className="text-color-secondary">
                                    ({d.year}
                                    {d.table ? `, tabla ${d.table}` : ''})
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                        <td>
                          <nav className="c-harmonizer-codebooks__actions" aria-label={`Acciones de ${codebook.name}`}>
                            <button
                              type="button"
                              className="hyperlink"
                              aria-expanded={openId === codebook.id}
                              aria-controls={`codebook-detail-${codebook.id}`}
                              onClick={() => toggleDetail(codebook)}
                            >
                              {openId === codebook.id ? 'Ocultar' : 'Ver variables'}
                            </button>
                            <span className="c-harmonizer-codebooks__separator" aria-hidden="true">
                              |
                            </span>
                            <button
                              type="button"
                              className="hyperlink"
                              aria-label={`Eliminar diccionario ${codebook.name}`}
                              disabled={removingId === codebook.id}
                              onClick={() => requestRemove(codebook)}
                            >
                              Eliminar
                            </button>
                          </nav>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {openId ? (
              <section
                id={`codebook-detail-${openId}`}
                className="c-harmonizer-codebooks__panel"
                aria-labelledby="codebook-detail-title"
              >
                <h2 id="codebook-detail-title" className="c-harmonizer-codebooks__title">
                  {detail ? `Variables de «${detail.name}»` : 'Variables'}
                </h2>
                {detailError ? (
                  <p className="c-harmonizer-codebooks__error" role="alert">
                    {detailError}
                  </p>
                ) : !detail ? (
                  <p className="text-color-secondary" aria-live="polite">
                    Cargando…
                  </p>
                ) : (
                  detail.tables.map((table) => (
                    <div key={table.name}>
                      <h3 className="c-harmonizer-codebooks__subtitle">
                        {table.name || 'Sin tabla'} · {table.variableCount} variables
                      </h3>
                      <div className="container-table">
                        <table className="table-condensed c-harmonizer-codebooks__table">
                          <thead>
                            <tr>
                              <th scope="col">Variable</th>
                              <th scope="col">Descripción</th>
                              <th scope="col">Tipo</th>
                              <th scope="col">Categorías</th>
                            </tr>
                          </thead>
                          <tbody>
                            {table.variables.map((v) => (
                              <tr key={v.name}>
                                <td>
                                  <code>{v.name}</code>
                                </td>
                                <td>
                                  {v.label ?? '—'}
                                  {v.question ? (
                                    <div className="text-color-secondary c-harmonizer-codebooks__meta">
                                      {v.question}
                                    </div>
                                  ) : null}
                                  {v.section ? (
                                    <div className="text-color-secondary c-harmonizer-codebooks__meta">
                                      Sección: {v.section}
                                    </div>
                                  ) : null}
                                </td>
                                <td>
                                  {v.declaredType ? VALUE_TYPE_LABEL[v.declaredType] : '—'}
                                  {v.validRange ? (
                                    <div className="text-color-secondary c-harmonizer-codebooks__meta">
                                      {v.validRange}
                                    </div>
                                  ) : null}
                                </td>
                                <td>
                                  <CategoryList categories={v.categories} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </section>
            ) : null}

            <p className="text-color-secondary c-harmonizer-codebooks__note">
              Borrar un diccionario deja sin diccionario a las ediciones que lo usan; sus mapeos y
              recodificaciones no cambian. Ver también las{' '}
              <Link to={`/harmonizer/surveys/${surveyId}/variables`} className="hyperlink">
                variables de la encuesta
              </Link>
              .
            </p>
          </>
        ) : null}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Borrar diccionario"
        message={
          pendingDelete ? (
            <>
              ¿Borrar el diccionario «{pendingDelete.name}»?
              {pendingDelete.datasets.length > 0
                ? ` ${pendingDelete.datasets.length === 1 ? 'Una edición lo usa y quedará' : `${pendingDelete.datasets.length} ediciones lo usan y quedarán`} sin diccionario.`
                : ''}{' '}
              Esto no se puede deshacer.
            </>
          ) : null
        }
        confirmLabel="Borrar"
        danger
        confirming={removingId === pendingDelete?.id}
        onConfirm={() => void confirmRemove()}
        onCancel={cancelRemove}
      />
    </div>
  );
}
