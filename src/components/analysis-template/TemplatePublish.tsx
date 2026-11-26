import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'sectei-library';
import { analysisTemplatesService } from '../../core/services/analysis-templates.service';
import { errorMessage, fieldErrors } from '../../core/api/http';
import { isValidSlug } from '../../core/utils/validation';
import type { DatasetVisibility } from '../../core/models/dataset.model';
import type { Analysis } from '../../core/models/analysis.model';
import type { TemplateRequest, TemplateResult } from '../../core/models/analysis-template.model';

function toSlug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

interface Props {
  organizationId: string;
  datasetId: string;
  datasetHref: string;
  request: TemplateRequest;
  result: TemplateResult;
}

/** Saves the shown template result as an analysis of the dataset, so it appears with the others. */
export function TemplatePublish({ organizationId, datasetId, datasetHref, request, result }: Props) {
  const [title, setTitle] = useState(result.texts.title);
  const [slug, setSlug] = useState(() => toSlug(result.texts.title));
  const [slugTouched, setSlugTouched] = useState(false);
  const [folder, setFolder] = useState('plantillas');
  const [description, setDescription] = useState(result.texts.question);
  const [visibility, setVisibility] = useState<DatasetVisibility>('PUBLIC');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState<Analysis | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (title.trim().length < 2) next.title = 'El título debe tener al menos 2 caracteres.';
    if (!slug.trim()) next.slug = 'El slug es obligatorio.';
    else if (!isValidSlug(slug)) next.slug = 'Usa solo minúsculas, números y guiones.';
    if (!folder.trim()) next.folder = 'La carpeta es obligatoria.';
    setErrors(next);
    setError(null);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    analysisTemplatesService
      .publish(organizationId, datasetId, request, {
        title: title.trim(),
        slug,
        folder: folder.trim(),
        description: description.trim() || undefined,
        visibility,
      })
      .then(setPublished)
      .catch((err: unknown) => {
        const matched = fieldErrors(err, ['title', 'slug', 'folder']);
        if (Object.keys(matched).length > 0) setErrors(matched);
        else setError(errorMessage(err, 'No se pudo publicar el análisis.'));
      })
      .finally(() => setSaving(false));
  };

  if (published) {
    return (
      <div className="c-analysis-template__publish" role="status">
        <h3 className="c-analysis-template__subtitle">Resultados publicados</h3>
        <p>
          «{published.title}» ya está en los análisis del conjunto de datos
          {published.visibility === 'PUBLIC' ? ' y es público.' : ' como privado.'}{' '}
          <Link to={datasetHref}>Ver el conjunto de datos</Link>
        </p>
      </div>
    );
  }

  const field = (id: string, label: string, input: React.ReactNode, key?: string) => (
    <div className="c-analysis-template__publish-field">
      <label htmlFor={id}>{label}</label>
      {input}
      {key && errors[key] ? (
        <p id={`${id}-error`} className="c-analysis-template__error" role="alert">
          {errors[key]}
        </p>
      ) : null}
    </div>
  );

  return (
    <form className="c-analysis-template__publish" onSubmit={submit} noValidate>
      <h3 className="c-analysis-template__subtitle">Publicar resultados</h3>
      <p className="c-analysis-template__help">
        Guarda esta tabla como un análisis del conjunto de datos. Se vuelve a calcular en el servidor con las mismas
        variables.
      </p>
      <fieldset disabled={saving}>
        {field(
          'publish-title',
          'Título *',
          <input
            id="publish-title"
            value={title}
            aria-invalid={!!errors.title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(toSlug(e.target.value));
            }}
          />,
          'title',
        )}
        {field(
          'publish-slug',
          'Slug *',
          <input
            id="publish-slug"
            value={slug}
            aria-invalid={!!errors.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
          />,
          'slug',
        )}
        {field(
          'publish-folder',
          'Carpeta *',
          <input id="publish-folder" value={folder} aria-invalid={!!errors.folder} onChange={(e) => setFolder(e.target.value)} />,
          'folder',
        )}
        {field(
          'publish-description',
          'Descripción',
          <textarea id="publish-description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />,
        )}
        {field(
          'publish-visibility',
          'Visibilidad',
          <select
            id="publish-visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as DatasetVisibility)}
          >
            <option value="PUBLIC">Público</option>
            <option value="PRIVATE">Privado</option>
          </select>,
        )}
      </fieldset>
      {error ? (
        <p className="c-analysis-template__error" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" icon="pictogram-upload" disabled={saving}>
        {saving ? 'Publicando…' : 'Publicar'}
      </Button>
    </form>
  );
}
