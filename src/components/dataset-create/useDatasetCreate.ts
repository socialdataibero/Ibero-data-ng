import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { datasetsService } from '../../core/services/datasets.service';
import { organizationsService } from '../../core/services/organizations.service';
import { ApiError, errorMessage, fieldErrors, isNotFound } from '../../core/api/http';
import { isValidSlug, isValidUrl, isValidYear, looksLikeUrl } from '../../core/utils/validation';
import type {
  Dataset,
  DatasetVisibility,
  PeriodType,
  Survey,
} from '../../core/models/dataset.model';

export function useDatasetCreate() {
  const { organizationId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [checkingOrganization, setCheckingOrganization] = useState(true);
  const [organizationNotFound, setOrganizationNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revisionOf, setRevisionOf] = useState<Dataset | null>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<DatasetVisibility>('PRIVATE');
  const [survey, setSurvey] = useState<Survey | ''>('');
  const [year, setYear] = useState('');
  const [periodType, setPeriodType] = useState<PeriodType | ''>('');
  const [sourceOrg, setSourceOrg] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [licenseId, setLicenseId] = useState('');
  const [changelog, setChangelog] = useState('');

  const [errorTitle, setErrorTitle] = useState('');
  const [errorSlug, setErrorSlug] = useState('');
  const [errorYear, setErrorYear] = useState('');
  const [errorSourceUrl, setErrorSourceUrl] = useState('');

  useEffect(() => {
    let active = true;
    setCheckingOrganization(true);
    setOrganizationNotFound(false);
    organizationsService
      .get(organizationId)
      .catch((err: unknown) => {
        if (active && isNotFound(err)) setOrganizationNotFound(true);
      })
      .finally(() => {
        if (active) setCheckingOrganization(false);
      });
    return () => {
      active = false;
    };
  }, [organizationId]);

  useEffect(() => {
    const revisionOfId = searchParams.get('revisionOf');
    if (!revisionOfId) return;
    let active = true;
    (async () => {
      const original = await datasetsService.get(organizationId, revisionOfId);
      if (!active) return;
      setRevisionOf(original);
      setTitle(`${original.title} (revisión)`);
    })();
    return () => {
      active = false;
    };
  }, [organizationId, searchParams]);

  const validate = (): boolean => {
    let ok = true;

    if (!title.trim()) {
      setErrorTitle('El título es obligatorio.');
      ok = false;
    }

    if (!slug.trim()) {
      setErrorSlug('El identificador del dataset es obligatorio.');
      ok = false;
    } else if (looksLikeUrl(slug)) {
      setErrorSlug(
        'Esto parece una URL. Si es el enlace a los datos, pégalo en «URL de la fuente original» y aquí escribe un nombre corto (ej. enigh-2024-v1).',
      );
      ok = false;
    } else if (!isValidSlug(slug)) {
      setErrorSlug('Solo se permiten minúsculas, números y guiones.');
      ok = false;
    }

    if (year.trim() && !isValidYear(year.trim(), 1990, 2099)) {
      setErrorYear('Ingresa un año válido entre 1990 y 2099.');
      ok = false;
    }

    if (sourceUrl.trim() && !isValidUrl(sourceUrl.trim())) {
      setErrorSourceUrl('Ingresa una URL válida (ej: https://…).');
      ok = false;
    }

    return ok;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorTitle('');
    setErrorSlug('');
    setErrorYear('');
    setErrorSourceUrl('');
    setError(null);

    if (!validate()) return;

    setSaving(true);
    try {
      const tags = tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const dataset = await datasetsService.create(organizationId, {
        title,
        slug,
        description: description || undefined,
        visibility,
        survey: survey || undefined,
        year: year ? Number(year) : undefined,
        periodType: periodType || undefined,
        sourceOrg: sourceOrg || undefined,
        sourceUrl: sourceUrl || undefined,
        tags: tags.length > 0 ? tags : undefined,
        licenseId: licenseId || undefined,
        revisionOfId: revisionOf?.id,
        changelog: changelog || undefined,
      });
      navigate(`/organizations/${organizationId}/datasets/${dataset.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.body?.code === 'organization_not_found') {
        setOrganizationNotFound(true);
        return;
      }
      const matched = fieldErrors(err, ['title', 'slug', 'year', 'sourceUrl']);
      if (matched.title) setErrorTitle(matched.title);
      if (matched.slug) setErrorSlug(matched.slug);
      if (matched.year) setErrorYear(matched.year);
      if (matched.sourceUrl) setErrorSourceUrl(matched.sourceUrl);

      if (Object.keys(matched).length === 0) {
        if (errorMessage(err, '').toLowerCase().includes('slug')) {
          setErrorSlug('Ese identificador ya está en uso; prueba con otro.');
        } else {
          setError(errorMessage(err, 'No se pudo crear el dataset.'));
        }
      }
    } finally {
      setSaving(false);
    }
  };

  return {
    organizationId,
    checkingOrganization,
    organizationNotFound,
    saving,
    error,
    revisionOf,
    fields: {
      title,
      setTitle,
      slug,
      setSlug,
      description,
      setDescription,
      visibility,
      setVisibility,
      survey,
      setSurvey,
      year,
      setYear,
      periodType,
      setPeriodType,
      sourceOrg,
      setSourceOrg,
      sourceUrl,
      setSourceUrl,
      tagsText,
      setTagsText,
      licenseId,
      setLicenseId,
      changelog,
      setChangelog,
    },
    fieldErrors: {
      title: errorTitle,
      slug: errorSlug,
      year: errorYear,
      sourceUrl: errorSourceUrl,
    },
    submit,
  };
}
