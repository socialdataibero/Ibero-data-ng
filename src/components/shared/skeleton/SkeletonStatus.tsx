import type { HTMLAttributes } from 'react';

export interface SkeletonStatusProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export function SkeletonStatus({
  label = 'Cargando…',
  className = '',
  children,
  ...rest
}: SkeletonStatusProps) {
  return (
    <div role="status" aria-busy="true" className={className || undefined} {...rest}>
      <span className="a11y-sr-only">{label}</span>
      {children}
    </div>
  );
}
