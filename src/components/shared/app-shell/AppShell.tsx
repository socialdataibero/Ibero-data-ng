import { Outlet, useLocation } from 'react-router-dom';
import { AdminMainNav } from '../admin-main-nav';
import { SideMenu } from '../side-menu/SideMenu';
import { useAppShell } from './useAppShell';
import './app-shell.css';

export function AppShell() {
  const { pathname } = useLocation();
  const { currentUser, loading, logout, navItems } = useAppShell();

  return (
    <div className="c-app-shell">
      <a className="go-content-main" href="#main-content">
        Ir a contenido principal
      </a>

      <AdminMainNav
        authenticated={Boolean(currentUser) || loading}
        user={currentUser ? { name: currentUser.fullName } : null}
        onLogout={logout}
      />

      <div className="flex admin-home shell">
        <div className="column-4-desktop column-1-mobile menu-side-bg">
          <SideMenu
            items={navItems}
            pathname={pathname}
            searchPlaceholder='Busca "conjuntos", "análisis"…'
          />
        </div>

        <main
          id="main-content"
          className="column-12-desktop column-7-mobile admin-home__contenido content"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
