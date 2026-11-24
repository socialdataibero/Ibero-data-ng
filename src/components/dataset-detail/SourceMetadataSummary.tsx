import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ANALYSIS_UNIT_LABEL,
  GEO_LEVEL_LABEL,
  SOURCE_DESIGN_LABEL,
  SOURCE_ROLE_LABEL,
  VARIABLE_ROLE_LABEL,
  type SourceRole,
  type VariableRole,
} from '../../core/models/harmonizer.model';
import type {
  SourceMetadata,
  SourceMetadataColumn,
  SourceStatus,
} from '../../core/models/resource.model';
import { resourcesService } from '../../core/services/resources.service';
import { roleColumn } from '../../core/utils/source-metadata';

const ROLES: SourceRole[] = ['weight', 'stratum', 'psu'];

const count = (n: number) => new Intl.NumberFormat('es-MX').format(n);

/** Whether a column's codes are in the file or already missing values, and how many there were. */
function codesText(c: SourceMetadataColumn): string {
  if (c.missingCodesAreNull === false) return 'en el archivo';
  const cells = Object.values(c.missingCount ?? {}).reduce((a, b) => a + b, 0);
  return c.missingCount
    ? `como valor faltante; ${count(cells)} ${cells === 1 ? 'celda' : 'celdas'}`
    : 'como valor faltante';
}

const categoriesText = (n: number) => (n === 1 ? '1 categoría' : `${count(n)} categorías`);

/** The role of a column in Spanish: its use in analysis or its sample design role. */
function roleText(role: string | undefined): string | null {
  if (!role) return null;
  return (
    VARIABLE_ROLE_LABEL[role as VariableRole] ?? SOURCE_ROLE_LABEL[role as SourceRole] ?? role
  );
}

/** Where to see the harmonized view again, to save it once more. */
function originLink(metadata: SourceMetadata): string | null {
  const origin = metadata.origin;
  if (!origin) return null;
  if (origin.editionId) return `/harmonizer/datasets/${origin.editionId}/harmonized`;
  const params = new URLSearchParams();
  for (const v of origin.variables) params.append('variables', v);
  return `/harmonizer/surveys/${origin.surveyId}/harmonized?${params.toString()}`;
}

/** Asks the server whether the harmonizer changed after the resource was saved from it. */
function useSourceStatus(
  metadata: SourceMetadata | null,
  organizationId: string,
  datasetId: string,
  resourceId: string,
): SourceStatus | null {
  const [status, setStatus] = useState<SourceStatus | null>(null);
  const linked = Boolean(metadata?.origin);
  useEffect(() => {
    setStatus(null);
    if (!linked) return;
    let active = true;
    resourcesService
      .sourceStatus(organizationId, datasetId, resourceId)
      .then((s) => {
        if (active) setStatus(s);
      })
      // Only a notice: if it cannot be asked, nothing is shown.
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [linked, organizationId, datasetId, resourceId]);
  return status;
}

/**
 * What the resource knows about its harmonized source: the survey and its editions, design,
 * unit, the place it covers, sample design roles, and per variable its use in analysis, universe
 * and "not specified" codes. Warns when the harmonizer changed after it was saved.
 */
export function SourceMetadataSummary({
  metadata,
  organizationId,
  datasetId,
  resourceId,
}: {
  metadata: SourceMetadata | null;
  organizationId: string;
  datasetId: string;
  resourceId: string;
}) {
  const status = useSourceStatus(metadata, organizationId, datasetId, resourceId);

  if (!metadata) {
    return (
      <section className="c-dataset-detail__source" aria-labelledby="source-metadata-title">
        <h3 id="source-metadata-title" className="c-dataset-detail__source-title">
          Datos de la fuente
        </h3>
        <p className="c-dataset-detail__help">
          Este recurso no tiene datos de la fuente: se subió directamente o se creó antes del 13 de
          noviembre de 2026.
        </p>
      </section>
    );
  }

  const roles = ROLES.map((role) => [role, roleColumn(metadata, role)] as const).filter(([, column]) => column);
  const described = metadata.columns.filter(
    (c) => !c.name.startsWith('_') && (c.role || c.label || c.universe || c.missingCodes?.length),
  );
  const link = originLink(metadata);
  const sameDesign = metadata.design !== null;

  return (
    <section className="c-dataset-detail__source" aria-labelledby="source-metadata-title">
      <h3 id="source-metadata-title" className="c-dataset-detail__source-title">
        Datos de la fuente
      </h3>
      {status?.stale ? (
        <div className="c-dataset-detail__source-stale" role="status">
          <p>
            {status.reason === 'source_missing'
              ? 'La encuesta o la edición de la que salió este recurso ya no existe en el armonizador.'
              : 'El armonizador cambió después de crear este recurso (mapeo, códigos, recodificación, catálogo o uso en análisis): el archivo y estos datos son los de antes. Los análisis hechos con este recurso también.'}
          </p>
          {status.reason === 'changed' && link ? (
            <p>
              Para tener lo de ahora, <Link to={link}>abre la vista en el armonizador</Link> y vuelve a
              usarla en este conjunto de datos.
            </p>
          ) : null}
        </div>
      ) : null}
      <dl className="c-dataset-detail__source-list">
        {metadata.title ? (
          <>
            <dt>Encuesta</dt>
            <dd>
              {metadata.title}
              {metadata.source ? (
                <span className="text-color-secondary"> · fuente «{metadata.source}»</span>
              ) : null}
            </dd>
          </>
        ) : null}
        <dt>Diseño</dt>
        <dd>{metadata.design ? SOURCE_DESIGN_LABEL[metadata.design] : 'Distinto en cada edición'}</dd>
        <dt>Unidad de análisis</dt>
        <dd>{metadata.unit ? ANALYSIS_UNIT_LABEL[metadata.unit] : 'Distinta en cada edición'}</dd>
        {metadata.total ? (
          <>
            <dt>Lugar que cubre</dt>
            <dd>
              {metadata.total.label}{' '}
              <span className="text-color-secondary">
                ({GEO_LEVEL_LABEL[metadata.total.level]} <code>{metadata.total.code}</code>)
              </span>
            </dd>
          </>
        ) : null}
        {metadata.design === 'sample' ? (
          <>
            {roles.map(([role, column]) => (
              <Fragment key={role}>
                <dt>{SOURCE_ROLE_LABEL[role]}</dt>
                <dd>
                  <code>{column}</code>
                </dd>
              </Fragment>
            ))}
            {roleColumn(metadata, 'weight') === null ? (
              <>
                <dt>{SOURCE_ROLE_LABEL.weight}</dt>
                <dd>Distinto en cada edición o sin marcar</dd>
              </>
            ) : null}
          </>
        ) : null}
        <dt>{metadata.editions.length === 1 ? 'Edición' : 'Ediciones'}</dt>
        <dd>
          {metadata.editions.some((e) => e.name)
            ? metadata.editions.map((e, i) => (
                <Fragment key={e.id}>
                  {i > 0 ? '; ' : ''}
                  {e.name} ({e.year})
                  {!sameDesign && e.design ? ` · ${SOURCE_DESIGN_LABEL[e.design].toLowerCase()}` : ''}
                  {e.weight && roleColumn(metadata, 'weight') === null ? (
                    <>
                      {' '}
                      · factor <code>{e.weight}</code>
                    </>
                  ) : null}
                </Fragment>
              ))
            : metadata.editions.length === 1
              ? '1 edición del armonizador'
              : `${metadata.editions.length} ediciones del armonizador`}
        </dd>
      </dl>
      {described.length > 0 ? (
        <div className="container-table c-dataset-detail__source-table">
          <table className="table-condensed">
            <caption className="a11y-sr-only">Variables del recurso</caption>
            <thead>
              <tr>
                <th scope="col">Variable</th>
                <th scope="col">Uso en análisis</th>
                <th scope="col">A quién se le preguntó</th>
                <th scope="col">No especificado</th>
              </tr>
            </thead>
            <tbody>
              {described.map((c) => (
                <tr key={c.name}>
                  <th scope="row">
                    <code>{c.name}</code>
                    {c.label ? <span className="text-color-secondary"> · {c.label}</span> : null}
                  </th>
                  <td>
                    {roleText(c.role) ?? <span className="text-color-secondary">—</span>}
                    {c.categories?.length ? (
                      <span className="text-color-secondary">
                        {' '}
                        · {categoriesText(c.categories.filter((k) => k.kind === 'value').length)}
                      </span>
                    ) : null}
                  </td>
                  <td>{c.universe ?? <span className="text-color-secondary">—</span>}</td>
                  <td>
                    {c.missingCodes?.length ? (
                      <>
                        {c.missingCodes.join(', ')}{' '}
                        <span className="text-color-secondary">({codesText(c)})</span>
                      </>
                    ) : (
                      <span className="text-color-secondary">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <p className="c-dataset-detail__help">
        Copiados del armonizador al crear el recurso; si después cambia el mapeo, esto no cambia. Las
        variables de códigos conservan sus códigos de «No especificado» en el archivo; en las
        cantidades y las variables sin rol ya vienen como valor faltante.
      </p>
    </section>
  );
}
