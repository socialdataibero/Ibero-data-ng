import { Fragment } from 'react';
import {
  ANALYSIS_UNIT_LABEL,
  SOURCE_DESIGN_LABEL,
  SOURCE_ROLE_LABEL,
  type SourceRole,
} from '../../core/models/harmonizer.model';
import type { SourceMetadata, SourceMetadataColumn } from '../../core/models/resource.model';
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

/** What the resource knows about its harmonized source: design, unit, roles, "not specified" codes. */
export function SourceMetadataSummary({ metadata }: { metadata: SourceMetadata | null }) {
  if (!metadata) {
    return (
      <section className="c-dataset-detail__source" aria-labelledby="source-metadata-title">
        <h3 id="source-metadata-title" className="c-dataset-detail__source-title">
          Datos de la fuente
        </h3>
        <p className="c-dataset-detail__help">
          Este recurso no tiene datos de la fuente: se subió directamente, se creó antes del 13 de
          noviembre de 2026 o viene de una encuesta con ediciones de distinto diseño, unidad o
          factor de expansión.
        </p>
      </section>
    );
  }

  const withCodes = metadata.columns.filter((c) => c.missingCodes && c.missingCodes.length > 0);
  const roles = ROLES.map((role) => [role, roleColumn(metadata, role)] as const).filter(([, column]) => column);
  const editions = metadata.sourceEditionIds.length;

  return (
    <section className="c-dataset-detail__source" aria-labelledby="source-metadata-title">
      <h3 id="source-metadata-title" className="c-dataset-detail__source-title">
        Datos de la fuente
      </h3>
      <dl className="c-dataset-detail__source-list">
        <dt>Diseño</dt>
        <dd>{SOURCE_DESIGN_LABEL[metadata.design]}</dd>
        <dt>Unidad de análisis</dt>
        <dd>{ANALYSIS_UNIT_LABEL[metadata.unit]}</dd>
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
                <dd>Sin marcar</dd>
              </>
            ) : null}
          </>
        ) : null}
        <dt>No especificado</dt>
        <dd>
          {withCodes.length === 0
            ? 'Sin códigos declarados'
            : withCodes.map((c, i) => (
                <Fragment key={c.name}>
                  {i > 0 ? '; ' : ''}
                  <code>{c.name}</code>: {c.missingCodes!.join(', ')}{' '}
                  <span className="text-color-secondary">({codesText(c)})</span>
                </Fragment>
              ))}
        </dd>
        <dt>Origen</dt>
        <dd>
          {editions === 1 ? '1 edición del armonizador' : `${editions} ediciones del armonizador`}
        </dd>
      </dl>
      <p className="c-dataset-detail__help">
        Copiados del armonizador al crear el recurso; si después cambia el mapeo, esto no cambia. Las
        variables de códigos conservan sus códigos de «No especificado» en el archivo; en las
        cantidades y las variables sin rol ya vienen como valor faltante.
      </p>
    </section>
  );
}
