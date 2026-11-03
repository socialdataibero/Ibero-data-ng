import { useMemo } from 'react';
import { useAuth } from '../../../core/auth/useAuth';
import { useHarmonizerAccess } from '../../../core/hooks/useHarmonizerAccess';
import { SIDE_MENU_ITEMS } from '../../../data/side-menu';
import type { SideMenuItem } from '../side-menu/SideMenu';

export type NavItem = SideMenuItem;

export const NAV_ITEMS: NavItem[] = SIDE_MENU_ITEMS;

/** Menu entries that create or upload harmonizer surveys: only for users who may create one (SDI-91). */
const SURVEY_CREATION_ITEMS = new Set(['harmonizer-new-survey', 'harmonizer-upload']);

function withoutSurveyCreation(items: NavItem[]): NavItem[] {
  return items
    .filter((item) => !SURVEY_CREATION_ITEMS.has(item.id))
    .map((item) => (item.subItems ? { ...item, subItems: withoutSurveyCreation(item.subItems) } : item));
}

export function useAppShell() {
  const { currentUser, loading, logout } = useAuth();
  const { canCreate } = useHarmonizerAccess();
  const navItems = useMemo(() => (canCreate ? NAV_ITEMS : withoutSurveyCreation(NAV_ITEMS)), [canCreate]);

  return { currentUser, loading, logout, navItems };
}
