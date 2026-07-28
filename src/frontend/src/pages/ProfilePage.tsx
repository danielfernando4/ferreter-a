import React, { useState, useEffect } from 'react';
import { UserCircle } from 'lucide-react';
import ProfileForm from '../components/profile/ProfileForm';
import ChangePasswordForm from '../components/profile/ChangePasswordForm';
import PreferencesForm from '../components/profile/PreferencesForm';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { getPerfil, updatePerfil, updatePreferencias } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { PreferenciasOut } from '../types/auth';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [preferencias, setPreferencias] = useState<PreferenciasOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const res = await getPerfil();
        updateUser(res.usuario);
        setPreferencias(res.preferencias);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al cargar perfil.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleProfileSave = async (data: { nombre_completo?: string; email?: string }) => {
    const updated = await updatePerfil(data);
    updateUser(updated);
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
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  if (!user) {
    return <ErrorState message="No se pudieron cargar los datos del perfil." />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <UserCircle className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mi Perfil</h2>
          <p className="text-sm text-slate-500 mt-1">
            Administra tus datos personales y preferencias
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <ProfileForm user={user} onSave={handleProfileSave} />
      </div>

      {preferencias && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <PreferencesForm
            preferencias={preferencias}
            onSave={handlePreferencesSave}
          />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <ChangePasswordForm />
      </div>
    </div>
  );
};

export default ProfilePage;
