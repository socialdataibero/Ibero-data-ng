import { useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth';
import type { OrgRole } from '../models/user.model';
import { organizationsService } from '../services/organizations.service';

/**
 * What the signed-in user may do in one organization, mirroring the server's role checks:
 * ADMIN and EDITOR edit content, only ADMIN deletes it, and the sysadmin can do both.
 * Both flags stay false until the role is known, so actions never flash for read-only users.
 */
export function useOrganizationRole(organizationId: string | undefined) {
  const { currentUser } = useAuth();
  const [role, setRole] = useState<OrgRole | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRole(null);
    setReady(false);
    if (!currentUser || !organizationId) return;
    if (currentUser.isSysadmin) {
      setReady(true);
      return;
    }
    const controller = new AbortController();
    organizationsService
      .myMemberships(controller.signal)
      .then((memberships) => {
        setRole(memberships.find((m) => m.organization.id === organizationId)?.role ?? null);
        setReady(true);
      })
      .catch(() => {
        if (!controller.signal.aborted) setReady(true);
      });
    return () => controller.abort();
  }, [currentUser, organizationId]);

  const isSysadmin = Boolean(currentUser?.isSysadmin);
  return {
    ready,
    canEdit: ready && (isSysadmin || role === 'ADMIN' || role === 'EDITOR'),
    canDelete: ready && (isSysadmin || role === 'ADMIN'),
  };
}
