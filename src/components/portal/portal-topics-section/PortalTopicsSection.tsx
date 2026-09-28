import type { HTMLAttributes } from 'react';
import { Button, Card } from 'sectei-library';
import { CardSkeleton } from '../../shared/skeleton/CardSkeleton';
import { SkeletonStatus } from '../../shared/skeleton/SkeletonStatus';
import { usePortalTopicsSection } from './usePortalTopicsSection';
import './portal-topics-section.css';

export interface PortalTopicCard {
  id?: string | number;
  key?: string;
  className?: string;
  [key: string]: unknown;
}

export interface PortalTopicsSectionProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  intro?: string;
  summary?: string;
  buttonText?: string;
  href?: string;
  onClick?: () => void;
  buttonVariant?: string;
  buttonSize?: string;
  disabled?: boolean;
  cards?: PortalTopicCard[];
  loading?: boolean;
  className?: string;
}

const SKELETON_ITEMS = 3;

export function PortalTopicsSection({
  title = '',
  intro = '',
  summary = '',
  buttonText = '',
  href,
  onClick,
  buttonVariant = 'primary',
  buttonSize = 'default',
  disabled = false,
  cards = [],
  loading = false,
  className = '',
  ...rest
}: PortalTopicsSectionProps) {
  const { titleId, classes } = usePortalTopicsSection({ className });

  return (
    <section className={classes} aria-labelledby={title ? titleId : undefined} {...rest}>
      <div className="topics-section__intro">
        {title ? (
          <h2 id={titleId} className="topics-section__title">
            {title}
          </h2>
        ) : null}

        {intro ? <p className="topics-section__subtitle">{intro}</p> : null}

        {summary ? <p className="topics-section__summary">{summary}</p> : null}
      </div>

      {loading ? (
        <SkeletonStatus label="Cargando temas…" className="topics-section__cards">
          {Array.from({ length: SKELETON_ITEMS }, (_, index) => (
            <CardSkeleton
              key={index}
              className="topics-section__card"
              imageHeight="10rem"
              lines={3}
            />
          ))}
        </SkeletonStatus>
      ) : cards.length > 0 ? (
        <div className="topics-section__cards">
          {cards.map((card, index) => {
            const { id, key, className: cardClassName, ...cardProps } = card;

            return (
              <Card
                key={key ?? id ?? `card-${index}`}
                className={['topics-section__card', cardClassName].filter(Boolean).join(' ')}
                {...cardProps}
              />
            );
          })}
        </div>
      ) : null}

      {buttonText ? (
        <div className="topics-section__action">
          <Button variant={buttonVariant} size={buttonSize} href={href} onClick={onClick} disabled={disabled}>
            {buttonText}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
