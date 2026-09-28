import { PageHeaderSkeleton } from '../../shared/page-header/PageHeaderSkeleton';
import { Skeleton } from '../../shared/skeleton/Skeleton';
import './harmonizer-mapping.css';

const ROWS = 6;

export function HarmonizerMappingContentSkeleton() {
  return (
    <div role="status" aria-busy="true">
      <span className="a11y-sr-only">Cargando mapeo…</span>

      <Skeleton height="1rem" className="m-b-1" />
      <Skeleton width="70%" height="1rem" className="m-b-3" />

      <div className="c-harmonizer-mapping__summary m-b-3">
        <Skeleton width="10rem" height="1.75rem" />
        <Skeleton width="8rem" height="2rem" />
      </div>

      <div className="container-table" aria-hidden="true">
        <table className="table-condensed">
          <thead>
            <tr>
              <th scope="col">Columna del CSV</th>
              <th scope="col">Variable canónica</th>
              <th scope="col">Sugerencia</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS }, (_, index) => (
              <tr key={index}>
                <td>
                  <Skeleton width="7rem" height="1rem" />
                </td>
                <td>
                  <Skeleton height="2.5rem" />
                </td>
                <td>
                  <Skeleton width="9rem" height="1.5rem" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="c-harmonizer-mapping__actions">
        <Skeleton width="9rem" height="2.5rem" />
        <Skeleton width="10rem" height="2.5rem" />
      </div>
    </div>
  );
}

export function HarmonizerMappingSkeleton() {
  return (
    <div className="c-harmonizer-mapping">
      <PageHeaderSkeleton />
      <div className="container width-fixed c-harmonizer-mapping__body">
        <HarmonizerMappingContentSkeleton />
      </div>
    </div>
  );
}
