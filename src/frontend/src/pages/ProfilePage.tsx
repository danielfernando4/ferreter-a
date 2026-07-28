import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getPerfil, updatePerfil, updatePreferencias } from '../services/api';
import type { PerfilResponse } from '../types/auth';
import ProfileForm from '../components/profile/ProfileForm';
import ChangePasswordForm from '../components/profile/ChangePasswordForm';
import PreferencesForm from '../components/profile/PreferencesForm';
import { Loader2, AlertCircle, UserCircle } from 'lucide-react';

export default function ProfilePage() {
  const { updateUser } = useAuth();
  const [data, setData] = useState<PerfilResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await getPerfil();
        if (!cancelled) setData(res);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Error al cargar el perfil');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleProfileSave = async (profileData: { nombre_completo: string; email: string }) => {
    const updatedUser = await updatePerfil(profileData);
    updateUser(updatedUser);
    setData((prev) => prev ? { ...prev, usuario: updatedUser } : prev);
  };

  const handlePreferencesSave = async (prefData: { idioma?: string; tema_visual?: string; zona_horaria?: string }) => {
    const updatedPrefs = await updatePreferencias(prefData);
    setData((prev) => prev ? { ...prev, preferencias: updatedPrefs } : prev);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
        <p className="text-sm text-red-600">{error || 'Error al cargar perfil'}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
          <UserCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Mi Perfil</h2>
          <p className="text-sm text-slate-500 mt-1">Gestiona tu información personal y preferencias</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <ProfileForm user={data.usuario} onSave={handleProfileSave} />
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <ChangePasswordForm />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <PreferencesForm preferencias={data.preferencias} onSave={handlePreferencesSave} />
          </div>
        </div>
      </div>
    </div>
  );
}
