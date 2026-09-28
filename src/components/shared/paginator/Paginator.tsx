import { Icon } from '../icon/Icon';
import './paginator.css';

export interface PaginatorProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Paginator({ page, totalPages, onChange }: PaginatorProps) {
  if (totalPages <= 1) return null;

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav className="paginator c-paginator" aria-label="Paginación">
      <button
        type="button"
        className="paginator__control"
        aria-label="Página anterior"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <Icon name="chevron-left" size={16} />
      </button>

      <ul className="paginator__list">
        {pageNumbers.map((number) => (
          <li key={number}>
            <button
              type="button"
              className={`paginator__page${number === page ? ' paginator__page--current' : ''}`}
              aria-label={`Página ${number}`}
              aria-current={number === page ? 'page' : undefined}
              onClick={() => onChange(number)}
            >
              {number}
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="paginator__control"
        aria-label="Página siguiente"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        <Icon name="chevron-right" size={16} />
      </button>
    </nav>
  );
}
