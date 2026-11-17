import { useId, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from 'sectei-library';
import { PageHeader } from '../shared/page-header/PageHeader';
import { PageHeaderSkeleton } from '../shared/page-header/PageHeaderSkeleton';
import { DatasetNotFound } from '../shared/dataset-not-found/DatasetNotFound';
import { ResultChart } from '../shared/result-chart/ResultChart';
import { CHART_LABEL, type ChartType, type TemplateListing } from '../../core/models/analysis-template.model';
import { translateApiError } from '../../core/api/error-messages';
import { downloadCsv } from '../../core/utils/csv';
import { resultCsvRows } from '../../core/utils/template-result';
import { TemplateResultTable } from './TemplateResultTable';
import { TemplateStepsSkeleton } from './AnalysisTemplateSkeleton';
import { useAnalysisTemplate } from './useAnalysisTemplate';
import './analysis-template.css';

const ROLE_LABEL: Record<string, string> = {
  geographic: 'geográfica',
  category: 'categoría',
  ordinal: 'ordinal',
  dichotomous: 'sí o no',
  measure: 'medida',
};

/** A checkbox or radio as Sisdai draws it: the input, then its label. */
function Choice(props: {
  type: 'checkbox' | 'radio';
  name?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div className="c-analysis-template__choice">
      <input
        id={id}
        type={props.type}
        name={props.name}
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
      />
      {/* One span: Sisdai's label is a flex row, which would split the text into columns. */}
      <label htmlFor={id}>
        <span>{props.children}</span>
      </label>
    </div>
  );
}

function reasonText(template: TemplateListing): string {
  if (!template.reason) return '';
  return (
    translateApiError({ code: template.reason.code, message: template.reason.message }) ??
    template.reason.message
  );
}

/**
 * Analyses from templates (demo of `propuesta_plantillas`): the user picks what to find out, then
 * the variables, and the server applies the method. Steps: resource → kind of analysis →
 * variables and "not specified" → chart, table and warnings.
 */
export function AnalysisTemplate() {
  const { pathname } = useLocation();
  const page = useAnalysisTemplate();
  const {
    organizationId,
    datasetId,
    dataset,
    resources,
    resourceId,
    catalog,
    template,
    result,
    base,
    chart,
  } = page;

  if (page.notFound) return <DatasetNotFound />;

  const datasetHref = pathname.startsWith('/datasets/')
    ? `/datasets/${organizationId}/${datasetId}`
    : `/organizations/${organizationId}/datasets/${datasetId}`;
  const crumbs = [
    { label: 'Inicio', href: '/dashboard' },
    { label: 'Conjuntos de datos', href: '/datasets' },
    { label: dataset?.title ?? 'Conjunto de datos', href: datasetHref },
    { label: 'Análisis con plantilla' },
  ];

  const groupInput = template?.inputs.find((i) => i.name === 'group');
  const mainColumns = new Set(
    [...page.choices.conditions, page.choices.variable, page.choices.measure].filter(Boolean),
  );
  const missingDisabled = template?.id === 'proportion' && base === 'total';
  // With both bases a warning true of each one would show twice: once is enough.
  const visibleWarnings = (result?.warnings ?? []).filter(
    (w, i, all) =>
      (!w.base || base === 'both' || w.base === base) &&
      all.findIndex((o) => o.message === w.message && (!o.base || base === 'both' || o.base === base)) === i,
  );
  const baseInfo = result?.bases?.find((b) => b.id === base) ?? null;
  const missingAvailable =
    template?.missing &&
    (template.id === 'proportion'
      ? template.inputs
          .find((input) => input.name === 'conditions')
          ?.options.some((o) => page.choices.conditions.includes(o.column) && o.hasMissingCodes)
      : template.inputs
          .find((input) => input.name === 'variable')
          ?.options.find((o) => o.column === page.choices.variable)?.hasMissingCodes);

  return (
    <div className="c-analysis-template">
      {dataset || page.loadError ? (
        <PageHeader
          title="Nuevo análisis con plantilla"
          intro={
            <p className="c-analysis-template__intro">
              Elige qué quieres saber y las variables; la plataforma aplica el método: el factor de expansión,
              la población a la que se le hizo cada pregunta, los «no especificados» y la precisión de cada
              cifra.
            </p>
          }
          crumbs={crumbs}
        />
      ) : (
        <PageHeaderSkeleton />
      )}

      <div className="container width-fixed c-analysis-template__body">
        <section className="c-analysis-template__step" aria-labelledby="step-resource">
          <h2 id="step-resource" className="c-analysis-template__step-title">
            <span className="c-analysis-template__step-number">1</span> Recurso
          </h2>
          {page.loadError ? (
            <>
              <p className="c-analysis-template__error" role="alert">
                {page.loadError}
              </p>
              <Button type="button" variant="secondary" onClick={page.retrySource}>
                Reintentar
              </Button>
            </>
          ) : resources === null ? (
            <TemplateStepsSkeleton />
          ) : resources.length === 0 ? (
            <p className="c-analysis-template__help">
              Este conjunto de datos todavía no tiene archivos. <Link to={datasetHref}>Sube uno</Link>.
            </p>
          ) : (
            <>
              <label className="c-analysis-template__label" htmlFor="template-resource">
                Archivo
              </label>
              <select
                id="template-resource"
                value={resourceId}
                onChange={(e) => page.selectResource(e.target.value)}
              >
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.filename}
                    {r.variableMetadata ? '' : ' (sin metadatos de variables)'}
                  </option>
                ))}
              </select>
              {catalog?.source ? (
                <p className="c-analysis-template__help">
                  {catalog.source.title}. Fuente {catalog.source.design === 'sample' ? 'muestral' : 'censal'}.
                </p>
              ) : null}
            </>
          )}
          {page.catalogError ? (
            <>
              <p className="c-analysis-template__error" role="alert">
                {page.catalogError}
              </p>
              <Button type="button" variant="secondary" onClick={page.retryCatalog}>
                Reintentar
              </Button>
            </>
          ) : resourceId && !catalog ? (
            <p role="status">Cargando plantillas…</p>
          ) : null}
        </section>

        {catalog ? (
          <section className="c-analysis-template__step" aria-labelledby="step-template">
            <h2 id="step-template" className="c-analysis-template__step-title">
              <span className="c-analysis-template__step-number">2</span> ¿Qué quieres saber?
            </h2>
            {catalog.templates.length === 0 ? (
              <p className="c-analysis-template__notice" role="status">
                No hay plantillas disponibles para este recurso.
              </p>
            ) : catalog.templates.every((t) => !t.compatible) ? (
              <p className="c-analysis-template__notice">
                Ninguna plantilla se puede usar con este recurso: {reasonText(catalog.templates[0])} Hace
                falta describir sus variables (rol, etiquetas, universo y «no especificados»).
              </p>
            ) : null}
            <div className="c-analysis-template__cards" role="group" aria-label="Tipo de análisis">
              {catalog.templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={template?.id === t.id}
                  disabled={!t.compatible}
                  className={`c-analysis-template__card${template?.id === t.id ? ' is-selected' : ''}`}
                  onClick={() => page.chooseTemplate(t.id)}
                >
                  <span className="c-analysis-template__card-title">{t.name}</span>
                  <span className="c-analysis-template__card-text">{t.description}</span>
                  {!t.compatible ? (
                    <span className="c-analysis-template__card-reason">{reasonText(t)}</span>
                  ) : null}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {template ? (
          <section className="c-analysis-template__step" aria-labelledby="step-inputs">
            <h2 id="step-inputs" className="c-analysis-template__step-title">
              <span className="c-analysis-template__step-number">3</span> Variables
            </h2>
            <div className="c-analysis-template__inputs">
              {template.inputs
                .filter((input) => input.name !== 'group')
                .map((input) =>
                  input.multiple ? (
                    <fieldset key={input.name} className="c-analysis-template__fieldset">
                      <legend className="c-analysis-template__label">{input.label}</legend>
                      <p className="c-analysis-template__help">{input.help}</p>
                      <p className="c-analysis-template__help">
                        Elige entre {input.multiple.min} y {input.multiple.max} condiciones.
                      </p>
                      {input.options.map((o) => (
                        <Choice
                          key={o.column}
                          type="checkbox"
                          checked={page.choices.conditions.includes(o.column)}
                          onChange={() => page.toggleCondition(o.column)}
                        >
                          {o.label}
                          {o.universe ? (
                            <span className="c-analysis-template__muted"> · {o.universe}</span>
                          ) : null}
                        </Choice>
                      ))}
                    </fieldset>
                  ) : (
                    <div key={input.name} className="c-analysis-template__field">
                      <label className="c-analysis-template__label" htmlFor={`input-${input.name}`}>
                        {input.label}
                      </label>
                      <select
                        id={`input-${input.name}`}
                        value={input.name === 'variable' ? page.choices.variable : page.choices.measure}
                        onChange={(e) =>
                          page.setChoice(input.name === 'variable' ? 'variable' : 'measure', e.target.value)
                        }
                      >
                        {input.options.map((o) => (
                          <option key={o.column} value={o.column}>
                            {o.label} ({ROLE_LABEL[o.role] ?? o.role})
                          </option>
                        ))}
                      </select>
                      <p className="c-analysis-template__help">{input.help}</p>
                    </div>
                  ),
                )}

              {groupInput ? (
                <div className="c-analysis-template__field">
                  <label className="c-analysis-template__label" htmlFor="input-group">
                    {groupInput.label}
                  </label>
                  <select
                    id="input-group"
                    value={page.choices.group}
                    onChange={(e) => page.setChoice('group', e.target.value)}
                  >
                    <option value="">Sin grupo (sólo el total)</option>
                    {groupInput.options.map((o) => (
                      <option key={o.column} value={o.column} disabled={mainColumns.has(o.column)}>
                        {o.label}
                        {mainColumns.has(o.column) ? ' (ya es lo que se mide)' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="c-analysis-template__help">{groupInput.help}</p>
                </div>
              ) : null}

              {template.missing ? (
                <fieldset
                  className="c-analysis-template__fieldset"
                  disabled={missingDisabled || !missingAvailable}
                >
                  <legend className="c-analysis-template__label">«No especificado»</legend>
                  <Choice
                    type="radio"
                    name="missing"
                    checked={page.missing === 'exclude'}
                    onChange={() => page.setMissing('exclude')}
                  >
                    Excluir (por defecto)
                  </Choice>
                  <Choice
                    type="radio"
                    name="missing"
                    checked={page.missing === 'include'}
                    onChange={() => page.setMissing('include')}
                  >
                    Incluir
                  </Choice>
                  <p className="c-analysis-template__help">
                    {missingDisabled
                      ? 'Con la base «Población total» todas las personas cuentan en el denominador: esta opción no cambia la cifra.'
                      : !missingAvailable
                        ? 'Esta variable no tiene códigos de «no especificado».'
                        : (result?.texts.missing ??
                          (page.missing === 'exclude'
                            ? 'Los registros sin respuesta salen del cálculo: el porcentaje es sobre quienes respondieron.'
                            : template.id === 'distribution'
                              ? 'Se muestra «No especificado» como una categoría más. El porcentaje se calcula sobre todo el universo de la pregunta.'
                              : 'Los no especificados se incluyen sólo en el denominador; nunca cuentan como quienes cumplen la condición.'))}
                  </p>
                </fieldset>
              ) : null}
            </div>
            {!result ? (
              <Button
                type="button"
                variant="primary"
                disabled={!page.request || page.running}
                onClick={page.calculate}
              >
                {page.running ? 'Calculando…' : 'Ver resultado'}
              </Button>
            ) : null}
            {!page.request ? (
              <p className="c-analysis-template__help" role="status">
                Revisa la selección de variables para ver el resultado.
              </p>
            ) : null}
            {page.running ? <p role="status">Calculando el análisis…</p> : null}
            {page.runError ? (
              <p className="c-analysis-template__error" role="alert">
                {page.runError}
              </p>
            ) : null}
          </section>
        ) : null}

        {result ? (
          <section
            className="c-analysis-template__step"
            aria-labelledby="step-result"
            aria-busy={page.running}
          >
            <h2 id="step-result" className="c-analysis-template__step-title">
              <span className="c-analysis-template__step-number">4</span> Resultado
              {page.running ? <span className="c-analysis-template__muted"> · actualizando…</span> : null}
            </h2>

            <div className="c-analysis-template__result-head">
              <p className="c-analysis-template__question">{result.texts.question}</p>
              <h3 className="c-analysis-template__result-title">{result.texts.title}</h3>
              <p className="c-analysis-template__note">
                {baseInfo?.note ?? result.texts.note} Fuente: {result.source.title}.
              </p>
              {result.texts.missing && !missingDisabled ? (
                <p className="c-analysis-template__note">{result.texts.missing}</p>
              ) : null}
            </div>

            <div className="c-analysis-template__controls">
              {result.bases ? (
                <div className="c-analysis-template__control">
                  <span className="c-analysis-template__label">Base del porcentaje</span>
                  <div
                    className="c-analysis-template__segmented"
                    role="group"
                    aria-label="Base del porcentaje"
                  >
                    {result.bases.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        aria-pressed={base === b.id}
                        className={base === b.id ? 'is-selected' : undefined}
                        onClick={() => page.setBase(b.id)}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="c-analysis-template__control">
                <label className="c-analysis-template__label" htmlFor="result-chart">
                  Gráfica
                </label>
                <select
                  id="result-chart"
                  value={chart}
                  onChange={(e) => page.setChart(e.target.value as ChartType)}
                >
                  {result.charts.compatible.map((c) => (
                    <option key={c} value={c}>
                      {CHART_LABEL[c]}
                      {c === result.charts.recommended ? ' (recomendada)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              {chart !== 'tabla' && chart !== 'numero_destacado' && chart !== 'barras_apiladas_100' ? (
                <>
                  <div className="c-analysis-template__control">
                    <label className="c-analysis-template__label" htmlFor="result-sort">
                      Orden
                    </label>
                    <select
                      id="result-sort"
                      value={page.sort}
                      onChange={(e) => page.setSort(e.target.value as 'catalog' | 'value')}
                    >
                      <option value="catalog">Catálogo</option>
                      <option value="value">De mayor a menor</option>
                    </select>
                  </div>
                  {result.source.design === 'sample' ? (
                    <Choice type="checkbox" checked={page.showInterval} onChange={page.setShowInterval}>
                      Intervalo de confianza
                    </Choice>
                  ) : null}
                  {result.dimensions.group ? (
                    <Choice type="checkbox" checked={page.showReference} onChange={page.setShowReference}>
                      Referencia del total
                    </Choice>
                  ) : null}
                </>
              ) : null}
            </div>

            {baseInfo ? <p className="c-analysis-template__help">{baseInfo.description}</p> : null}

            {visibleWarnings.length > 0 ? (
              <ul className="c-analysis-template__warnings" aria-label="Avisos">
                {visibleWarnings.map((w) => (
                  <li key={`${w.code}-${w.base ?? ''}`}>{w.message}</li>
                ))}
              </ul>
            ) : null}

            {chart !== 'tabla' ? (
              <ResultChart
                result={result}
                options={{
                  chart,
                  base: result.bases ? base : 'own',
                  showInterval: page.showInterval,
                  showReference: page.showReference,
                  sort: page.sort,
                }}
              />
            ) : null}

            <div className="c-analysis-template__table-head">
              <h3 className="c-analysis-template__subtitle">Tabla de resultados</h3>
              <Button
                type="button"
                variant="secondary"
                icon="pictogram-file-download"
                onClick={() =>
                  downloadCsv(
                    resultCsvRows(result),
                    `${result.template.id}_${result.inputs.group ?? 'total'}.csv`,
                  )
                }
              >
                Descargar CSV
              </Button>
            </div>
            <TemplateResultTable result={result} base={result.bases ? base : 'own'} />
            <p className="c-analysis-template__help">
              Vista previa: este análisis no se guarda. Los umbrales de precisión (15% y 30% de coeficiente de
              variación) y el aviso de cifras con uno o dos registros son provisionales.
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
