import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { SearchField } from 'sectei-library';
import { filterSideMenuItems, flattenSideMenuItems } from './filterSideMenuItems';
import './side-menu.css';

export interface SideMenuItem {
  id: string;
  label: string;
  href?: string;
  pictogram?: string;
  subItems?: SideMenuItem[];
}

export interface SideMenuProps {
  items?: SideMenuItem[];
  pathname?: string;
  searchPlaceholder?: string;
  ariaLabel?: string;
  children?: ReactNode;
  className?: string;
}

function menuOpenInitially() {
  if (typeof window === 'undefined') return true;
  return window.innerWidth >= 768;
}

function itemContainsActive(item: SideMenuItem, pathname: string): boolean {
  if (item.href) {
    if (pathname === item.href) return true;
    if (pathname.startsWith(`${item.href}/`)) return true;
  }
  return (item.subItems ?? []).some((child) => itemContainsActive(child, pathname));
}

export function SideMenu({
  items = [],
  pathname = '',
  searchPlaceholder = 'Buscar…',
  ariaLabel = 'Menú secundario',
  children = null,
  className = '',
}: SideMenuProps) {
  const idBase = useId();
  const containerId = `${idBase}-menu-side`;
  const [menuOpen, setMenuOpen] = useState(menuOpenInitially);
  const searchCatalog = useMemo(() => flattenSideMenuItems(items), [items]);
  const [matches, setMatches] = useState<SideMenuItem[] | null>(null);
  const isSearching = matches !== null && matches !== searchCatalog;
  const filtered = matches === null ? items : filterSideMenuItems(items, matches);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const item of items) {
      if (item.subItems?.length) {
        initial[item.id] = itemContainsActive(item, pathname);
      }
    }
    return initial;
  });

  useEffect(() => {
    setMatches(null);
  }, [searchCatalog]);

  useEffect(() => {
    setOpenSections((prev) => {
      const next = { ...prev };
      for (const item of items) {
        if (item.subItems?.length && itemContainsActive(item, pathname)) {
          next[item.id] = true;
        }
      }
      return next;
    });
  }, [pathname, items]);

  function toggleSection(sectionId: string) {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }

  const tabMenu = menuOpen ? undefined : -1;
  const classes = ['menu-side', menuOpen ? 'open' : '', className].filter(Boolean).join(' ');

  return (
    <nav className={classes} aria-label={ariaLabel}>
      <button
        type="button"
        className="menu-side-button"
        aria-label="Navegación secundaria"
        aria-controls={containerId}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        <span className="pictogram-angle-right" aria-hidden="true" />
      </button>

      <div id={containerId} className="menu-side-container" aria-hidden={!menuOpen}>
        {!children ? (
          <div className="menu-side-search">
            <SearchField
              catalog={searchCatalog}
              searchProperty="label"
              placeholder={searchPlaceholder}
              onFilter={(next) => setMatches(next as SideMenuItem[])}
            />
          </div>
        ) : null}

        {children ?? (
          <ul>
            {filtered.length === 0 ? (
              <li className="menu-side-empty">
                <span className="text-color-secondary">Sin resultados</span>
              </li>
            ) : null}

            {filtered.map((item) => {
              if (item.subItems?.length) {
                const sectionOpen = isSearching || Boolean(openSections[item.id]);
                const panelId = `${idBase}-collapsible-${item.id}`;

                return (
                  <li key={item.id}>
                    <div className={sectionOpen ? 'collapsible open' : 'collapsible'}>
                      <button
                        type="button"
                        className="collapsible-button"
                        aria-controls={panelId}
                        aria-expanded={sectionOpen}
                        tabIndex={tabMenu}
                        onClick={() => toggleSection(item.id)}
                      >
                        <span className="c-side-menu__section-label">
                          {item.pictogram ? (
                            <span className={item.pictogram} aria-hidden="true" />
                          ) : null}
                          <span>{item.label}</span>
                        </span>
                        <span className="pictogram-angle-right" aria-hidden="true" />
                      </button>

                      <div
                        id={panelId}
                        className="collapsible-container"
                        aria-hidden={!sectionOpen}
                      >
                        <ul>
                          {item.subItems.map((child) => {
                            const tabItem = menuOpen && sectionOpen ? undefined : -1;

                            return (
                              <li key={child.id}>
                                <NavLink
                                  to={child.href ?? '#'}
                                  end
                                  tabIndex={tabItem}
                                  className={({ isActive }) =>
                                    isActive ? 'link-active' : undefined
                                  }
                                >
                                  {child.pictogram ? (
                                    <span className={child.pictogram} aria-hidden="true" />
                                  ) : null}
                                  {child.label}
                                </NavLink>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </li>
                );
              }

              return (
                <li key={item.id}>
                  <NavLink
                    to={item.href ?? '#'}
                    end={item.href === '/dashboard'}
                    tabIndex={tabMenu}
                    className={({ isActive }) => (isActive ? 'link-active' : undefined)}
                  >
                    {item.pictogram ? (
                      <span className={item.pictogram} aria-hidden="true" />
                    ) : null}
                    {item.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </nav>
  );
}
