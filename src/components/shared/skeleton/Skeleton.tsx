import type { CSSProperties } from 'react';
import './skeleton.css';

export interface SkeletonProps {
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  className?: string;
}

export function Skeleton({ width = '100%', height = '1rem', className = '' }: SkeletonProps) {
  return (
    <span
      className={['skeleton', className].filter(Boolean).join(' ')}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}
