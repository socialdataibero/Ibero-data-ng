import { PageHeaderSkeleton } from '../../shared/page-header/PageHeaderSkeleton';
import { SkeletonStatus } from '../../shared/skeleton/SkeletonStatus';
import { TableSkeleton } from '../../shared/skeleton/TableSkeleton';
import './harmonizer-codebooks.css';

export function HarmonizerCodebooksSkeleton() {
  return (
    <div className="c-harmonizer-codebooks">
      <PageHeaderSkeleton />
      <div className="container width-fixed c-harmonizer-codebooks__body">
        <SkeletonStatus label="Cargando diccionarios…">
          <TableSkeleton headers={['Nombre', 'Tablas', 'Ediciones que lo usan', 'Acciones']} rows={3} />
        </SkeletonStatus>
      </div>
    </div>
  );
}
