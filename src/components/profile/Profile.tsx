import { PageHeader } from '../shared/page-header/PageHeader';
import { ProfileForm } from './ProfileForm';
import { ProfileSkeleton } from './ProfileSkeleton';
import { CRUMBS, useProfile } from './useProfile';
import './profile.css';

export function Profile() {
  const { currentUser, formValues } = useProfile();

  if (!currentUser) return <ProfileSkeleton />;

  return (
    <div className="c-profile">
      <PageHeader
        title="Configuración de perfil"
        intro="Actualiza tus datos personales, imagen y contraseña de acceso a la plataforma."
        crumbs={CRUMBS}
      />

      <section
        className="container width-fixed c-profile__section"
        aria-label="Formulario de perfil"
      >
        <ProfileForm initialValues={formValues} />
      </section>
    </div>
  );
}
