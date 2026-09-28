import { useAuth } from '../../../core/auth/useAuth';
import { SIDE_MENU_ITEMS } from '../../../data/side-menu';
import type { SideMenuItem } from '../side-menu/SideMenu';

export type NavItem = SideMenuItem;

export const NAV_ITEMS: NavItem[] = SIDE_MENU_ITEMS;

export function useAppShell() {
  const { currentUser, loading, logout } = useAuth();

  return { currentUser, loading, logout, navItems: NAV_ITEMS };
}
