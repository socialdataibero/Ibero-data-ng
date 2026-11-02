import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'sectei-library';
import { PageHeader } from '../../shared/page-header/PageHeader';
import { MappingStatusBadge } from '../../shared/mapping-status-badge/MappingStatusBadge';
import { StatusBadge } from '../../shared/status-badge/StatusBadge';
import { ConfirmDialog } from '../../shared/confirm-dialog/ConfirmDialog';
import { HarmonizerMappingContentSkeleton } from './HarmonizerMappingSkeleton';
import { useHarmonizerMapping } from './useHarmonizerMapping';
import {
  UPLOAD_ENCODING_LABEL,
  type CodebookCategory,
  type ColumnValues,
  type ValueType,
} from '../../../core/models/harmonizer.model';
import './harmonizer-mapping.css';

export function HarmonizerMapping() {
  const {
    dataset,
    renamedColumns,
    uploadSource,
    canonicalVariables,
    rows,
    loading,
    loadError,
    saving,
    saveError,
    rowErrors,
    mappedCount,
    pendingHref,
    leavingToHarmonized,
    viewHarmonized,
    backToHarmonizer,
    cancelLeave,
    leaveWithoutSaving,
    setChoice,
    setNewName,
    setMissingCodes,
    setDataType,
    typeHint,
    typeStatus,
    valueTypeLabel,
    clearAll,
    mapAllByName,
    completeWithCodebook,
    codebook,
    codebooks,
    codebookChoice,
    chooseCodebook,
    tableChoice,
    setTableChoice,
    applyCodebook,
    attachingCodebook,
    codebookError,
    otherEditions,
    copySource,
    setCopySource,
    copyFromEdition,
    copying,
    exportMappingCsv,
    importMappingCsv,
    bulkNotice,
    bulkError,
    filter,
    setFilter,
    onlyUnmapped,
    setOnlyUnmapped,
    visibleRows,
    save,
    crumbs,
    newOption,
    canonicalPrefix,
    suggestionLabel,
  } = useHarmonizerMapping();

  const chosenCodebook = codebooks.find((c) => c.id === codebookChoice);
  const codebookChanged =
    codebookChoice !== (codebook?.id ?? '') || (codebookChoice !== '' && tableChoice !== (codebook?.table ?? ''));
  const filtering = filter.trim() !== '' || onlyUnmapped;

  return (
    <div className="c-harmonizer-mapping">
      <PageHeader
        title="Mapeo de columnas"
        intro={
          dataset ? (
            <>
              <strong>{dataset.name}</strong> ({dataset.year}) · encuesta{' '}
              <strong>{dataset.surveyName}</strong>
            </>
          ) : (
            'Asocia cada columna del archivo a una variable canónica.'
          )
        }
        crumbs={crumbs}
        action={
          <Button
            type="button"
            variant="secondary"
            icon="pictogram-arrow-left"
            onClick={backToHarmonizer}
          >
            Armonizador
          </Button>
        }
      />

      <div className="container width-fixed c-harmonizer-mapping__body">
        {loadError ? <p className="c-harmonizer-mapping__error">{loadError}</p> : null}

        {loading && !loadError ? <HarmonizerMappingContentSkeleton /> : null}

        {!loading && !loadError ? (
          <>
            <p className="text-color-secondary">
              Para cada columna del archivo elige la variable canónica a la que corresponde, crea
              una nueva, o déjala sin mapear. Las sugerencias vienen del <em>histórico</em> (misma
              columna mapeada en otra edición de esta encuesta), del <em>nombre</em> o, con
              diccionario, de la <em>descripción</em> (una columna que cambió de nombre entre años,
              como <code>PARENT</code> y <code>PARENTESCO</code>). Nada se guarda hasta pulsar
              «Guardar mapeo».
            </p>
            <p className="text-color-secondary">
              En <em>No especificado</em> escribe, separados por comas, los códigos que en esta
              edición significan «no especificado» (ej. <code>9, 99</code>). En la vista armonizada
              y en las descargas esos valores y las celdas vacías salen como valor faltante (nulo
              en Parquet). El cero y cualquier otro valor se conservan.
            </p>
            <p className="text-color-secondary">
              En <em>Tipo</em> elige cómo se guarda la variable al descargar el Parquet o usarlo en
              un dataset: <em>Entero</em> o <em>Decimal</em> permiten sumar, promediar, multiplicar
              por el factor de expansión y filtrar con «mayor que»; <em>Texto</em> conserva el valor
              tal cual (útil para claves como <code>01</code>). Viene sugerido según los valores de
              esta edición; al guardar queda confirmado para la variable en todas las ediciones. Si
              algún valor no es número, el guardado lo indica para que lo marques como no
              especificado o elijas Texto.
            </p>

            {uploadSource?.format === 'dbf' ? (
              <div className="c-harmonizer-mapping__notice" role="status">
                <p>
                  El archivo DBF se leyó con la codificación{' '}
                  <strong>{UPLOAD_ENCODING_LABEL[uploadSource.encoding]}</strong>
                  {uploadSource.encodingSource === 'user'
                    ? ', la que elegiste al subirlo.'
                    : uploadSource.encodingSource === 'header'
                      ? ', la que indica el propio archivo.'
                      : ', deducida del texto del archivo.'}{' '}
                  Si en los nombres o valores ves letras raras en lugar de acentos o ñ, elimina esta
                  edición y súbela de nuevo eligiendo otra codificación.
                </p>
                {uploadSource.deletedRecords > 0 ? (
                  <p>
                    Se omitieron {uploadSource.deletedRecords.toLocaleString('es-MX')} registros
                    marcados como borrados en el DBF.
                  </p>
                ) : null}
              </div>
            ) : null}

            {renamedColumns.length > 0 ? (
              <div className="c-harmonizer-mapping__notice" role="status">
                <p>
                  El archivo tenía columnas con el mismo nombre. Para conservarlas todas, se
                  renombraron así:
                </p>
                <ul>
                  {renamedColumns.map((r) => (
                    <li key={r.position}>
                      Columna {r.position}: <code>{r.original}</code> → <code>{r.renamed}</code>
                    </li>
                  ))}
                </ul>
                <p>
                  Revisa a qué variable corresponde cada una antes de mapearlas; los nombres
                  renombrados no existen en el archivo original.
                </p>
              </div>
            ) : null}

            <div className="c-harmonizer-mapping__summary">
              <MappingStatusBadge mappedColumns={mappedCount} totalColumns={rows.length} />
              {dataset ? (
                <StatusBadge variant="neutral">
                  Filas cargadas: {dataset.rowCount.toLocaleString('es-MX')}
                </StatusBadge>
              ) : null}
            </div>

            <section className="c-harmonizer-mapping__tools" aria-labelledby="mapping-codebook-title">
              <h2 id="mapping-codebook-title" className="c-harmonizer-mapping__tools-title">
                Diccionario de variables
              </h2>
              <p className="text-color-secondary c-harmonizer-mapping__tools-help">
                Un diccionario (descriptor del INEGI o plantilla CSV) dice qué significa cada columna y
                cada código. Con él se muestran las etiquetas junto a los valores y se puede completar el
                mapeo de todas las columnas de una vez.{' '}
                {dataset ? (
                  <Link to={`/harmonizer/surveys/${dataset.surveyId}/codebooks`} className="hyperlink">
                    Subir o ver diccionarios
                  </Link>
                ) : null}
              </p>
              {codebooks.length === 0 ? (
                <p className="text-color-secondary">Esta encuesta todavía no tiene diccionarios.</p>
              ) : (
                <div className="c-harmonizer-mapping__tools-row">
                  <div className="c-harmonizer-mapping__tool">
                    <label htmlFor="mapping-codebook">Diccionario</label>
                    <select
                      id="mapping-codebook"
                      value={codebookChoice}
                      onChange={(e) => chooseCodebook(e.target.value)}
                    >
                      <option value="">— sin diccionario —</option>
                      {codebooks.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {chosenCodebook && chosenCodebook.tables.length > 1 ? (
                    <div className="c-harmonizer-mapping__tool">
                      <label htmlFor="mapping-codebook-table">Tabla</label>
                      <select
                        id="mapping-codebook-table"
                        value={tableChoice}
                        onChange={(e) => setTableChoice(e.target.value)}
                      >
                        <option value="">Elegir automáticamente</option>
                        {chosenCodebook.tables.map((t) => (
                          <option key={t} value={t}>
                            {t || '(sin tabla)'}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                  <Button
                    type="button"
                    variant="secondary"
                    size="small"
                    onClick={applyCodebook}
                    disabled={attachingCodebook || !codebookChanged}
                  >
                    {attachingCodebook ? 'Aplicando…' : codebookChoice ? 'Usar este diccionario' : 'Quitar diccionario'}
                  </Button>
                </div>
              )}
              {codebook ? (
                <p className="c-harmonizer-mapping__tools-status">
                  Usa <strong>{codebook.name}</strong>
                  {codebook.table ? (
                    <>
                      , tabla <strong>{codebook.table}</strong>
                    </>
                  ) : null}
                  : describe {codebook.matchedColumns.toLocaleString('es-MX')} de{' '}
                  {rows.length.toLocaleString('es-MX')} columnas.
                </p>
              ) : null}
              {codebookError ? (
                <p className="c-harmonizer-mapping__error" role="alert">
                  {codebookError}
                </p>
              ) : null}
            </section>

            <section className="c-harmonizer-mapping__tools" aria-labelledby="mapping-bulk-title">
              <h2 id="mapping-bulk-title" className="c-harmonizer-mapping__tools-title">
                Mapear varias columnas a la vez
              </h2>
              <div className="c-harmonizer-mapping__tools-row">
                {codebook ? (
                  <Button type="button" variant="primary" size="small" onClick={completeWithCodebook}>
                    Completar con el diccionario
                  </Button>
                ) : null}
                <Button type="button" variant="secondary" size="small" onClick={mapAllByName}>
                  Mapear todas por nombre
                </Button>
                <Button type="button" variant="secondary" size="small" onClick={clearAll}>
                  Desmapear todas
                </Button>
              </div>
              {otherEditions.length > 0 ? (
                <div className="c-harmonizer-mapping__tools-row">
                  <div className="c-harmonizer-mapping__tool">
                    <label htmlFor="mapping-copy">Copiar el mapeo guardado de</label>
                    <select id="mapping-copy" value={copySource} onChange={(e) => setCopySource(e.target.value)}>
                      <option value="">— elige una edición —</option>
                      {otherEditions.map((e) => (
                        <option key={e.id} value={e.id} disabled={e.mappedColumns === 0}>
                          {e.name} ({e.year}) · {e.mappedColumns} mapeadas
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="small"
                    onClick={copyFromEdition}
                    disabled={!copySource || copying}
                  >
                    {copying ? 'Copiando…' : 'Copiar'}
                  </Button>
                </div>
              ) : null}
              <div className="c-harmonizer-mapping__tools-row">
                <Button type="button" variant="secondary" size="small" onClick={exportMappingCsv}>
                  Exportar mapeo (CSV)
                </Button>
                <label className="c-harmonizer-mapping__file-button">
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="a11y-sr-only"
                    onChange={importMappingCsv}
                  />
                  <span aria-hidden="true">Importar mapeo (CSV)</span>
                  <span className="a11y-sr-only">Importar mapeo desde un archivo CSV</span>
                </label>
              </div>
              <p className="form-help c-harmonizer-mapping__tools-help">
                El CSV tiene las columnas <code>columna, variable, tipo, no_especificado</code>: exporta
                el mapeo, edítalo en una hoja de cálculo y vuelve a importarlo. Ninguna de estas
                acciones guarda: revisa la tabla y pulsa «Guardar mapeo».
              </p>
              {bulkNotice ? (
                <p className="c-harmonizer-mapping__bulk-notice" role="status">
                  {bulkNotice}
                </p>
              ) : null}
              {bulkError ? (
                <p className="c-harmonizer-mapping__error" role="alert">
                  {bulkError}
                </p>
              ) : null}
            </section>

            <div className="c-harmonizer-mapping__filter">
              <div className="c-harmonizer-mapping__tool">
                <label htmlFor="mapping-filter">Buscar columna</label>
                <input
                  id="mapping-filter"
                  type="search"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Nombre, descripción o variable"
                />
              </div>
              <div className="c-harmonizer-mapping__check">
                <input
                  id="mapping-only-unmapped"
                  type="checkbox"
                  checked={onlyUnmapped}
                  onChange={(e) => setOnlyUnmapped(e.target.checked)}
                />
                <label htmlFor="mapping-only-unmapped">Solo sin mapear</label>
              </div>
              <p className="text-color-secondary c-harmonizer-mapping__filter-count" aria-live="polite">
                {filtering
                  ? `Mostrando ${visibleRows.length.toLocaleString('es-MX')} de ${rows.length.toLocaleString('es-MX')} columnas`
                  : `${rows.length.toLocaleString('es-MX')} columnas`}
              </p>
            </div>

            <form onSubmit={save} noValidate>
              <div className="container-table">
                <table className="table-condensed">
                  <thead>
                    <tr>
                      <th scope="col">Columna del archivo</th>
                      <th scope="col">Variable canónica</th>
                      <th scope="col">Tipo</th>
                      <th scope="col">No especificado</th>
                      <th scope="col">Sugerencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-color-secondary">
                          Ninguna columna coincide con el filtro.
                        </td>
                      </tr>
                    ) : null}
                    {visibleRows.map(({ row, index }, position) => {
                      const section = row.column.codebook?.section ?? null;
                      const previousSection =
                        position > 0 ? (visibleRows[position - 1].row.column.codebook?.section ?? null) : null;
                      const startsSection =
                        codebook !== null &&
                        section !== null &&
                        (position === 0 || section !== previousSection);
                      return (
                        <Fragment key={row.column.name}>
                          {startsSection ? (
                            <tr className="c-harmonizer-mapping__section">
                              <th scope="colgroup" colSpan={5}>
                                {section}
                              </th>
                            </tr>
                          ) : null}
                          <tr>
                            <td>
                              <code className="c-harmonizer-mapping__code">{row.column.name}</code>
                              {row.column.codebook?.label ? (
                                <p
                                  className="c-harmonizer-mapping__label"
                                  title={row.column.codebook.question ?? undefined}
                                >
                                  {row.column.codebook.label}
                                </p>
                              ) : null}
                              <ColumnValuesSummary
                                values={row.column.values}
                                categories={row.column.codebook?.categories ?? []}
                              />
                            </td>
                            <td>
                              <div className="c-harmonizer-mapping__field">
                                <label className="a11y-sr-only" htmlFor={`choice-${row.column.name}`}>
                                  Variable canónica para {row.column.name}
                                </label>
                                <select
                                  id={`choice-${row.column.name}`}
                                  value={row.choice}
                                  onChange={(e) => setChoice(index, e.target.value)}
                                  name={`choice-${row.column.name}`}
                                >
                                  <option value="">— sin mapear —</option>
                                  {canonicalVariables.map((cv) => (
                                    <option key={cv.id} value={`${canonicalPrefix}${cv.id}`}>
                                      {cv.name}
                                    </option>
                                  ))}
                                  <option value={newOption}>Crear nueva…</option>
                                </select>
                                {row.choice === newOption ? (
                                  <>
                                    <label
                                      className="a11y-sr-only"
                                      htmlFor={`new-${row.column.name}`}
                                    >
                                      Nombre canónico nuevo para {row.column.name}
                                    </label>
                                    <input
                                      id={`new-${row.column.name}`}
                                      type="text"
                                      value={row.newName}
                                      onChange={(e) => setNewName(index, e.target.value)}
                                      name={`new-${row.column.name}`}
                                      placeholder="nombre canónico (ej. edad)"
                                      aria-invalid={rowErrors.has(index)}
                                      aria-describedby={rowErrors.has(index) ? `new-${row.column.name}-error` : undefined}
                                    />
                                    {rowErrors.has(index) ? (
                                      <p id={`new-${row.column.name}-error`} className="c-harmonizer-mapping__error" role="alert">
                                        {rowErrors.get(index)}
                                      </p>
                                    ) : (
                                      <p className="form-help">
                                        Letras sin acento, números y _; empieza con letra.
                                      </p>
                                    )}
                                  </>
                                ) : null}
                              </div>
                            </td>
                            <td>
                              <div className="c-harmonizer-mapping__field c-harmonizer-mapping__field--type">
                                <label className="a11y-sr-only" htmlFor={`type-${row.column.name}`}>
                                  Tipo de {row.column.name}
                                </label>
                                <select
                                  id={`type-${row.column.name}`}
                                  value={row.dataType}
                                  onChange={(e) => setDataType(index, e.target.value as ValueType)}
                                  name={`type-${row.column.name}`}
                                  disabled={row.choice === ''}
                                  aria-describedby={row.choice === '' ? undefined : `type-${row.column.name}-hint`}
                                >
                                  {(Object.keys(valueTypeLabel) as ValueType[]).map((type) => (
                                    <option key={type} value={type}>
                                      {valueTypeLabel[type]}
                                    </option>
                                  ))}
                                </select>
                                {row.choice !== '' ? (
                                  <p
                                    id={`type-${row.column.name}-hint`}
                                    className={`form-help c-harmonizer-mapping__type-hint c-harmonizer-mapping__type-hint--${typeStatus(row)}`}
                                  >
                                    {typeHint(row)}
                                  </p>
                                ) : null}
                              </div>
                            </td>
                            <td>
                              <label className="a11y-sr-only" htmlFor={`missing-${row.column.name}`}>
                                Códigos de no especificado para {row.column.name}
                              </label>
                              <input
                                id={`missing-${row.column.name}`}
                                type="text"
                                value={row.missingCodes}
                                onChange={(e) => setMissingCodes(index, e.target.value)}
                                name={`missing-${row.column.name}`}
                                placeholder="ej. 9, 99"
                                disabled={row.choice === ''}
                                aria-describedby={
                                  row.column.codebook?.missingCodes.length ? `missing-${row.column.name}-hint` : undefined
                                }
                              />
                              {row.column.codebook?.missingCodes.length ? (
                                <p id={`missing-${row.column.name}-hint`} className="form-help c-harmonizer-mapping__type-hint">
                                  Diccionario: {row.column.codebook.missingCodes.join(', ')}
                                </p>
                              ) : null}
                            </td>
                            <td>
                              {row.column.suggestionSource ? (
                                <StatusBadge
                                  variant={
                                    row.column.suggestionSource === 'history' ? 'success' : 'neutral'
                                  }
                                >
                                  {suggestionLabel[row.column.suggestionSource]}:{' '}
                                  {row.column.suggested}
                                </StatusBadge>
                              ) : row.column.selectedCanonicalId ? (
                                <span className="text-color-secondary">guardado</span>
                              ) : null}
                            </td>
                          </tr>
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {saveError ? <p className="c-harmonizer-mapping__error">{saveError}</p> : null}

              <div className="c-harmonizer-mapping__actions">
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar mapeo'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  icon="pictogram-arrow-right"
                  onClick={viewHarmonized}
                >
                  Ver armonizado
                </Button>
              </div>
            </form>
          </>
        ) : null}
      </div>

      <ConfirmDialog
        open={pendingHref !== null}
        title="Cambios sin guardar"
        message={
          <>
            Hay asignaciones que no se han guardado, incluidas las sugerencias precargadas y los
            tipos sin confirmar.
            {leavingToHarmonized ? ' La vista armonizada solo muestra el mapeo guardado.' : ''} Si
            continúas sin guardar, estos cambios se pierden. Para conservarlos, pulsa «Guardar
            mapeo».
          </>
        }
        cancelLabel="Seguir editando"
        confirmLabel={leavingToHarmonized ? 'Ver sin guardar' : 'Salir sin guardar'}
        danger
        onConfirm={leaveWithoutSaving}
        onCancel={cancelLeave}
      />
    </div>
  );
}

const MAX_VALUE_LENGTH = 40;

/** Etiqueta de un valor según el diccionario, comparando códigos numéricos sin ceros a la izquierda. */
function valueLabel(categories: CodebookCategory[], value: string): string | null {
  const key = (v: string) => (/^\d+$/.test(v) ? v.replace(/^0+(?=\d)/, '') : v);
  return (
    categories.find(
      (c) => (c.kind === 'value' || c.kind === 'missing') && c.code !== '' && key(c.code) === key(value),
    )?.label ?? null
  );
}

function ColumnValuesSummary({
  values,
  categories,
}: {
  values: ColumnValues;
  categories: CodebookCategory[];
}) {
  const { top, distinct, distinctCapped, empty } = values;
  const meta = [
    distinctCapped
      ? `más de ${distinct.toLocaleString('es-MX')} valores distintos`
      : `${distinct.toLocaleString('es-MX')} ${distinct === 1 ? 'valor distinto' : 'valores distintos'}`,
    empty > 0 ? `${empty.toLocaleString('es-MX')} ${empty === 1 ? 'vacía' : 'vacías'}` : null,
  ].filter(Boolean);

  if (top.length === 0) {
    return (
      <p className="form-help c-harmonizer-mapping__values-meta">
        Sin valores: todas las celdas están vacías.
      </p>
    );
  }

  return (
    <>
      <ul className="c-harmonizer-mapping__values" aria-label="Valores más frecuentes">
        {top.map(({ value, count }) => {
          const cut = value.length > MAX_VALUE_LENGTH;
          const label = valueLabel(categories, value);
          return (
            <li key={value}>
              <code title={cut ? value : undefined}>
                {cut ? `${value.slice(0, MAX_VALUE_LENGTH)}…` : value}
              </code>
              {label ? <span className="c-harmonizer-mapping__value-label"> {label}</span> : null}{' '}
              <span className="text-color-secondary">({count.toLocaleString('es-MX')})</span>
            </li>
          );
        })}
        {distinctCapped || distinct > top.length ? (
          <li aria-hidden="true" className="text-color-secondary">
            …
          </li>
        ) : null}
      </ul>
      <p className="form-help c-harmonizer-mapping__values-meta">{meta.join(' · ')}</p>
    </>
  );
}
