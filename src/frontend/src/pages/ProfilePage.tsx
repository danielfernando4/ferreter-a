import { useState, useEffect } from 'react';
import { getPerfil, updatePerfil, changePasswordApi, updatePreferencias, PreferenciasOut, UserOut } from '../services/api';
import ProfileForm from '../components/profile/ProfileForm';
import ChangePasswordForm from '../components/profile/ChangePasswordForm';
import PreferencesForm from '../components/profile/PreferencesForm';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { useAuth } from '../hooks/useAuth';
import { User as UserIcon } from 'lucide-react';

export default function ProfilePage() {
  const { user: authUser, updateUser } = useAuth();
  const [usuario, setUsuario] = useState<UserOut | null>(null);
  const [preferencias, setPreferencias] = useState<PreferenciasOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getPerfil();
        setUsuario(res.usuario);
        setPreferencias(res.preferencias);
      } catch (err: any) {
        setError(err.detail || 'Error al cargar el perfil');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleProfileSave = async (data: { nombre_completo?: string; email?: string }) => {
    const updated = await updatePerfil(data);
    setUsuario(updated);
    updateUser(updated);
  };

  const handlePasswordChange = async (data: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }) => {
    await changePasswordApi(data);
  };

  const handlePreferencesSave = async (data: {
    idioma?: string;
    tema_visual?: string;
    zona_horaria?: string;
  }) => {
    const updated = await updatePreferencias(data);
    setPreferencias(updated);
  };

  if (isLoading) {
    return <LoadingState message="Cargando perfil..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <UserIcon className="text-blue-600" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mi Perfil</h1>
            <p className="text-sm text-slate-500 mt-1">
              {usuario?.email} · {usuario?.rol}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          {usuario && (
            <ProfileForm user={usuario} onSave={handleProfileSave} />
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <ChangePasswordForm onSubmit={handlePasswordChange} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            {preferencias && (
              <PreferencesForm
                preferencias={preferencias}
                onSave={handlePreferencesSave}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
