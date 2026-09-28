import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { organizationsService } from '../../core/services/organizations.service';
import { errorMessage, fieldErrors } from '../../core/api/http';
import { isValidSlug } from '../../core/utils/validation';

export function useOrganizationCreate() {
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');

  const [errorName, setErrorName] = useState('');
  const [errorSlug, setErrorSlug] = useState('');

  const validate = (): boolean => {
    let ok = true;

    if (!name.trim()) {
      setErrorName('El nombre es obligatorio.');
      ok = false;
    }

    if (!slug.trim()) {
      setErrorSlug('La URL de la organización es obligatoria.');
      ok = false;
    } else if (!isValidSlug(slug)) {
      setErrorSlug('Solo se permiten minúsculas, números y guiones.');
      ok = false;
    }

    return ok;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorName('');
    setErrorSlug('');
    setError(null);

    if (!validate()) return;

    setSaving(true);
    try {
      const organization = await organizationsService.create(
        name.trim(),
        slug,
        description.trim() || undefined,
      );
      navigate(`/organizations/${organization.id}`);
    } catch (err) {
      const matched = fieldErrors(err, ['name', 'slug']);
      if (matched.name) setErrorName(matched.name);
      if (matched.slug) setErrorSlug(matched.slug);

      if (Object.keys(matched).length === 0) {
        if (errorMessage(err, '').toLowerCase().includes('slug')) {
          setErrorSlug('Ese identificador ya está en uso; prueba con otro.');
        } else {
          setError(errorMessage(err, 'No se pudo crear la organización.'));
        }
      }
    } finally {
      setSaving(false);
    }
  };

  return {
    saving,
    error,
    fields: {
      name,
      setName,
      slug,
      setSlug,
      description,
      setDescription,
    },
    fieldErrors: {
      name: errorName,
      slug: errorSlug,
    },
    submit,
  };
}
