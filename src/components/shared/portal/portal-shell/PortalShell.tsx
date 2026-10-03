import { Outlet, Link } from 'react-router-dom';
import { MainNav } from 'sectei-library';
import { AccessibilityMenu } from '../../accessibility-menu/AccessibilityMenu';
import logoCdmx from '../../../../assets/logo-cdmx-2024.svg';
import { BuildInfo } from '../../build-info/BuildInfo';
import { usePortalShell } from './usePortalShell';
import './portal-shell.css';

export function PortalShell() {
  const { links, active, activeSection } = usePortalShell();

  return (
    <div className="c-portal-shell">
      <a className="go-content-main" href="#main-content">
        Ir a contenido principal
      </a>
      <AccessibilityMenu />

      <MainNav
        navInfo={`Sección: <b>${activeSection}</b>`}
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
          </div>
        }
      >
        {({ closeMenuAndSubmenu }: { closeMenuAndSubmenu: () => void }) => (
          <ul className="nav-menu">
            {links.map((link, index) => (
              <li key={link.id}>
                <Link
                  to={link.href}
                  className={['nav-hyperlink', active === link.id ? 'active' : '']
                    .filter(Boolean)
                    .join(' ')}
                  aria-current={active === link.id ? 'page' : undefined}
                  onClick={() => closeMenuAndSubmenu()}
                  {...(index === 0 ? { 'data-exact': true } : {})}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </MainNav>

      <Outlet />

      <BuildInfo />
    </div>
  );
}
