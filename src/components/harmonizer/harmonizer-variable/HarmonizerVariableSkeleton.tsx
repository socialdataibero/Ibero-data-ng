import { PageHeaderSkeleton } from '../../shared/page-header/PageHeaderSkeleton';
import { SkeletonStatus } from '../../shared/skeleton/SkeletonStatus';
import { TableSkeleton } from '../../shared/skeleton/TableSkeleton';
import './harmonizer-variable.css';

export function HarmonizerVariableSkeleton() {
  return (
    <div className="c-harmonizer-variable">
      <PageHeaderSkeleton />
      <div className="container width-fixed c-harmonizer-variable__body">
        <SkeletonStatus label="Cargando la comparación…">
          <TableSkeleton headers={['Código', 'Edición', 'Edición']} rows={6} />
        </SkeletonStatus>
      </div>
    </div>
  );
}
