import { Button } from 'sectei-library';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../shared/page-header/PageHeader';
import { ConfirmDialog } from '../../shared/confirm-dialog/ConfirmDialog';
import { StatusBadge } from '../../shared/status-badge/StatusBadge';
import { useHarmonizerVariables } from './useHarmonizerVariables';
import { HarmonizerVariablesSkeleton } from './HarmonizerVariablesSkeleton';
import './harmonizer-variables.css';

export function HarmonizerVariables() {
  const {
    data,
    loading,
    loadError,
    crumbs,
    editingId,
    editName,
    setEditName,
    editError,
    renaming,
    startRename,
    cancelRename,
    submitRename,
    pendingDelete,
    removingId,
    deleteError,
    requestRemove,
    cancelRemove,
    confirmRemove,
    valueTypeLabel,
  } = useHarmonizerVariables();

  if (loading) return <HarmonizerVariablesSkeleton />;

  return (
    <div className="c-harmonizer-variables">
      <PageHeader
        title="Variables canónicas"
        intro={
          data ? (
            <>
              Variables de la encuesta «{data.survey.name}». Su nombre es la columna de la vista
              armonizada y de los archivos exportados.
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

      <div className="container width-fixed c-harmonizer-variables__body">
        {loadError ? (
          <p className="c-harmonizer-variables__error" role="alert">
            {loadError}
          </p>
        ) : data ? (
          <>
            <p
              id="variable-name-rules"
              className="text-color-secondary c-harmonizer-variables__rules"
            >
              Reglas del nombre: de 2 a 64 caracteres; empieza con una letra; solo letras sin
              acento, números y guion bajo (<code>_</code>), sin espacios. No distingue mayúsculas:{' '}
              <code>edad</code> y <code>EDAD</code> son la misma variable.
            </p>

            {deleteError ? (
              <p className="c-harmonizer-variables__error" role="alert">
                {deleteError}
              </p>
            ) : null}

            {data.items.length === 0 ? (
              <p className="text-color-secondary">
                Esta encuesta todavía no tiene variables canónicas. Se crean al mapear una edición.
              </p>
            ) : (
              <div className="container-table">
                <table className="table-condensed c-harmonizer-variables__table">
                  <thead>
                    <tr>
                      <th scope="col">Nombre</th>
                      <th scope="col">Tipo</th>
                      <th scope="col">Mapeada en</th>
                      <th scope="col">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((variable) => {
                      const inUse = variable.usages.length > 0;
                      return (
                        <tr key={variable.id}>
                          <td>
                            {editingId === variable.id ? (
                              <form
                                className="c-harmonizer-variables__rename"
                                onSubmit={submitRename}
                                noValidate
                              >
                                <label className="a11y-sr-only" htmlFor="variable-rename">
                                  Nuevo nombre para {variable.name}
                                </label>
                                <input
                                  id="variable-rename"
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  maxLength={64}
                                  autoFocus
                                  aria-invalid={!!editError}
                                  aria-describedby={
                                    editError
                                      ? 'variable-rename-error variable-name-rules'
                                      : 'variable-name-rules'
                                  }
                                />
                                {editError ? (
                                  <p
                                    id="variable-rename-error"
                                    className="c-harmonizer-variables__error"
                                    role="alert"
                                  >
                                    {editError}
                                  </p>
                                ) : null}
                                <div className="c-harmonizer-variables__rename-actions">
                                  <Button type="submit" variant="primary" disabled={renaming}>
                                    {renaming ? 'Guardando…' : 'Guardar'}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={cancelRename}
                                    disabled={renaming}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </form>
                            ) : (
                              <div className="c-harmonizer-variables__name">
                                <code>{variable.name}</code>
                                {variable.nameValid ? null : (
                                  <StatusBadge
                                    variant="warning"
                                    title="Se creó antes de las reglas del nombre. Sigue funcionando, pero conviene renombrarla."
                                  >
                                    nombre fuera de reglas
                                  </StatusBadge>
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            {variable.dataType ? (
                              valueTypeLabel[variable.dataType]
                            ) : (
                              <span className="text-color-secondary">Sin confirmar</span>
                            )}
                          </td>
                          <td>
                            {inUse ? (
                              <ul className="c-harmonizer-variables__usages">
                                {variable.usages.map((usage) => (
                                  <li key={usage.datasetId}>
                                    <Link
                                      to={`/harmonizer/datasets/${usage.datasetId}/mapping`}
                                      className="hyperlink"
                                    >
                                      {usage.datasetName}
                                    </Link>{' '}
                                    <span className="text-color-secondary">
                                      (columna <code>{usage.column}</code>)
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-color-secondary">Ninguna edición</span>
                            )}
                          </td>
                          <td>
                            <nav
                              className="c-harmonizer-variables__actions"
                              aria-label={`Acciones de ${variable.name}`}
                            >
                              <button
                                type="button"
                                className="hyperlink"
                                aria-label={`Renombrar variable ${variable.name}`}
                                disabled={editingId === variable.id}
                                onClick={() => startRename(variable)}
                              >
                                Renombrar
                              </button>
                              <span
                                className="c-harmonizer-variables__separator"
                                aria-hidden="true"
                              >
                                |
                              </span>
                              <button
                                type="button"
                                className="hyperlink"
                                aria-label={`Eliminar variable ${variable.name}`}
                                aria-describedby={inUse ? 'variable-delete-note' : undefined}
                                disabled={inUse || removingId === variable.id}
                                onClick={() => requestRemove(variable)}
                              >
                                Eliminar
                              </button>
                            </nav>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {data.items.length > 0 ? (
              <p
                id="variable-delete-note"
                className="text-color-secondary c-harmonizer-variables__note"
              >
                Solo se pueden eliminar las variables que no mapea ninguna edición. Para liberar
                una, quítala del mapeo de las ediciones que la usan. Renombrar una variable cambia
                su nombre en todas las ediciones; los archivos ya descargados conservan el nombre
                anterior.
              </p>
            ) : null}
          </>
        ) : null}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Borrar variable"
        message={
          pendingDelete ? (
            <>
              ¿Borrar la variable "{pendingDelete.name}"? Ninguna edición la usa. Esto no se puede
              deshacer.
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
