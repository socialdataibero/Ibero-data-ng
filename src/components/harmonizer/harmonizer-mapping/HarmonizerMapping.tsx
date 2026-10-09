import { Button } from 'sectei-library';
import { PageHeader } from '../../shared/page-header/PageHeader';
import { MappingStatusBadge } from '../../shared/mapping-status-badge/MappingStatusBadge';
import { StatusBadge } from '../../shared/status-badge/StatusBadge';
import { ConfirmDialog } from '../../shared/confirm-dialog/ConfirmDialog';
import { HarmonizerMappingContentSkeleton } from './HarmonizerMappingSkeleton';
import { useHarmonizerMapping } from './useHarmonizerMapping';
import './harmonizer-mapping.css';

export function HarmonizerMapping() {
  const {
    dataset,
    renamedColumns,
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
            'Asocia cada columna del CSV a una variable canónica.'
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
              Para cada columna del CSV elige la variable canónica a la que corresponde, crea una
              nueva, o déjala sin mapear. Las sugerencias vienen del <em>histórico</em> (misma
              columna mapeada en otra edición de esta encuesta) o del <em>nombre</em>. Nada se
              guarda hasta pulsar «Guardar mapeo».
            </p>
            <p className="text-color-secondary">
              En <em>No especificado</em> escribe, separados por comas, los códigos que en esta
              edición significan «no especificado» (ej. <code>9, 99</code>). En la vista armonizada
              y en las descargas esos valores y las celdas vacías salen como valor faltante (nulo
              en Parquet). El cero y cualquier otro valor se conservan.
            </p>

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
                      <th scope="col">Columna del CSV</th>
                      <th scope="col">Variable canónica</th>
                      <th scope="col">No especificado</th>
                      <th scope="col">Sugerencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={row.column.name}>
                        <td>
                          <code className="c-harmonizer-mapping__code">{row.column.name}</code>
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
                                    Escribe el nombre canónico o cambia la selección.
                                  </p>
                                ) : (
                                  <p className="form-help">Escribe el nombre canónico a crear.</p>
                                )}
                              </>
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
            Hay asignaciones que no se han guardado, incluidas las sugerencias precargadas.
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
