import { Skeleton } from '../skeleton/Skeleton';
import { TableSkeleton } from '../skeleton/TableSkeleton';
import './survey-module.css';

export function SurveyModuleSkeleton() {
  return (
    <section className="survey-module" aria-hidden="true">
      <header className="survey-module__heading">
        <Skeleton width="14rem" height="1.5rem" />
        <Skeleton width="12rem" height="1rem" />
      </header>
      <div className="survey-module__content">
        <TableSkeleton headers={['Nombre', 'Año', 'No. filas', 'Mapeo', 'Acciones']} rows={2} />
      </div>
    </section>
  );
}
