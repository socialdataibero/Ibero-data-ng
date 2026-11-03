import type { HarmonizerSurveyDetails } from '../models/harmonizer.model';
import type { OrganizationMembership, User } from '../models/user.model';

export function canEditSurvey(
  user: User | null,
  memberships: OrganizationMembership[],
  survey: Pick<HarmonizerSurveyDetails, 'organizationId'> | null,
): boolean {
  if (!user || !survey) return false;
  if (user.isSysadmin) return true;
  return (
    survey.organizationId !== null &&
    memberships.some(
      ({ organization, role }) =>
        organization.id === survey.organizationId && (role === 'ADMIN' || role === 'EDITOR'),
    )
  );
}
