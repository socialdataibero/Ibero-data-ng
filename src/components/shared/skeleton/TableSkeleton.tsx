import { Skeleton } from './Skeleton';

export interface TableSkeletonProps {
  headers?: string[];
  columns?: number;
  rows?: number;
}

export function TableSkeleton({
  headers,
  columns = headers?.length ?? 4,
  rows = 5,
}: TableSkeletonProps) {
  const cells = Array.from({ length: columns }, (_, index) => index);

  return (
    <div className="container-table" aria-hidden="true">
      <table className="table-condensed">
        <thead>
          <tr>
            {cells.map((index) => (
              <th key={index} scope="col">
                {headers?.[index] ?? <Skeleton width="60%" height="0.875rem" />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, row) => (
            <tr key={row}>
              {cells.map((index) => (
                <td key={index}>
                  <Skeleton width={index === 0 ? '80%' : '60%'} height="0.875rem" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
