import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useHarmonizerAccess } from '../../../core/hooks/useHarmonizerAccess';
import { harmonizerService } from '../../../core/services/harmonizer.service';
import { ApiError, errorMessage, fieldErrors } from '../../../core/api/http';
import type { Crumb } from '../../shared/page-header/PageHeader';

const BASE_CRUMBS: Crumb[] = [
  { label: 'Inicio', href: '/dashboard' },
  { label: 'Armonizador', href: '/harmonizer' },
];

export function useHarmonizerNewSurvey() {
  const navigate = useNavigate();
  const { surveyId } = useParams();
  const isEdit = !!surveyId;
  const access = useHarmonizerAccess({ surveyId, loadOrganizations: !isEdit });
  const [organizationId, setOrganizationId] = useState('');
  const canSubmit = !access.loading && !access.error && (isEdit
    ? access.canEdit
    : access.editableOrganizations.some((organization) => organization.id === organizationId));
  const [surveyName, setSurveyName] = useState('');
  const [surveyDescription, setSurveyDescription] = useState('');
  const loading = access.loading;
  const loadError = access.error;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorName, setErrorName] = useState('');

  const crumbs = useMemo<Crumb[]>(
    () => [...BASE_CRUMBS, { label: isEdit ? 'Editar encuesta' : 'Nueva encuesta' }],
    [isEdit],
  );

  useEffect(() => {
    if (!access.survey) return;
    setSurveyName(access.survey.name);
    setSurveyDescription(access.survey.description ?? '');
  }, [access.survey]);

  const submit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      if (!canSubmit || saving) return;
      setErrorName('');
      setError(null);

      const name = surveyName.trim();
      if (!name) {
        setErrorName('El nombre de la encuesta es obligatorio.');
        return;
      }
      if (name.length < 2) {
        setErrorName('El nombre debe tener al menos 2 caracteres.');
        return;
      }

      setSaving(true);

      void (async () => {
        try {
          if (surveyId) {
            await harmonizerService.updateSurvey(surveyId, {
              name,
              description: surveyDescription.trim(),
            });
          } else {
            await harmonizerService.createSurvey(name, organizationId, surveyDescription.trim() || undefined);
            setSurveyName('');
            setSurveyDescription('');
          }
          void navigate('/harmonizer');
        } catch (err) {
          if (err instanceof ApiError && err.body?.code === 'survey_name_taken') {
            setErrorName('Ya existe una encuesta con ese nombre.');
            return;
          }
          const matched = fieldErrors(err, ['name']);
          if (matched.name) {
            setErrorName(matched.name);
          } else {
            setError(
              errorMessage(
                err,
                surveyId ? 'No se pudo guardar la encuesta.' : 'No se pudo crear la encuesta.',
              ),
            );
          }
        } finally {
          setSaving(false);
        }
      })();
    },
    [surveyId, surveyName, surveyDescription, organizationId, canSubmit, saving, navigate],
  );

  return {
    isEdit,
    canSubmit,
    organizationId,
    setOrganizationId,
    organizations: access.editableOrganizations,
    crumbs,
    surveyName,
    setSurveyName,
    surveyDescription,
    setSurveyDescription,
    loading,
    loadError,
    saving,
    error,
    errorName,
    submit,
  };
}
