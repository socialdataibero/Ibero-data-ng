import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  const [surveyName, setSurveyName] = useState('');
  const [surveyDescription, setSurveyDescription] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorName, setErrorName] = useState('');

  const crumbs = useMemo<Crumb[]>(
    () => [...BASE_CRUMBS, { label: isEdit ? 'Editar encuesta' : 'Nueva encuesta' }],
    [isEdit],
  );

  useEffect(() => {
    if (!surveyId) return;
    let active = true;
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const survey = await harmonizerService.getSurvey(surveyId, controller.signal);
        if (!active) return;
        setSurveyName(survey.name);
        setSurveyDescription(survey.description ?? '');
      } catch (err) {
        if (!active) return;
        setLoadError(errorMessage(err, 'No se pudo cargar la encuesta.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [surveyId]);

  const submit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
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
            await harmonizerService.createSurvey(name, surveyDescription.trim() || undefined);
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
    [surveyId, surveyName, surveyDescription, navigate],
  );

  return {
    isEdit,
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
