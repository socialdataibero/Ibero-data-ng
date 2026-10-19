import { Icon } from '../icon/Icon';
import './paginator.css';

export interface PaginatorProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

// Con hasta este número de páginas se muestran todas; con más, solo la primera, la
// última y las cercanas a la actual, con «…» en los huecos (SDI-93: una vista
// armonizada puede tener miles de páginas).
const MAX_FULL_PAGES = 9;
const NEIGHBORS = 2;

type PageItem = number | 'gap-start' | 'gap-end';

function pageItems(page: number, totalPages: number): PageItem[] {
  if (totalPages <= MAX_FULL_PAGES) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const shown = new Set([1, totalPages]);
  for (let p = page - NEIGHBORS; p <= page + NEIGHBORS; p++) {
    if (p >= 1 && p <= totalPages) shown.add(p);
  }
  const sorted = [...shown].sort((a, b) => a - b);
  const items: PageItem[] = [];
  sorted.forEach((p, i) => {
    const previous = sorted[i - 1];
    if (previous !== undefined && p - previous === 2) items.push(p - 1);
    else if (previous !== undefined && p - previous > 2) {
      items.push(p < page ? 'gap-start' : 'gap-end');
    }
    items.push(p);
  });
  return items;
}

export function Paginator({ page, totalPages, onChange }: PaginatorProps) {
  if (totalPages <= 1) return null;

  const items = pageItems(page, totalPages);

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
        {items.map((number) =>
          typeof number === 'string' ? (
            <li key={number} aria-hidden="true">
              <span className="paginator__gap">…</span>
            </li>
          ) : (
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
          ),
        )}
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
