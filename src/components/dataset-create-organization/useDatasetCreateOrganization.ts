import { useEffect, useState } from 'react';
import { useAuth } from '../../core/auth/useAuth';
import { organizationsService } from '../../core/services/organizations.service';

export interface OrganizationOption {
  id: string;
  name: string;
}

/** Roles that may create datasets in an organization (the server checks the same: ADMIN or EDITOR). */
const CREATOR_ROLES = new Set(['ADMIN', 'EDITOR']);

/** Organizations where the signed-in user may add a dataset: all of them for the sysadmin. */
export function useDatasetCreateOrganization() {
  const { currentUser } = useAuth();
  const [options, setOptions] = useState<OrganizationOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    const load = currentUser.isSysadmin
      ? organizationsService.list().then((orgs) => orgs.map(({ id, name }) => ({ id, name })))
      : organizationsService
          .myMemberships()
          .then((memberships) =>
            memberships.filter((m) => CREATOR_ROLES.has(m.role)).map((m) => m.organization),
          );
    load
      .then((next) => active && setOptions(next.map(({ id, name }) => ({ id, name }))))
      .catch(() => active && setError('No se pudieron cargar tus organizaciones.'));
    return () => {
      active = false;
    };
  }, [currentUser]);

  return { options, error };
}
