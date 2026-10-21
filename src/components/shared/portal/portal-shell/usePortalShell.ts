import { useLocation } from 'react-router-dom';

const LINKS = [
  { id: 'home', label: 'Inicio', href: '/' },
  { id: 'data', label: 'Datos', href: '/data' },
  { id: 'topics', label: 'Temas', href: '/topics' },
];

export function usePortalShell() {
  const { pathname } = useLocation();
  const active = LINKS.find((e) => e.href === pathname)?.id ?? 'home';
  const activeSection = LINKS.find((e) => e.id === active)?.label ?? '';

  return { links: LINKS, active, activeSection };
}
