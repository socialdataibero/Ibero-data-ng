import { Button } from 'sectei-library';
import {
  GEO_LEVELS,
  GEO_LEVEL_LABEL,
  VARIABLE_ROLES,
  VARIABLE_ROLE_LABEL,
  type GeoLevel,
  type ValueType,
  type VariableAnalysis,
  type VariableRole,
} from '../../../core/models/harmonizer.model';
import { useVariableAnalysis } from './useVariableAnalysis';

/** What each role is for, under the selector. */
const ROLE_HELP: Record<VariableRole, string> = {
  category: 'Grupos sin orden, como sexo o lengua. Se puede agrupar, filtrar y contar.',
  ordinal: 'Grupos con un orden natural, como nivel de escolaridad. Se ordenan según su secuencia.',
  dichotomous: 'Dos respuestas, una marcada como «sí». Permite calcular proporciones («% que habla»).',
  geographic: 'Clave territorial, como entidad o municipio. Se agrupa y se puede mapear.',
  label: 'Nombre que acompaña a una clave, como el nombre del municipio. Solo se muestra.',
  temporal: 'Año o periodo. Sirve para comparar ediciones.',
  measure: 'Una cantidad, como edad o ingreso. Se puede sumar y promediar.',
  socioeconomic_stratum: 'Clasificación socioeconómica (bajo, medio, alto). Se agrupa como categorías ordenadas.',
  key: 'Identificador para unir tablas, como el folio de vivienda.',
  identifier: 'Folio de cada registro. Se excluye de los cálculos.',
  free_text: 'Respuesta abierta. No se grafica.',
};

interface Props {
  surveyId: string;
  variableId: string;
  saved: VariableAnalysis;
  suggestedRole: VariableRole | null;
  dataType: ValueType | null;
  knownCodes: string[];
  /** Label of a code, from the catalog or a dictionary, if there is one. */
  codeLabel: (code: string) => string | null;
  canEdit: boolean;
  onSaved: (analysis: VariableAnalysis) => void;
}

/** «Uso en análisis»: role, universe, "yes" code, level, unit and groups of a canonical variable. */
export function VariableAnalysisSection(props: Props) {
  const { suggestedRole, knownCodes, codeLabel, canEdit } = props;
  const { form, set, setCut, addCut, removeCut, dirty, saving, error, notice, save, discard, typeHint, splitsAllowed } =
    useVariableAnalysis(props);
  const disabled = !canEdit || saving;

  return (
    <section className="c-harmonizer-variable__panel" aria-labelledby="variable-analysis-title">
      <h2 id="variable-analysis-title" className="c-harmonizer-variable__title">
        Uso en análisis
      </h2>
      <p className="text-color-secondary">
        Qué tipo de variable es y a quién se le preguntó. Las plantillas de análisis lo usan para ofrecer
        solo las variables que sirven en cada cálculo. Vale para todas las ediciones; el factor de
        expansión, el estrato y la UPM se marcan en el mapeo de cada edición.
      </p>

      <div className="c-harmonizer-variable__fields">
        <div className="c-harmonizer-variable__field">
          <label htmlFor="analysis-role">Tipo de variable</label>
          <select
            id="analysis-role"
            value={form.role}
            disabled={disabled}
            onChange={(e) => set('role', e.target.value as VariableRole | '')}
          >
            <option value="">— sin describir —</option>
            {VARIABLE_ROLES.map((role) => (
              <option key={role} value={role}>
                {VARIABLE_ROLE_LABEL[role]}
              </option>
            ))}
          </select>
          {form.role !== '' ? <p className="form-help">{ROLE_HELP[form.role]}</p> : null}
          {suggestedRole && suggestedRole !== form.role ? (
            <p className="form-help">
              Sugerencia, según el diccionario o los datos: <strong>{VARIABLE_ROLE_LABEL[suggestedRole]}</strong>.{' '}
              {canEdit ? (
                <button type="button" className="hyperlink" onClick={() => set('role', suggestedRole)}>
                  Usar la sugerencia
                </button>
              ) : null}
            </p>
          ) : null}
        </div>

        {form.role !== '' ? (
          <div className="c-harmonizer-variable__field">
            <label htmlFor="analysis-universe">A quién se le preguntó (opcional)</label>
            <input
              id="analysis-universe"
              type="text"
              value={form.universe}
              disabled={disabled}
              placeholder="Por ejemplo: población de 3 años y más"
              onChange={(e) => set('universe', e.target.value)}
            />
            <p className="form-help">
              Una celda vacía es alguien a quien no se le hizo la pregunta: queda fuera de los cálculos de
              esta variable.
            </p>
          </div>
        ) : null}

        {form.role === 'dichotomous' ? (
          <div className="c-harmonizer-variable__field">
            <label htmlFor="analysis-positive">Código que cuenta como «sí»</label>
            <select
              id="analysis-positive"
              value={form.positiveValue}
              disabled={disabled}
              onChange={(e) => set('positiveValue', e.target.value)}
            >
              <option value="">— elige un código —</option>
              {form.positiveValue !== '' && !knownCodes.includes(form.positiveValue) ? (
                <option value={form.positiveValue}>{form.positiveValue} (ya no está en los datos)</option>
              ) : null}
              {knownCodes.map((code) => {
                const label = codeLabel(code);
                return (
                  <option key={code} value={code}>
                    {code}
                    {label ? ` · ${label}` : ''}
                  </option>
                );
              })}
            </select>
            <p className="form-help">
              Los códigos del catálogo de la variable o, si no tiene, los que aparecen en sus ediciones ya
              recodificados.
            </p>
          </div>
        ) : null}

        {form.role === 'geographic' ? (
          <div className="c-harmonizer-variable__field">
            <label htmlFor="analysis-level">Nivel territorial</label>
            <select
              id="analysis-level"
              value={form.geoLevel}
              disabled={disabled}
              onChange={(e) => set('geoLevel', e.target.value as GeoLevel | '')}
            >
              <option value="">— elige el nivel —</option>
              {GEO_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {GEO_LEVEL_LABEL[level]}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {form.role === 'measure' ? (
          <div className="c-harmonizer-variable__field">
            <label htmlFor="analysis-unit">Unidad (opcional)</label>
            <input
              id="analysis-unit"
              type="text"
              value={form.unit}
              disabled={disabled}
              placeholder="Por ejemplo: años"
              onChange={(e) => set('unit', e.target.value)}
            />
          </div>
        ) : null}
      </div>

      {typeHint ? (
        <p className="c-harmonizer-variable__notice" role="status">
          {typeHint}
        </p>
      ) : null}

      {splitsAllowed ? (
        <>
          <h3 className="c-harmonizer-variable__subtitle">Partir resultados</h3>
          <div className="c-harmonizer-variable__check">
            <input
              id="analysis-splits"
              type="checkbox"
              checked={form.splits}
              disabled={disabled}
              onChange={(e) => set('splits', e.target.checked)}
            />
            <label htmlFor="analysis-splits">Se puede usar para partir un resultado (desagregar)</label>
          </div>
          {form.splits ? (
            <>
              <div className="c-harmonizer-variable__check">
                <input
                  id="analysis-summable"
                  type="checkbox"
                  checked={form.summable}
                  disabled={disabled}
                  onChange={(e) => set('summable', e.target.checked)}
                />
                <label htmlFor="analysis-summable">Sus grupos suman el total (se puede mostrar «Todos»)</label>
              </div>
              <div className="c-harmonizer-variable__fields">
                <div className="c-harmonizer-variable__field">
                  <label htmlFor="analysis-not-applicable">Nombre de la celda vacía (opcional)</label>
                  <input
                    id="analysis-not-applicable"
                    type="text"
                    value={form.notApplicableLabel}
                    disabled={disabled}
                    placeholder="Por ejemplo: No aplica (menores de 12 años)"
                    onChange={(e) => set('notApplicableLabel', e.target.value)}
                  />
                </div>
                {form.role === 'geographic' ? (
                  <div className="c-harmonizer-variable__field">
                    <label htmlFor="analysis-max-level">Nivel más detallado con representatividad (opcional)</label>
                    <select
                      id="analysis-max-level"
                      value={form.maxLevel}
                      disabled={disabled}
                      onChange={(e) => set('maxLevel', e.target.value as GeoLevel | '')}
                    >
                      <option value="">— sin indicar —</option>
                      {GEO_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {GEO_LEVEL_LABEL[level]}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </div>

              {form.role === 'measure' ? (
                <>
                  <p className="text-color-secondary">
                    Grupos en los que se corta la cantidad, de menor a mayor y sin encimarse. Deja vacío el
                    «hasta» del último para que quede abierto («65 años y más»).
                  </p>
                  {form.cuts.length > 0 ? (
                    <div className="container-table">
                      <table className="table-condensed c-harmonizer-variable__cuts">
                        <thead>
                          <tr>
                            <th scope="col">Desde</th>
                            <th scope="col">Hasta</th>
                            <th scope="col">Etiqueta</th>
                            <th scope="col">
                              <span className="a11y-sr-only">Acciones</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {form.cuts.map((cut, index) => (
                            <tr key={index}>
                              <td>
                                <label className="a11y-sr-only" htmlFor={`cut-from-${index}`}>
                                  Desde, grupo {index + 1}
                                </label>
                                <input
                                  id={`cut-from-${index}`}
                                  type="number"
                                  value={cut.from}
                                  disabled={disabled}
                                  onChange={(e) => setCut(index, 'from', e.target.value)}
                                />
                              </td>
                              <td>
                                <label className="a11y-sr-only" htmlFor={`cut-to-${index}`}>
                                  Hasta, grupo {index + 1}
                                </label>
                                <input
                                  id={`cut-to-${index}`}
                                  type="number"
                                  value={cut.to}
                                  disabled={disabled}
                                  placeholder="y más"
                                  onChange={(e) => setCut(index, 'to', e.target.value)}
                                />
                              </td>
                              <td>
                                <label className="a11y-sr-only" htmlFor={`cut-label-${index}`}>
                                  Etiqueta, grupo {index + 1}
                                </label>
                                <input
                                  id={`cut-label-${index}`}
                                  type="text"
                                  value={cut.label}
                                  disabled={disabled}
                                  placeholder="0 a 14 años"
                                  onChange={(e) => setCut(index, 'label', e.target.value)}
                                />
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="hyperlink"
                                  disabled={disabled}
                                  onClick={() => removeCut(index)}
                                  aria-label={`Quitar el grupo ${index + 1}`}
                                >
                                  Quitar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                  <div className="c-harmonizer-variable__actions">
                    <Button type="button" variant="secondary" size="small" onClick={addCut} disabled={disabled}>
                      Agregar grupo
                    </Button>
                  </div>
                </>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}

      {notice ? (
        <p className="c-harmonizer-variable__notice" role="status">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="c-harmonizer-variable__error" role="alert">
          {error}
        </p>
      ) : null}
      {canEdit ? (
        <div className="c-harmonizer-variable__actions">
          <Button type="button" variant="primary" onClick={save} disabled={saving || !dirty}>
            {saving ? 'Guardando…' : 'Guardar uso en análisis'}
          </Button>
          <Button type="button" variant="secondary" onClick={discard} disabled={saving || !dirty}>
            Descartar cambios
          </Button>
        </div>
      ) : null}
    </section>
  );
}
