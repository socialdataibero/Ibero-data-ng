import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/auth/useAuth';
import { ApiError } from '../../core/api/http';

interface RouteState {
  from?: { pathname: string };
}

export function useLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [errorEmail, setErrorEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    let ok = true;

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorEmail('El correo es obligatorio.');
      ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorEmail('Ingresa un correo válido.');
      ok = false;
    }

    if (!password) {
      setErrorPassword('La contraseña es obligatoria.');
      ok = false;
    } else if (password.length < 6) {
      setErrorPassword('Mínimo 6 caracteres.');
      ok = false;
    }

    return ok;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorEmail('');
    setErrorPassword('');
    setErrorGeneral(null);

    if (!validate()) return;

    setLoading(true);
    try {
      await login(email.trim(), password);
      const dest = (location.state as RouteState | null)?.from?.pathname ?? '/dashboard';
      navigate(dest, { replace: true });
    } catch (error) {
      handleLoginError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginError = (error: unknown) => {
    if (error instanceof ApiError) {
      const code = error.body?.code ?? null;

      switch (code) {
        case 'user_not_found':
          setErrorEmail('Usuario no encontrado o inactivo');
          return;
        case 'wrong_password':
          setErrorPassword('Contraseña incorrecta');
          return;
        default:
          setErrorGeneral(
            error.status >= 500
              ? 'El servidor no responde. Intenta más tarde.'
              : code ?? 'Credenciales inválidas.',
          );
          return;
      }
    }

    setErrorGeneral('No se pudo conectar. Revisa tu conexión.');
  };

  return { email, setEmail, password, setPassword, errorEmail, errorPassword, errorGeneral, loading, submit };
}
