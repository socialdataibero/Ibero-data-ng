import type { HTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Card } from 'sectei-library';
import './horizontal-card.css';

const VIZ_PICTOGRAMS: Record<string, string> = {
  bars: 'pictogram-level',
  lines: 'pictogram-layer-lines',
  dots: 'pictogram-layer-dots',
};

export interface CardDatasetRef {
  label: string;
  href?: string;
  external?: boolean;
}

export interface CardVisualization {
  id?: string;
  type?: string;
  pictogram?: string;
  label?: string;
}

export interface HorizontalCardProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  label?: string;
  source?: string;
  year?: string | number | null;
  institution?: string;
  dataset?: CardDatasetRef | null;
  updated?: string;
  visualizations?: Array<string | CardVisualization>;
  compact?: boolean;
  href?: string;
  children?: ReactNode;
}

export function HorizontalCard({
  title = '',
  label = '',
  source = '',
  year = '',
  institution = '',
  dataset = null,
  updated = '',
  visualizations = [],
  compact = false,
  href,
  className = '',
  ...rest
}: HorizontalCardProps) {
  const isLink = Boolean(href);
  const classes = [
    isLink ? 'card' : '',
    isLink ? 'card-hyperlink-inner' : '',
    'horizontal-card',
    compact ? 'horizontal-card--compact' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const viz = compact
    ? []
    : visualizations.map((item, index) => {
        if (typeof item === 'string') {
          return {
            id: item,
            pictogram: VIZ_PICTOGRAMS[item] ?? 'pictogram-level',
            label: item,
          };
        }
        return {
          id: item.id ?? `viz-${index}`,
          pictogram:
            item.pictogram ?? VIZ_PICTOGRAMS[item.type ?? ''] ?? 'pictogram-level',
          label: item.label ?? item.type ?? 'Visualización',
        };
      });

  const showInstitution = !compact && institution;
  const showDataset = !compact && dataset?.label;
  const datasetAsLink = Boolean(dataset?.href) && !isLink;

  const body = (
    <>
      <div className="horizontal-card__header">
        {title ? <p className="card-title horizontal-card__title">{title}</p> : null}
        {label ? <span className="horizontal-card__label">{label}</span> : null}
      </div>

      <dl className="horizontal-card__data">
        {source ? (
          <div>
            <dt>Fuente</dt>
            <dd>{source}</dd>
          </div>
        ) : null}
        {year !== '' && year != null ? (
          <div>
            <dt>Año</dt>
            <dd>{year}</dd>
          </div>
        ) : null}
        {showInstitution ? (
          <div>
            <dt>Institución</dt>
            <dd>{institution}</dd>
          </div>
        ) : null}
        {showDataset ? (
          <div>
            <dt>Conjunto de datos</dt>
            <dd>
              {datasetAsLink ? (
                <a
                  href={dataset!.href}
                  className="horizontal-card__link"
                  {...(dataset!.external
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                  onClick={(event) => event.stopPropagation()}
                >
                  {dataset!.label}
                  {dataset!.external ? (
                    <span className="pictogram-link-external" aria-hidden="true" />
                  ) : null}
                </a>
              ) : (
                dataset?.label
              )}
            </dd>
          </div>
        ) : null}
      </dl>

      {updated || viz.length > 0 ? (
        <div className="horizontal-card__footer">
          {updated ? (
            <p className="horizontal-card__updated">
              {updated.startsWith('Última')
                ? updated
                : `Última actualización: ${updated}`}
            </p>
          ) : (
            <span />
          )}

          {viz.length > 0 ? (
            <p className="horizontal-card__visualizations">
              <span>Visualizaciones:</span>
              {viz.map((item) => (
                <span
                  key={item.id}
                  className={item.pictogram}
                  title={item.label}
                  aria-label={item.label}
                  role="img"
                />
              ))}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );

  if (isLink && href) {
    return (
      <Link to={href} className={classes} {...rest}>
        <div className="card-body">{body}</div>
      </Link>
    );
  }

  return (
    <Card className={classes} {...rest}>
      {body}
    </Card>
  );
}
