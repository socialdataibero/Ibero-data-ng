import { PageHeaderSkeleton } from '../../shared/page-header/PageHeaderSkeleton';
import { SkeletonStatus } from '../../shared/skeleton/SkeletonStatus';
import { TableSkeleton } from '../../shared/skeleton/TableSkeleton';
import './harmonizer-variables.css';

export function HarmonizerVariablesSkeleton() {
  return (
    <div className="c-harmonizer-variables">
      <PageHeaderSkeleton />
      <div className="container width-fixed c-harmonizer-variables__body">
        <SkeletonStatus label="Cargando variables…">
          <TableSkeleton headers={['Nombre', 'Tipo', 'Mapeada en', 'Códigos entre ediciones', 'Acciones']} rows={6} />
        </SkeletonStatus>
      </div>
    </div>
  );
}
