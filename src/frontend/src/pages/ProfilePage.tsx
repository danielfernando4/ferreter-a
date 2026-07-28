import { useState, useEffect } from 'react';
import * as api from '../services/api';
import ProfileForm from '../components/profile/ProfileForm';
import ChangePasswordForm from '../components/profile/ChangePasswordForm';
import PreferencesForm from '../components/profile/PreferencesForm';
import { useAuth } from '../hooks/useAuth';
import type { PreferenciasOut } from '../types/auth';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [preferencias, setPreferencias] = useState<PreferenciasOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.getPerfil();
        setPreferencias(res.preferencias);
      } catch {
        // fallback defaults
        setPreferencias({ idioma: 'es', tema_visual: 'light', zona_horaria: 'America/Mexico_City' });
      }
      setIsLoading(false);
    }
    loadProfile();
  }, []);

  const handleSavePerfil = async (data: { nombre_completo?: string; email?: string }) => {
    const updated = await api.updatePerfil(data);
    updateUser(updated);
  };

  const handleChangePassword = async (data: { current_password: string; new_password: string; confirm_password: string }) => {
    await api.changePassword(data);
  };

  const handleSavePreferencias = async (data: { idioma?: string; tema_visual?: string; zona_horaria?: string }) => {
    const updated = await api.updatePreferencias(data);
    setPreferencias(updated);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mi perfil</h1>
        <p className="text-sm text-slate-500 mt-1">Gestiona tu información personal y preferencias</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        {user && <ProfileForm user={user} onSave={handleSavePerfil} />}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        <ChangePasswordForm onChangePassword={handleChangePassword} />
      </div>

      {preferencias && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          <PreferencesForm preferencias={preferencias} onSave={handleSavePreferencias} />
        </div>
      )}
    </div>
  );
}
