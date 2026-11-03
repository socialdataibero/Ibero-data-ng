import { Button, MainNav } from 'sectei-library';
import logoCdmx from '../../../assets/logo-cdmx-2024.svg';
import './admin-main-nav.css';

export interface AdminMainNavUser {
  name: string;
  photoSrc?: string;
  photoAlt?: string;
}

export interface AdminMainNavProps {
  authenticated?: boolean;
  user?: AdminMainNavUser | null;
  loginHref?: string;
  onLogin?: () => void;
  onLogout?: () => void;
}

function initialsFrom(name = ''): string {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function AdminMainNav({
  authenticated,
  user = null,
  loginHref = '/login',
  onLogin,
  onLogout,
}: AdminMainNavProps) {
  const sessionActive = authenticated ?? Boolean(user?.name);
  const name = user?.name ?? '';
  const photoSrc = user?.photoSrc;

  return (
    <MainNav
      className="admin-main-nav"
      identity={
        <div className="nav-identidad">
          <a
            href="https://www.cdmx.gob.mx/"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-hyperlink-logo"
          >
            <img
              className="nav-logo color-invert"
              src={logoCdmx}
              alt="Ciudad de México. Capital de la Transformación."
              width={140}
              height={32}
            />
          </a>
          <span className="admin-main-nav__brand">Ibero Data MX</span>
        </div>
      }
    >
      {({ closeMenuAndSubmenu }: { closeMenuAndSubmenu: () => void }) =>
        sessionActive ? (
          <ul className="nav-menu admin-main-nav__actions">
            <li>
              <div
                className="admin-main-nav__profile"
                aria-label={`Sesión iniciada como ${name}`}
              >
                <span className="admin-main-nav__avatar" aria-hidden="true">
                  {photoSrc ? (
                    <img src={photoSrc} alt="" width={32} height={32} />
                  ) : (
                    <span className="admin-main-nav__initials">{initialsFrom(name)}</span>
                  )}
                </span>
                <span className="admin-main-nav__name">{name}</span>
              </div>
            </li>
            {onLogout ? (
              <li>
                <Button
                  type="button"
                  variant="bare-primary"
                  size="small"
                  iconOnly
                  icon="pictogram-close-session"
                  aria-label="Cerrar sesión"
                  onClick={() => {
                    onLogout();
                    closeMenuAndSubmenu();
                  }}
                >
                  Cerrar sesión
                </Button>
              </li>
            ) : null}
          </ul>
        ) : (
          <ul className="nav-menu admin-main-nav__actions">
            <li>
              <Button
                type="button"
                variant="secondary"
                size="small"
                href={onLogin ? undefined : loginHref}
                onClick={() => {
                  onLogin?.();
                  closeMenuAndSubmenu();
                }}
              >
                Iniciar sesión
              </Button>
            </li>
          </ul>
        )
      }
    </MainNav>
  );
}
