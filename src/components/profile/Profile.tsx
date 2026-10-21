import { PageHeader } from '../shared/page-header/PageHeader';
import { ProfileForm } from './ProfileForm';
import { ProfileSkeleton } from './ProfileSkeleton';
import { CRUMBS, useProfile } from './useProfile';
import './profile.css';

export function Profile() {
  const { currentUser, save } = useProfile();

  if (!currentUser) return <ProfileSkeleton />;

  return (
    <div className="c-profile">
      <PageHeader
        title="Configuración de perfil"
        intro="Actualiza tu nombre y tu contraseña de acceso a la plataforma."
        crumbs={CRUMBS}
      />

      <section
        className="container width-fixed c-profile__section"
        aria-label="Formulario de perfil"
      >
        <ProfileForm fullName={currentUser.fullName} email={currentUser.email} onUpdate={save} />
      </section>
    </div>
  );
}
