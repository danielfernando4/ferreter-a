import React, { useEffect, useState } from 'react';
import { ProfileForm } from '../components/profile/ProfileForm';
import { ChangePasswordForm } from '../components/profile/ChangePasswordForm';
import { PreferencesForm } from '../components/profile/PreferencesForm';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { useAuth } from '../hooks/useAuth';
import { UserCircle, KeyRound, Settings } from 'lucide-react';
import type { PreferenciasOut } from '../types/auth';

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [preferencias, setPreferencias] = useState<PreferenciasOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'preferences'>('profile');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { getPerfil } = await import('../services/api');
        const perfilData = await getPerfil();
        setPreferencias(perfilData.preferencias);
        updateUser(perfilData.usuario);
      } catch (err: unknown) {
        const apiErr = err as { message?: string };
        setError(apiErr?.message || 'Error al cargar el perfil');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [updateUser]);

  const handleProfileSave = async (data: {
    nombre_completo: string;
    email: string;
  }) => {
    const { updatePerfil } = await import('../services/api');
    const updatedUser = await updatePerfil(data);
    updateUser(updatedUser);
  };

  const handlePasswordSave = async (data: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }) => {
    const { changePassword } = await import('../services/api');
    await changePassword(data);
  };

  const handlePreferencesSave = async (data: {
    idioma?: string;
    tema_visual?: string;
    zona_horaria?: string;
  }) => {
    const { updatePreferencias } = await import('../services/api');
    const updatedPrefs = await updatePreferencias(data);
    setPreferencias(updatedPrefs);
  };

  if (isLoading) {
    return <LoadingState message="Cargando perfil..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  const tabs = [
    { id: 'profile' as const, label: 'Perfil', icon: UserCircle },
    { id: 'password' as const, label: 'Contraseña', icon: KeyRound },
    { id: 'preferences' as const, label: 'Preferencias', icon: Settings },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Mi Perfil</h1>
        <p className="text-sm text-slate-500 mt-1">
          Gestiona tu información personal y preferencias
        </p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-slate-200 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          {activeTab === 'profile' && user && (
            <>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">
                    {user.nombre_completo}
                  </h2>
                  <p className="text-xs text-slate-500 capitalize">{user.rol}</p>
                </div>
              </div>
              <ProfileForm user={user} onSave={handleProfileSave} />
            </>
          )}

          {activeTab === 'password' && (
            <>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Cambiar Contraseña
                  </h2>
                  <p className="text-xs text-slate-500">
                    Actualiza tu contraseña de acceso
                  </p>
                </div>
              </div>
              <ChangePasswordForm onSave={handlePasswordSave} />
            </>
          )}

          {activeTab === 'preferences' && preferencias && (
            <>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Settings className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Preferencias
                  </h2>
                  <p className="text-xs text-slate-500">
                    Personaliza tu experiencia
                  </p>
                </div>
              </div>
              <PreferencesForm
                preferencias={preferencias}
                onSave={handlePreferencesSave}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
