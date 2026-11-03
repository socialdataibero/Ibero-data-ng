import type { SideMenuItem } from './SideMenu';

export function flattenSideMenuItems(items: SideMenuItem[]): SideMenuItem[] {
  return items.flatMap((item) => [item, ...flattenSideMenuItems(item.subItems ?? [])]);
}

export function filterSideMenuItems(
  items: SideMenuItem[],
  matches: SideMenuItem[],
): SideMenuItem[] {
  const matchingIds = new Set(matches.map((item) => item.id));

  function filterItems(entries: SideMenuItem[]): SideMenuItem[] {
    return entries.flatMap((item) => {
      if (matchingIds.has(item.id)) return [item];

      const subItems = filterItems(item.subItems ?? []);
      return subItems.length > 0 ? [{ ...item, subItems }] : [];
    });
  }

  return filterItems(items);
}
