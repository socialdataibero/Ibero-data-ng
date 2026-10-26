import { Link } from 'react-router-dom';
import { Button } from 'sectei-library';
import { PageHeader } from '../../shared/page-header/PageHeader';
import { StatusBadge } from '../../shared/status-badge/StatusBadge';
import { HarmonizerVariableSkeleton } from './HarmonizerVariableSkeleton';
import { useHarmonizerVariable } from './useHarmonizerVariable';
import type { ComparisonIssue, ComparisonStatus } from '../../../core/models/harmonizer.model';
import './harmonizer-variable.css';

const formatCount = (n: number) => n.toLocaleString('es-MX');

function editionList(issue: ComparisonIssue, withLabel: boolean): string {
  return issue.editions
    .map((e) => {
      const codes = e.codes.map((c) => `«${c}»`).join(' y ');
      const label = withLabel && e.label ? ` = ${e.label}` : '';
      return `${e.datasetName} (${e.year}): ${codes}${label}`;
    })
    .join('; ');
}

/** Cada diferencia en una frase: qué pasa y en qué ediciones. */
function issueText(issue: ComparisonIssue): string {
  switch (issue.kind) {
    case 'label_conflict':
      return `El código ${issue.subject} significa cosas distintas según la edición. ${editionList(issue, true)}.`;
    case 'code_conflict':
      return `«${issue.subject}» tiene códigos distintos según la edición. ${editionList(issue, false)}.`;
    case 'format':
      return `El mismo código se escribe distinto (por ejemplo, con ceros a la izquierda): ${issue.subject}. ${editionList(issue, false)}. Como texto, contar o filtrar por un valor separa las ediciones.`;
    case 'only_in_some':
      return `El código ${issue.subject} solo aparece en ${issue.editions
        .map((e) => `${e.datasetName} (${e.year})${e.label ? ` como «${e.label}»` : ''}`)
        .join(', ')}. Puede ser correcto (una categoría nueva o que nadie eligió ese año).`;
    case 'not_in_catalog':
      return `El valor ${issue.subject} de ${issue.editions
        .map((e) => `${e.datasetName} (${e.year})`)
        .join(', ')} no se recodificó a ninguna categoría del catálogo.`;
  }
}

const STATUS_TEXT: Record<ComparisonStatus, string> = {
  single: 'Solo una edición usa esta variable: no hay con qué comparar.',
  ok: 'Los códigos coinciden entre las ediciones.',
  warning: 'Hay diferencias de códigos entre ediciones sin revisar.',
  reviewed: 'Las diferencias se revisaron y se marcaron como correctas.',
};

export function HarmonizerVariable() {
  const {
    surveyId,
    data,
    loading,
    loadError,
    crumbs,
    comparisonRows,
    catalog,
    maps,
    dirty,
    saving,
    saveError,
    notice,
    reviewing,
    reviewError,
    applySuggestion,
    addCategory,
    updateCategory,
    removeCategory,
    setTarget,
    save,
    clearRecoding,
    discard,
    review,
    valueTypeLabel,
  } = useHarmonizerVariable();

  if (loading) return <HarmonizerVariableSkeleton />;

  const catalogCodes = catalog.map((c) => c.code.trim()).filter((c) => c !== '');

  return (
    <div className="c-harmonizer-variable">
      <PageHeader
        title={data ? `Variable ${data.variable.name}` : 'Variable'}
        intro={
          data
            ? `${data.variable.description ?? 'Sin descripción'} · Tipo: ${
                data.variable.dataType ? valueTypeLabel[data.variable.dataType] : 'sin confirmar'
              }`
            : undefined
        }
        crumbs={crumbs}
        action={
          <Button
            type="button"
            variant="secondary"
            icon="pictogram-arrow-left"
            href={`/harmonizer/surveys/${surveyId}/variables`}
          >
            Variables
          </Button>
        }
      />

      <div className="container width-fixed c-harmonizer-variable__body">
        {loadError ? (
          <p className="c-harmonizer-variable__error" role="alert">
            {loadError}
          </p>
        ) : data ? (
          <>
            <section className="c-harmonizer-variable__panel" aria-labelledby="variable-status-title">
              <h2 id="variable-status-title" className="c-harmonizer-variable__title">
                Códigos entre ediciones
              </h2>
              <p>
                <StatusBadge
                  variant={data.status === 'warning' ? 'warning' : data.status === 'single' ? 'neutral' : 'success'}
                >
                  {data.status === 'warning'
                    ? `Revisar: ${data.issues.length} ${data.issues.length === 1 ? 'diferencia' : 'diferencias'}`
                    : data.status === 'reviewed'
                      ? 'Revisada'
                      : data.status === 'ok'
                        ? 'Coinciden'
                        : 'Una sola edición'}
                </StatusBadge>{' '}
                {STATUS_TEXT[data.status]}
              </p>
              {data.status === 'reviewed' && data.variable.reviewedAt ? (
                <p className="text-color-secondary">
                  Revisada por {data.variable.reviewedBy ?? 'alguien'} el{' '}
                  {new Date(data.variable.reviewedAt).toLocaleString('es-MX')}. Si cambian las
                  diferencias (otro mapeo, otros códigos de «No especificado» u otra recodificación), el
                  aviso vuelve.
                </p>
              ) : null}

              {data.issues.length > 0 ? (
                <ul className="c-harmonizer-variable__issues">
                  {data.issues.map((issue, i) => (
                    <li key={`${issue.kind}-${issue.subject}-${i}`}>{issueText(issue)}</li>
                  ))}
                </ul>
              ) : null}

              {data.status === 'warning' || data.status === 'reviewed' ? (
                <div className="c-harmonizer-variable__actions">
                  {data.status === 'warning' ? (
                    <Button type="button" variant="secondary" onClick={() => review(true)} disabled={reviewing}>
                      {reviewing ? 'Guardando…' : 'Revisada, es correcto'}
                    </Button>
                  ) : (
                    <Button type="button" variant="secondary" onClick={() => review(false)} disabled={reviewing}>
                      {reviewing ? 'Guardando…' : 'Quitar revisión'}
                    </Button>
                  )}
                  <span className="text-color-secondary">
                    Marca la variable como revisada cuando las diferencias sean correctas, por ejemplo
                    una categoría que solo existe en un año. Si un código cambió de significado,
                    recodifícalo abajo.
                  </span>
                </div>
              ) : null}
              {reviewError ? (
                <p className="c-harmonizer-variable__error" role="alert">
                  {reviewError}
                </p>
              ) : null}
            </section>

            <section className="c-harmonizer-variable__panel" aria-labelledby="variable-values-title">
              <h2 id="variable-values-title" className="c-harmonizer-variable__title">
                Valores por edición
              </h2>
              <p className="text-color-secondary">
                Cada fila es un código como sale en la vista armonizada (ya recodificado). Las
                etiquetas vienen del diccionario de cada edición o del catálogo. Los códigos se alinean
                sin ceros a la izquierda: <code>1</code> y <code>01</code> quedan en la misma fila.
                {data.categorical
                  ? ''
                  : ' Esta variable tiene muchos valores distintos: no se trata como categórica.'}
              </p>
              <div className="container-table">
                <table className="table-condensed c-harmonizer-variable__table">
                  <thead>
                    <tr>
                      <th scope="col">Código</th>
                      {data.editions.map((e) => (
                        <th key={e.datasetId} scope="col">
                          <Link to={`/harmonizer/datasets/${e.datasetId}/mapping`} className="hyperlink">
                            {e.datasetName}
                          </Link>{' '}
                          <span className="text-color-secondary">
                            ({e.year}, columna <code>{e.column}</code>)
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => (
                      <tr key={row.key}>
                        <th scope="row">
                          <code>{row.key}</code>
                        </th>
                        {row.cells.map((values, i) => (
                          <td key={data.editions[i].datasetId}>
                            {values.length === 0 ? (
                              <span className="text-color-secondary">—</span>
                            ) : (
                              values.map((v) => (
                                <div key={v.value} className="c-harmonizer-variable__cell">
                                  <code>{v.code}</code>
                                  {v.label ? <span> {v.label}</span> : null}{' '}
                                  <span className="text-color-secondary">({formatCount(v.count)})</span>
                                  {v.recoded && v.value !== v.code ? (
                                    <span className="text-color-secondary">
                                      {' '}
                                      · en el archivo <code>{v.value}</code>
                                    </span>
                                  ) : null}
                                </div>
                              ))
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="c-harmonizer-variable__missing-row">
                      <th scope="row">No especificado</th>
                      {data.editions.map((e) => {
                        const missing = e.values.filter((v) => v.missing);
                        return (
                          <td key={e.datasetId}>
                            {missing.map((v) => (
                              <div key={v.value} className="c-harmonizer-variable__cell">
                                <code>{v.value}</code>
                                {v.label ? <span> {v.label}</span> : null}{' '}
                                <span className="text-color-secondary">({formatCount(v.count)})</span>
                              </div>
                            ))}
                            {e.empty > 0 ? (
                              <div className="c-harmonizer-variable__cell text-color-secondary">
                                vacías ({formatCount(e.empty)})
                              </div>
                            ) : null}
                            {missing.length === 0 && e.empty === 0 ? (
                              <span className="text-color-secondary">—</span>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
              {data.editions.some((e) => e.distinctCapped) ? (
                <p className="form-help">
                  Alguna edición tiene más de 200 valores distintos: solo se muestran los 200 más
                  frecuentes.
                </p>
              ) : null}
            </section>

            <section className="c-harmonizer-variable__panel" aria-labelledby="variable-recode-title">
              <h2 id="variable-recode-title" className="c-harmonizer-variable__title">
                Recodificar a códigos comunes
              </h2>
              <p className="text-color-secondary">
                Define el catálogo de categorías de la variable (el código común y su etiqueta) y elige
                a qué código va cada valor de cada edición. La vista armonizada y las descargas aplican
                la recodificación después de los códigos de «No especificado» y antes del tipo. Los
                valores «sin recodificar» quedan como están en el archivo.
              </p>
              <div className="c-harmonizer-variable__actions">
                <Button type="button" variant="secondary" size="small" onClick={applySuggestion}>
                  Usar la propuesta
                </Button>
                <span className="text-color-secondary">
                  Toma las categorías del diccionario más reciente y empareja los valores de las demás
                  ediciones por su etiqueta.
                </span>
              </div>

              <h3 className="c-harmonizer-variable__subtitle">Catálogo</h3>
              {catalog.length === 0 ? (
                <p className="text-color-secondary">
                  Sin catálogo. Puedes recodificar escribiendo el código común de cada valor, o agregar
                  categorías para elegirlas de una lista.
                </p>
              ) : (
                <div className="container-table">
                  <table className="table-condensed c-harmonizer-variable__catalog">
                    <thead>
                      <tr>
                        <th scope="col">Código</th>
                        <th scope="col">Etiqueta</th>
                        <th scope="col">
                          <span className="a11y-sr-only">Acciones</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {catalog.map((category, index) => (
                        <tr key={index}>
                          <td>
                            <label className="a11y-sr-only" htmlFor={`catalog-code-${index}`}>
                              Código de la categoría {index + 1}
                            </label>
                            <input
                              id={`catalog-code-${index}`}
                              type="text"
                              value={category.code}
                              onChange={(e) => updateCategory(index, 'code', e.target.value)}
                            />
                          </td>
                          <td>
                            <label className="a11y-sr-only" htmlFor={`catalog-label-${index}`}>
                              Etiqueta de la categoría {index + 1}
                            </label>
                            <input
                              id={`catalog-label-${index}`}
                              type="text"
                              value={category.label}
                              onChange={(e) => updateCategory(index, 'label', e.target.value)}
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="hyperlink"
                              onClick={() => removeCategory(index)}
                              aria-label={`Quitar la categoría ${category.code || index + 1}`}
                            >
                              Quitar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="c-harmonizer-variable__actions">
                <Button type="button" variant="secondary" size="small" onClick={addCategory}>
                  Agregar categoría
                </Button>
              </div>

              {data.editions.map((edition) => {
                const values = edition.values.filter((v) => !v.missing);
                return (
                  <div key={edition.datasetId} className="c-harmonizer-variable__edition">
                    <h3 className="c-harmonizer-variable__subtitle">
                      {edition.datasetName} ({edition.year}) · columna <code>{edition.column}</code>
                    </h3>
                    {values.length === 0 ? (
                      <p className="text-color-secondary">Sin valores fuera de «No especificado».</p>
                    ) : (
                      <div className="container-table">
                        <table className="table-condensed">
                          <thead>
                            <tr>
                              <th scope="col">Valor en el archivo</th>
                              <th scope="col">Etiqueta en su diccionario</th>
                              <th scope="col">Filas</th>
                              <th scope="col">Código común</th>
                            </tr>
                          </thead>
                          <tbody>
                            {values.map((v) => {
                              const target = maps[edition.datasetId]?.[v.value] ?? '';
                              const id = `target-${edition.datasetId}-${v.value}`;
                              return (
                                <tr key={v.value}>
                                  <td>
                                    <code>{v.value}</code>
                                  </td>
                                  <td>{v.sourceLabel ?? <span className="text-color-secondary">—</span>}</td>
                                  <td>{formatCount(v.count)}</td>
                                  <td>
                                    <label className="a11y-sr-only" htmlFor={id}>
                                      Código común para {v.value} en {edition.datasetName}
                                    </label>
                                    {catalogCodes.length > 0 ? (
                                      <select
                                        id={id}
                                        value={target}
                                        onChange={(e) => setTarget(edition.datasetId, v.value, e.target.value)}
                                      >
                                        <option value="">— sin recodificar —</option>
                                        {target !== '' && !catalogCodes.includes(target) ? (
                                          <option value={target}>{target} (no está en el catálogo)</option>
                                        ) : null}
                                        {catalog
                                          .filter((c) => c.code.trim() !== '')
                                          .map((c) => (
                                            <option key={c.code} value={c.code.trim()}>
                                              {c.code.trim()}
                                              {c.label ? ` · ${c.label}` : ''}
                                            </option>
                                          ))}
                                      </select>
                                    ) : (
                                      <input
                                        id={id}
                                        type="text"
                                        value={target}
                                        placeholder="sin recodificar"
                                        onChange={(e) => setTarget(edition.datasetId, v.value, e.target.value)}
                                      />
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}

              {notice ? (
                <p className="c-harmonizer-variable__notice" role="status">
                  {notice}
                </p>
              ) : null}
              {saveError ? (
                <p className="c-harmonizer-variable__error" role="alert">
                  {saveError}
                </p>
              ) : null}
              <div className="c-harmonizer-variable__actions">
                <Button type="button" variant="primary" onClick={save} disabled={saving || !dirty}>
                  {saving ? 'Guardando…' : 'Guardar recodificación'}
                </Button>
                <Button type="button" variant="secondary" onClick={discard} disabled={saving || !dirty}>
                  Descartar cambios
                </Button>
                {data.variable.categories.length > 0 || data.editions.some((e) => e.values.some((v) => v.recoded)) ? (
                  <Button type="button" variant="secondary" onClick={clearRecoding} disabled={saving}>
                    Quitar recodificación
                  </Button>
                ) : null}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
