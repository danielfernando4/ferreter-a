import { useState, useEffect } from 'react';
import { getPerfil, updatePerfil, updatePreferencias, getPreferencias } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { ProfileForm } from '../components/profile/ProfileForm';
import { ChangePasswordForm } from '../components/profile/ChangePasswordForm';
import { PreferencesForm } from '../components/profile/PreferencesForm';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { UserCircle } from 'lucide-react';
import type { PreferenciasOut, UserOut } from '../types/auth';

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [preferencias, setPreferencias] = useState<PreferenciasOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const perfilData = await getPerfil();
        updateUser(perfilData.usuario);
        setPreferencias(perfilData.preferencias);
      } catch {
        // Try loading preferencias separately
        try {
          const prefs = await getPreferencias();
          setPreferencias(prefs);
        } catch {
          setPreferencias({ idioma: 'es', tema_visual: 'light', zona_horaria: 'America/Mexico_City' });
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [updateUser]);

  const handleProfileSave = async (data: { nombre_completo?: string; email?: string }) => {
    const updated = await updatePerfil(data);
    updateUser(updated);
  };

  const handlePreferencesSave = async (data: { idioma?: string; tema_visual?: string; zona_horaria?: string }) => {
    const updated = await updatePreferencias(data);
    setPreferencias(updated);
  };

  if (isLoading) {
    return <LoadingState message="Cargando perfil..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 rounded-full p-2">
          <UserCircle className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Mi Perfil</h2>
          <p className="text-sm text-slate-500 mt-1">Gestiona tu información personal y preferencias</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <ProfileForm user={user as UserOut} onSave={handleProfileSave} />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <ChangePasswordForm />
          </div>
        </div>
        <div className="space-y-6">
          {preferencias && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <PreferencesForm preferencias={preferencias} onSave={handlePreferencesSave} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
