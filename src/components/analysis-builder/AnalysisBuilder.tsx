import { Button } from 'sectei-library';
import type { MouseEvent } from 'react';
import type { Analysis, Step } from '../../core/models/analysis.model';
import type { Resource, ResourceColumn } from '../../core/models/resource.model';
import type { DatasetVisibility } from '../../core/models/dataset.model';
import { ConfirmDialog } from '../shared/confirm-dialog/ConfirmDialog';
import {
  AGG_FUNCS,
  JOIN_TYPES,
  OPERATORS,
  OP_LABELS,
  useAnalysisBuilder,
} from './useAnalysisBuilder';
import { AnalysisResultSkeleton, SavedAnalysesSkeleton } from './AnalysisBuilderSkeleton';
import './analysis-builder.css';

interface Props {
  organizationId: string;
  datasetId: string;
  resourceId: string;
  resourceColumns?: ResourceColumn[] | null;
  datasetResources?: Resource[];
  editingAnalysis?: Analysis | null;
  onRequestEditResource?: (analysis: Analysis) => void;
  onEditingConsumed?: () => void;
}

export function AnalysisBuilder({
  organizationId,
  datasetId,
  resourceId,
  resourceColumns = null,
  datasetResources = [],
  editingAnalysis = null,
  onRequestEditResource,
  onEditingConsumed,
}: Props) {
  const b = useAnalysisBuilder({
    organizationId,
    datasetId,
    resourceId,
    resourceColumns,
    datasetResources,
    editingAnalysis,
    onEditingConsumed,
  });

  const { form: f } = b;

  const renderFields = (step: Step, index: number) => {
    switch (step.op) {
      case 'join':
        return (
          <div className="c-analysis-builder__step-fields">
            <select
              value={(step.params['resourceId'] as string) ?? ''}
              onChange={(e) => b.onJoinResourceChange(index, step, e.target.value)}
              aria-label="Recurso a cruzar"
            >
              <option value="">recurso a cruzar…</option>
              {b.otherResources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.filename}
                </option>
              ))}
            </select>
            <select
              value={(step.params['type'] as string) ?? 'inner'}
              onChange={(e) => b.setParam(index, 'type', e.target.value)}
              aria-label="Tipo de cruce"
            >
              {JOIN_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === 'inner' ? 'inner (solo con match)' : 'left (conserva todo este lado)'}
                </option>
              ))}
            </select>
            <select
              value={(step.params['onLeft'] as string) ?? ''}
              onChange={(e) => b.setParam(index, 'onLeft', e.target.value)}
              aria-label="Columna de este recurso"
            >
              <option value="">columna de este recurso…</option>
              {(resourceColumns ?? []).map((col) => (
                <option key={col.name} value={col.name}>
                  {col.name}
                </option>
              ))}
            </select>
            <span aria-hidden="true">=</span>
            <select
              value={(step.params['onRight'] as string) ?? ''}
              onChange={(e) => b.setParam(index, 'onRight', e.target.value)}
              aria-label="Columna del otro recurso"
            >
              <option value="">columna del otro recurso…</option>
              {b.columnsForResource(step.params['resourceId'] as string).map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="alias (ej: expansion)"
              value={(step.params['alias'] as string) ?? ''}
              onChange={(e) => b.setParam(index, 'alias', e.target.value)}
              aria-label="Alias"
            />
          </div>
        );

      case 'group_by':
        return (
          <div className="c-analysis-builder__chips" role="group" aria-label="Columnas de agrupación">
            {b.availableColumns.map((col) => (
              <button
                key={col}
                type="button"
                className={`c-analysis-builder__chip${
                  b.isGroupByColumnSelected(step, col) ? ' is-active' : ''
                }`}
                onClick={() => b.toggleGroupByColumn(index, step, col)}
                aria-pressed={b.isGroupByColumnSelected(step, col)}
              >
                {col}
              </button>
            ))}
          </div>
        );

      case 'aggregate':
        return (
          <div className="c-analysis-builder__step-fields">
            <select
              value={(step.params['func'] as string) ?? 'SUM'}
              onChange={(e) => b.setParam(index, 'func', e.target.value)}
              aria-label="Función de agregado"
            >
              {AGG_FUNCS.map((fn) => (
                <option key={fn} value={fn}>
                  {fn}
                </option>
              ))}
            </select>
            <select
              value={(step.params['column'] as string) ?? ''}
              onChange={(e) => b.setParam(index, 'column', e.target.value)}
              aria-label="Columna a agregar"
            >
              <option value="">columna…</option>
              <option value="*">* (todas las filas)</option>
              {b.availableColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="nombre del resultado"
              value={(step.params['as'] as string) ?? ''}
              onChange={(e) => b.setParam(index, 'as', e.target.value)}
              aria-label="Nombre del resultado"
            />
            <label className="c-analysis-builder__check">
              <input
                type="checkbox"
                checked={Boolean(step.params['distinct'])}
                onChange={(e) => b.setParam(index, 'distinct', e.target.checked)}
              />
              distinct
            </label>
          </div>
        );

      case 'compute':
        return (
          <div className="c-analysis-builder__step-fields">
            <select
              value={(step.params['left'] as string) ?? ''}
              onChange={(e) => b.setParam(index, 'left', e.target.value)}
              aria-label="Columna A"
            >
              <option value="">columna A…</option>
              {b.availableColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
            <span aria-hidden="true">×</span>
            <select
              value={(step.params['right'] as string) ?? ''}
              onChange={(e) => b.setParam(index, 'right', e.target.value)}
              aria-label="Columna B"
            >
              <option value="">columna B (o número)…</option>
              {b.availableColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="o escribe un número en 'columna B'"
              value={(step.params['right'] as string) ?? ''}
              onChange={(e) => b.setParam(index, 'right', e.target.value)}
              aria-label="Número o columna B"
            />
            <input
              type="text"
              placeholder="nombre del resultado"
              value={(step.params['as'] as string) ?? ''}
              onChange={(e) => b.setParam(index, 'as', e.target.value)}
              aria-label="Nombre del resultado"
            />
          </div>
        );

      case 'percentage':
        return (
          <div className="c-analysis-builder__step-fields">
            <span>% de</span>
            <select
              value={(step.params['of'] as string) ?? ''}
              onChange={(e) => b.setParam(index, 'of', e.target.value)}
              aria-label="Agregado base"
            >
              <option value="">agregado…</option>
              {b.aggregateAliases.map((alias) => (
                <option key={alias} value={alias}>
                  {alias}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="nombre del resultado"
              value={(step.params['as'] as string) ?? ''}
              onChange={(e) => b.setParam(index, 'as', e.target.value)}
              aria-label="Nombre del resultado"
            />
          </div>
        );

      case 'filter':
        return (
          <div className="c-analysis-builder__step-fields">
            <select
              value={(step.params['column'] as string) ?? ''}
              onChange={(e) => b.setParam(index, 'column', e.target.value)}
              aria-label="Columna a filtrar"
            >
              <option value="">columna…</option>
              {b.availableColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
            <select
              value={(step.params['operator'] as string) ?? '='}
              onChange={(e) => b.setParam(index, 'operator', e.target.value)}
              aria-label="Operador"
            >
              {OPERATORS.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="valor"
              value={(step.params['value'] as string) ?? ''}
              onChange={(e) => b.setParam(index, 'value', e.target.value)}
              aria-label="Valor"
            />
          </div>
        );

      case 'sort':
        return (
          <div className="c-analysis-builder__step-fields">
            <select
              value={(step.params['column'] as string) ?? ''}
              onChange={(e) => b.setParam(index, 'column', e.target.value)}
              aria-label="Columna a ordenar"
            >
              <option value="">columna…</option>
              {b.availableColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
              {b.aggregateAliases.map((alias) => (
                <option key={`alias-${alias}`} value={alias}>
                  {alias}
                </option>
              ))}
            </select>
            <select
              value={(step.params['dir'] as string) ?? 'desc'}
              onChange={(e) => b.setParam(index, 'dir', e.target.value)}
              aria-label="Dirección"
            >
              <option value="asc">ascendente</option>
              <option value="desc">descendente</option>
            </select>
          </div>
        );

      case 'limit':
        return (
          <div className="c-analysis-builder__step-fields">
            <input
              type="number"
              min={1}
              value={(step.params['n'] as number) ?? 100}
              onChange={(e) => b.setParam(index, 'n', Number(e.target.value))}
              aria-label="Número de filas"
            />
            <span>filas</span>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="c-analysis-builder">
      {b.steps.length > 0 ? (
        <ol className="c-analysis-builder__steps">
          {b.steps.map((step, index) => (
            <li className="c-analysis-builder__step" key={`${step.op}-${index}`}>
              <div className="c-analysis-builder__step-header">
                <span className="c-analysis-builder__step-num">{index + 1}</span>
                <strong>{OP_LABELS[step.op]}</strong>
                <Button
                  type="button"
                  variant="bare-secondary"
                  size="small"
                  iconOnly
                  icon="pictogram-close"
                  className="c-analysis-builder__remove"
                  onClick={() => b.removeStep(index)}
                  aria-label="Quitar paso"
                />
              </div>
              {renderFields(step, index)}
            </li>
          ))}
        </ol>
      ) : null}

      <div className="c-analysis-builder__add">
        <label className="c-analysis-builder__add-label" htmlFor="analysis-new-op">
          Tipo de paso
        </label>
        <div className="c-analysis-builder__add-row">
          <select
            id="analysis-new-op"
            value={b.newOp}
            onChange={(e) => b.setNewOp(e.target.value as typeof b.newOp)}
            name="newOp"
          >
            {b.opNames.map((op) => (
              <option key={op} value={op}>
                {OP_LABELS[op]}
              </option>
            ))}
          </select>
          <Button type="button" variant="secondary" icon="pictogram-add" onClick={b.addStep}>
            Agregar paso
          </Button>
        </div>
      </div>
      {b.opCatalog && b.newOp ? (
        <p className="c-analysis-builder__hint">{b.opCatalog[b.newOp].description}</p>
      ) : null}

      {b.editingAnalysisId ? (
        <p className="c-analysis-builder__note">
          Editando análisis existente — al confirmar se sobrescribe (no se crea uno nuevo).
        </p>
      ) : null}

      {b.steps.length > 0 ? (
        <>
          <div className="c-analysis-builder__preview-row">
            <label className="c-analysis-builder__rounding" htmlFor="analysis-round">
              Redondear a
              <input
                id="analysis-round"
                type="number"
                min={0}
                max={15}
                placeholder="sin redondeo"
                value={b.roundDecimals}
                onChange={(e) => b.setRoundDecimals(e.target.value)}
              />
              decimales
            </label>
            <Button
              type="button"
              variant="primary"
              icon="pictogram-eye-view"
              onClick={b.runPreview}
              disabled={b.previewing}
            >
              {b.previewing ? 'Probando…' : 'Probar (preview)'}
            </Button>
          </div>

          {b.previewError ? (
            <p className="c-analysis-builder__error" role="alert">
              {b.previewError}
            </p>
          ) : null}

          {b.previewResult ? (
            <>
              <div className="c-analysis-builder__table-wrap">
                <p className="c-analysis-builder__meta">
                  {b.previewResult.rowCount} filas (muestra)
                </p>
                <div className="c-analysis-builder__table-scroll">
                  <table>
                    <thead>
                      <tr>
                        {b.previewResult.columns.map((col) => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {b.previewResult.rows.map((row, i) => (
                        <tr key={`preview-${i}`}>
                          {b.previewResult!.columns.map((col) => (
                            <td key={col}>{String(row[col] ?? '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="c-analysis-builder__save">
                {!b.showSaveForm ? (
                  <Button
                    type="button"
                    variant="primary"
                    icon="pictogram-add"
                    onClick={() => b.setShowSaveForm(true)}
                  >
                    {b.editingAnalysisId ? 'Actualizar este análisis' : 'Guardar este análisis'}
                  </Button>
                ) : (
                  <>
                    <form onSubmit={b.save} noValidate className="c-analysis-builder__save-form">
                      <div className="c-analysis-builder__field">
                        <label htmlFor="analysis-title">Título</label>
                        <input
                          id="analysis-title"
                          type="text"
                          placeholder="Título"
                          value={f.title}
                          onChange={(e) => f.setTitle(e.target.value)}
                          name="title"
                          aria-invalid={!!b.formErrors.title}
                          aria-describedby={b.formErrors.title ? 'analysis-title-error' : undefined}
                        />
                        {b.formErrors.title ? (
                          <p id="analysis-title-error" className="c-analysis-builder__error" role="alert">
                            {b.formErrors.title}
                          </p>
                        ) : null}
                      </div>
                      <div className="c-analysis-builder__field">
                        <label htmlFor="analysis-slug">Slug</label>
                        <input
                          id="analysis-slug"
                          type="text"
                          placeholder="slug-en-minusculas"
                          value={f.slug}
                          onChange={(e) => f.setSlug(e.target.value)}
                          name="slug"
                          aria-invalid={!!b.formErrors.slug}
                          aria-describedby={b.formErrors.slug ? 'analysis-slug-error' : undefined}
                        />
                        {b.formErrors.slug ? (
                          <p id="analysis-slug-error" className="c-analysis-builder__error" role="alert">
                            {b.formErrors.slug}
                          </p>
                        ) : null}
                      </div>
                      <div className="c-analysis-builder__field">
                        <label htmlFor="analysis-folder">Carpeta</label>
                        <input
                          id="analysis-folder"
                          type="text"
                          placeholder="Carpeta (ej: enigh)"
                          value={f.folder}
                          onChange={(e) => f.setFolder(e.target.value)}
                          name="folder"
                          aria-invalid={!!b.formErrors.folder}
                          aria-describedby={b.formErrors.folder ? 'analysis-folder-error' : undefined}
                        />
                        {b.formErrors.folder ? (
                          <p id="analysis-folder-error" className="c-analysis-builder__error" role="alert">
                            {b.formErrors.folder}
                          </p>
                        ) : null}
                      </div>
                      <div className="c-analysis-builder__field c-analysis-builder__field--full">
                        <label htmlFor="analysis-description">Descripción</label>
                        <textarea
                          id="analysis-description"
                          rows={2}
                          placeholder="Descripción (opcional)"
                          value={f.description}
                          onChange={(e) => f.setDescription(e.target.value)}
                          name="description"
                        />
                      </div>
                      <div className="c-analysis-builder__field">
                        <label htmlFor="analysis-visibility">Visibilidad</label>
                        <select
                          id="analysis-visibility"
                          value={f.visibility}
                          onChange={(e) => f.setVisibility(e.target.value as DatasetVisibility)}
                          name="visibility"
                        >
                          <option value="PRIVATE">Privado</option>
                          <option value="PUBLIC">Público</option>
                        </select>
                      </div>
                      <div className="c-analysis-builder__save-actions">
                        <Button type="submit" variant="primary" disabled={b.saving}>
                          {b.saving
                            ? b.editingAnalysisId
                              ? 'Actualizando…'
                              : 'Guardando…'
                            : b.editingAnalysisId
                              ? 'Actualizar'
                              : 'Confirmar'}
                        </Button>
                        {b.editingAnalysisId ? (
                          <Button type="button" variant="secondary" onClick={b.cancelEdit}>
                            Cancelar edición
                          </Button>
                        ) : null}
                      </div>
                    </form>
                    {b.saveError ? (
                      <p className="c-analysis-builder__error" role="alert">
                        {b.saveError}
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            </>
          ) : null}

          {b.savedAnalysis ? (
            <p className="c-analysis-builder__ok">
              Análisis “{b.savedAnalysis.title}” guardado en la carpeta “{b.savedAnalysis.folder}”.
            </p>
          ) : null}
        </>
      ) : null}

      <div className="c-analysis-builder__saved">
        <h3 className="c-analysis-builder__subtitle">Análisis guardados</h3>
        {b.vizCanvasError ? (
          <p className="c-analysis-builder__error" role="alert">
            {b.vizCanvasError}
          </p>
        ) : null}
        {b.loadingAnalyses ? (
          <SavedAnalysesSkeleton />
        ) : b.analyses.length === 0 ? (
          <p className="c-analysis-builder__meta">
            Todavía no hay análisis guardados para este dataset.
          </p>
        ) : (
          <ul className="c-analysis-builder__list">
            {b.analyses.map((analysis) => (
              <li className="c-analysis-builder__item" key={analysis.id}>
                <div className="c-analysis-builder__item-header">
                  <button
                    type="button"
                    className="c-analysis-builder__item-main"
                    onClick={() => void b.openAnalysis(analysis)}
                  >
                    <span className="c-analysis-builder__folder">{analysis.folder}</span>
                    <span className="c-analysis-builder__item-title">{analysis.title}</span>
                    <span
                      className={`c-analysis-builder__status c-analysis-builder__status--${analysis.status.toLowerCase()}`}
                    >
                      {analysis.status}
                    </span>
                  </button>
                  <div className="c-analysis-builder__item-actions">
                    <Button
                      type="button"
                      variant="secondary"
                      icon="pictogram-edit"
                      onClick={() => onRequestEditResource?.(analysis)}
                    >
                      Editar
                    </Button>
                    {analysis.status === 'DONE' ? (
                      <Button
                        type="button"
                        variant="secondary"
                        icon="pictogram-link-external"
                        onClick={(e) => void b.openInVizCanvas(analysis, e as MouseEvent)}
                        disabled={b.openingVizCanvasId === analysis.id}
                      >
                        {b.openingVizCanvasId === analysis.id ? 'Abriendo…' : 'VizCanvas'}
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="secondary"
                      icon="pictogram-delete"
                      onClick={(e) => b.requestRemoveAnalysis(analysis, e as MouseEvent)}
                      disabled={b.removingId === analysis.id}
                    >
                      {b.removingId === analysis.id ? 'Borrando…' : 'Borrar'}
                    </Button>
                  </div>
                </div>

                {b.openAnalysisId === analysis.id ? (
                  analysis.status === 'FAILED' ? (
                    <p className="c-analysis-builder__error" role="alert">
                      {analysis.errorMessage}
                    </p>
                  ) : b.openAnalysisData ? (
                    <div className="c-analysis-builder__table-wrap">
                      <div className="c-analysis-builder__table-scroll">
                        <table>
                          <thead>
                            <tr>
                              {b.openAnalysisData.columns.map((col) => (
                                <th key={col}>{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {b.openAnalysisData.rows.map((row, i) => (
                              <tr key={`open-${analysis.id}-${i}`}>
                                {b.openAnalysisData!.columns.map((col) => (
                                  <td key={col}>{String(row[col] ?? '')}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <AnalysisResultSkeleton />
                  )
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={b.pendingDelete !== null}
        title="Borrar análisis"
        message={
          b.pendingDelete ? (
            <>¿Borrar el análisis "{b.pendingDelete.title}"? Esto no se puede deshacer.</>
          ) : null
        }
        confirmLabel="Borrar"
        danger
        confirming={b.removingId === b.pendingDelete?.id}
        onConfirm={() => void b.confirmRemoveAnalysis()}
        onCancel={b.cancelRemoveAnalysis}
      />
    </div>
  );
}
