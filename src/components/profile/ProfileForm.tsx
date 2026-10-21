import { useId, useState, type FormEvent } from 'react';
import { Button } from 'sectei-library';
import { ApiError, errorMessage } from '../../core/api/http';
import './profile-form.css';

export interface ProfileFormSubmitData {
  fullName: string;
  previousPassword: string;
  password: string;
}

export interface ProfileFormProps {
  fullName: string;
  email: string;
  onUpdate: (data: ProfileFormSubmitData) => Promise<void>;
  className?: string;
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  error?: string;
}) {
  const errorId = `${id}-error`;
  return (
    <div className="profile-form__field">
      <label htmlFor={id}>{label}</label>
      <div className="profile-form__password">
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          autoComplete="new-password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
        />
        <Button
          type="button"
          variant="bare-secondary"
          size="small"
          iconOnly
          icon={visible ? 'pictogram-eye-hide' : 'pictogram-eye-view'}
          className="profile-form__password-toggle"
          aria-pressed={visible}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          onClick={onToggle}
        >
          {visible ? 'Ocultar' : 'Mostrar'}
        </Button>
      </div>
      {error ? (
        <p id={errorId} className="profile-form__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ProfileForm({ fullName: savedFullName, email, onUpdate, className = '' }: ProfileFormProps) {
  const baseId = useId();

  const [fullName, setFullName] = useState(savedFullName);
  const [previousPassword, setPreviousPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPrevious, setShowPrevious] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorFullName, setErrorFullName] = useState('');
  const [errorPreviousPassword, setErrorPreviousPassword] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [errorPasswordConfirm, setErrorPasswordConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');
  const [saveError, setSaveError] = useState('');

  const ids = {
    fullName: `${baseId}-full-name`,
    email: `${baseId}-email`,
    previousPassword: `${baseId}-pass-prev`,
    password: `${baseId}-pass`,
    passwordConfirm: `${baseId}-pass-confirm`,
  };

  function clearMessages() {
    setErrorFullName('');
    setErrorPreviousPassword('');
    setErrorPassword('');
    setErrorPasswordConfirm('');
    setSaved('');
    setSaveError('');
  }

  function clearPasswords() {
    setPreviousPassword('');
    setPassword('');
    setPasswordConfirm('');
  }

  function validate(): boolean {
    let ok = true;

    if (fullName.trim().length < 2) {
      setErrorFullName('El nombre debe tener al menos 2 caracteres.');
      ok = false;
    }

    const changingPassword = !!(previousPassword || password || passwordConfirm);
    if (changingPassword) {
      if (!previousPassword) {
        setErrorPreviousPassword('Ingresa tu contraseña anterior.');
        ok = false;
      }
      if (!password) {
        setErrorPassword('Ingresa la nueva contraseña.');
        ok = false;
      } else if (password.length < 8) {
        setErrorPassword('La contraseña debe tener al menos 8 caracteres.');
        ok = false;
      }
      if (!passwordConfirm) {
        setErrorPasswordConfirm('Confirma la nueva contraseña.');
        ok = false;
      } else if (password && passwordConfirm !== password) {
        setErrorPasswordConfirm('Las contraseñas no coinciden.');
        ok = false;
      }
    }

    return ok;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    clearMessages();
    if (!validate()) return;

    const nameChanged = fullName.trim() !== savedFullName;
    if (!nameChanged && !password) {
      setSaved('No hay cambios que guardar.');
      return;
    }

    setSaving(true);
    try {
      await onUpdate({ fullName: fullName.trim(), previousPassword, password });
      setFullName(fullName.trim());
      clearPasswords();
      setSaved(
        nameChanged && password
          ? 'Nombre y contraseña actualizados.'
          : password
            ? 'Contraseña actualizada.'
            : 'Nombre actualizado.',
      );
    } catch (err) {
      if (err instanceof ApiError && err.body?.code === 'wrong_current_password') {
        setErrorPreviousPassword('La contraseña anterior no es correcta.');
      } else {
        setSaveError(errorMessage(err, 'No se pudo actualizar el perfil. Intenta de nuevo.'));
      }
    } finally {
      setSaving(false);
    }
  }

  function handleClear() {
    setFullName(savedFullName);
    clearPasswords();
    clearMessages();
  }

  return (
    <form
      className={['profile-form', className].filter(Boolean).join(' ')}
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="profile-form__columns">
        <fieldset className="profile-form__section">
          <legend className="profile-form__title">Cambie sus detalles</legend>

          <div className="profile-form__field">
            <label htmlFor={ids.fullName}>
              Nombre completo
              <span className="form-required">(Obligatorio)</span>
            </label>
            <input
              id={ids.fullName}
              name="fullName"
              type="text"
              required
              aria-required="true"
              autoComplete="name"
              placeholder="ej. Joe Bloggs"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              aria-invalid={!!errorFullName}
              aria-describedby={errorFullName ? `${ids.fullName}-error` : undefined}
            />
            {errorFullName ? (
              <p id={`${ids.fullName}-error`} className="profile-form__error" role="alert">
                {errorFullName}
              </p>
            ) : null}
          </div>

          <div className="profile-form__field">
            <label htmlFor={ids.email}>Dirección de correo electrónico</label>
            <input id={ids.email} name="email" type="email" value={email} readOnly disabled />
            <p className="form-help">El correo electrónico no se puede modificar.</p>
          </div>
        </fieldset>

        <fieldset className="profile-form__section">
          <legend className="profile-form__title">Cambia tu contraseña</legend>

          <PasswordField
            id={ids.previousPassword}
            label="Contraseña anterior"
            value={previousPassword}
            onChange={setPreviousPassword}
            visible={showPrevious}
            onToggle={() => setShowPrevious((v) => !v)}
            error={errorPreviousPassword}
          />
          <PasswordField
            id={ids.password}
            label="Contraseña"
            value={password}
            onChange={setPassword}
            visible={showNew}
            onToggle={() => setShowNew((v) => !v)}
            error={errorPassword}
          />
          <PasswordField
            id={ids.passwordConfirm}
            label="Confirmar contraseña"
            value={passwordConfirm}
            onChange={setPasswordConfirm}
            visible={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
            error={errorPasswordConfirm}
          />
        </fieldset>
      </div>

      <div className="profile-form__footer">
        {saveError ? (
          <p className="profile-form__error" role="alert">
            {saveError}
          </p>
        ) : null}
        <p className="profile-form__status" role="status">
          {saved}
        </p>
        <div className="profile-form__actions">
          <Button type="button" variant="secondary" onClick={handleClear} disabled={saving}>
            Borrar
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Actualizar perfil'}
          </Button>
        </div>
      </div>
    </form>
  );
}
