import { useAuth } from '../../core/auth/useAuth';
import type { Crumb } from '../shared/page-header/PageHeader';
import type { ProfileFormSubmitData } from './ProfileForm';

export const CRUMBS: Crumb[] = [
  { label: 'Inicio', href: '/dashboard' },
  { label: 'Configuración de perfil' },
];

export function useProfile() {
  const { currentUser, updateFullName, changePassword } = useAuth();

  async function save({ fullName, previousPassword, password }: ProfileFormSubmitData) {
    if (currentUser && fullName !== currentUser.fullName) await updateFullName(fullName);
    if (password) await changePassword(previousPassword, password);
  }

  return { currentUser, save };
}
