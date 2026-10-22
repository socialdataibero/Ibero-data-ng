import { Button } from 'sectei-library';
import { PageHeader } from '../../shared/page-header/PageHeader';
import { MappingStatusBadge } from '../../shared/mapping-status-badge/MappingStatusBadge';
import { StatusBadge } from '../../shared/status-badge/StatusBadge';
import { ConfirmDialog } from '../../shared/confirm-dialog/ConfirmDialog';
import { HarmonizerMappingContentSkeleton } from './HarmonizerMappingSkeleton';
import { useHarmonizerMapping } from './useHarmonizerMapping';
import {
  UPLOAD_ENCODING_LABEL,
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
    save,
    crumbs,
    newOption,
    canonicalPrefix,
    suggestionLabel,
  } = useHarmonizerMapping();

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
              columna mapeada en otra edición de esta encuesta) o del <em>nombre</em>. Nada se
              guarda hasta pulsar «Guardar mapeo».
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
              <Button type="button" variant="secondary" size="small" onClick={clearAll}>
                Desmapear todas
              </Button>
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
                    {rows.map((row, index) => (
                      <tr key={row.column.name}>
                        <td>
                          <code className="c-harmonizer-mapping__code">{row.column.name}</code>
                          <ColumnValuesSummary values={row.column.values} />
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
                          />
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
                    ))}
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

function ColumnValuesSummary({ values }: { values: ColumnValues }) {
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
          return (
            <li key={value}>
              <code title={cut ? value : undefined}>
                {cut ? `${value.slice(0, MAX_VALUE_LENGTH)}…` : value}
              </code>{' '}
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
