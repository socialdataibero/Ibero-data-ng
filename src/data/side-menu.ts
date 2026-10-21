import type { SideMenuItem } from '../components/shared/side-menu/SideMenu';

export const SIDE_MENU_ITEMS: SideMenuItem[] = [
  {
    id: 'home',
    label: 'Inicio',
    href: '/dashboard',
    pictogram: 'pictogram-explore',
  },
  {
    id: 'datasets',
    label: 'Conjuntos de datos',
    href: '/datasets',
    pictogram: 'pictogram-layers',
  },
  {
    id: 'organizations',
    label: 'Organizaciones',
    href: '/organizations',
    pictogram: 'pictogram-group',
  },
  {
    id: 'harmonizer',
    label: 'Armonizador',
    pictogram: 'pictogram-collaborate',
    subItems: [
      {
        id: 'harmonizer-surveys',
        label: 'Encuestas',
        href: '/harmonizer',
        pictogram: 'pictogram-layers',
      },
      {
        id: 'harmonizer-new-survey',
        label: 'Nueva encuesta',
        href: '/harmonizer/new-survey',
        pictogram: 'pictogram-add',
      },
      {
        id: 'harmonizer-upload',
        label: 'Subir archivo',
        href: '/harmonizer/upload',
        pictogram: 'pictogram-file-upload',
      },
    ],
  },
  {
    id: 'profile',
    label: 'Configuración de perfil',
    href: '/profile',
    pictogram: 'pictogram-person',
  },
];
