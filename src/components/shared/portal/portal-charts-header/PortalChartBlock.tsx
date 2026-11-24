import type { HTMLAttributes, ReactNode } from 'react';
import { Button } from 'sectei-library';
import { PortalChart, type PortalChartProps } from '../portal-chart/PortalChart';
import { usePortalChartBlock, type PortalChartBlockActionId } from './usePortalChartBlock';

export interface PortalChartBlockProps extends HTMLAttributes<HTMLElement> {
  id?: string;
  title?: string;
  description?: string;
  chart?: PortalChartProps;
  children?: ReactNode;
  actions?: PortalChartBlockActionId[];
  onAction?: (action: PortalChartBlockActionId) => void;
  className?: string;
}

export function PortalChartBlock({
  id,
  title = '',
  description = '',
  chart,
  children,
  // Downloading the image and editing the chart are not implemented: both opened the table.
  actions = ['table'],
  onAction,
  className = '',
  ...rest
}: PortalChartBlockProps) {
  const { titleId, actionList } = usePortalChartBlock({ id, title, actions });

  const classes = ['charts-header__block', className].filter(Boolean).join(' ');

  return (
    <article className={classes} aria-labelledby={titleId} data-chart-id={id} {...rest}>
      {title ? (
        <h3 id={titleId} className="charts-header__block-title">
          {title}
        </h3>
      ) : null}

      {description ? <p className="charts-header__block-description">{description}</p> : null}

      <div className="charts-header__block-body">{chart ? <PortalChart {...chart} /> : children}</div>

      {actionList.length > 0 ? (
        <div className="charts-header__actions" role="group" aria-label="Acciones de la gráfica">
          {actionList.map(({ id: actionId, label, Icon }) => (
            <Button
              key={actionId}
              type="button"
              variant="secondary"
              size="small"
              iconOnly
              aria-label={label}
              className="charts-header__action"
              onClick={() => onAction?.(actionId)}
            >
              <Icon />
            </Button>
          ))}
        </div>
      ) : null}
    </article>
  );
}
