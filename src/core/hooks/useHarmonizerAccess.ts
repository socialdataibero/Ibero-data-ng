import { useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { errorMessage } from '../api/http';
import type { HarmonizerSurveyDetails } from '../models/harmonizer.model';
import type { OrganizationMembership } from '../models/user.model';
import { harmonizerService } from '../services/harmonizer.service';
import { organizationsService } from '../services/organizations.service';
import { canEditSurvey } from '../utils/survey-permissions';

type OrganizationOption = OrganizationMembership['organization'];

export function useHarmonizerAccess({
  surveyId,
  loadOrganizations = false,
}: { surveyId?: string; loadOrganizations?: boolean } = {}) {
  const { currentUser } = useAuth();
  const [access, setAccess] = useState<{
    userId: string;
    memberships: OrganizationMembership[];
    organizations: OrganizationOption[];
    error: string | null;
  } | null>(null);
  const [survey, setSurvey] = useState<HarmonizerSurveyDetails | null>(null);
  const [surveyError, setSurveyError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const user = currentUser;
    let active = true;
    const controller = new AbortController();
    setAccess(null);
    void (async () => {
      try {
        const memberships = user.isSysadmin
          ? []
          : await organizationsService.myMemberships(controller.signal);
        const organizations: OrganizationOption[] = [];
        if (user.isSysadmin && loadOrganizations) {
          // Read every page so the selector also includes organizations beyond the first 200.
          let total = Infinity;
          while (organizations.length < total) {
            const page = await organizationsService.listPaged(
              { limit: 200, offset: organizations.length },
              controller.signal,
            );
            organizations.push(...page.items);
            total = page.total;
            if (page.items.length === 0) break;
          }
        } else {
          organizations.push(...memberships.map(({ organization }) => organization));
        }
        if (active) setAccess({ userId: user.id, memberships, organizations, error: null });
      } catch (err) {
        if (active)
          setAccess({
            userId: user.id,
            memberships: [],
            organizations: [],
            error: errorMessage(err, 'No se pudieron cargar los permisos de las organizaciones.'),
          });
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [currentUser, loadOrganizations]);

  useEffect(() => {
    setSurvey(null);
    setSurveyError(null);
    if (!surveyId) return;
    let active = true;
    const controller = new AbortController();
    void harmonizerService
      .getSurvey(surveyId, controller.signal)
      .then((result) => {
        if (active) setSurvey(result);
      })
      .catch((err: unknown) => {
        if (active)
          setSurveyError(errorMessage(err, 'No se pudieron cargar los permisos de la encuesta.'));
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [surveyId]);

  const loaded = !!currentUser && access?.userId === currentUser.id;
  const memberships = loaded ? access.memberships : [];
  const organizations = loaded ? access.organizations : [];
  const isSurveyEditable = (target: Pick<HarmonizerSurveyDetails, 'organizationId'> | null) =>
    canEditSurvey(currentUser, memberships, target);
  const editableOrganizations = organizations.filter((organization) =>
    isSurveyEditable({ organizationId: organization.id }),
  );
  const selectedSurvey = survey?.id === surveyId ? survey : null;
  const canEdit = isSurveyEditable(selectedSurvey);
  const loading = !loaded || (!!surveyId && !selectedSurvey && !surveyError);
  const error = (loaded ? access.error : null) ?? surveyError;

  return {
    survey: selectedSurvey,
    canEdit,
    isSurveyEditable,
    canCreate: !!currentUser?.isSysadmin || editableOrganizations.length > 0,
    organizations,
    editableOrganizations,
    loading,
    error,
    readOnlyMessage: loading
      ? 'Comprobando permisos…'
      : (error ??
        (canEdit ? null : 'Solo lectura. No tienes permiso para modificar esta encuesta.')),
  };
}
