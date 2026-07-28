import { useState, useEffect } from 'react';
import * as api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { UserCircle, Loader2 } from 'lucide-react';
import ProfileForm from '../components/profile/ProfileForm';
import ChangePasswordForm from '../components/profile/ChangePasswordForm';
import PreferencesForm from '../components/profile/PreferencesForm';
import type { PerfilResponse } from '../types/auth';

export default function ProfilePage() {
  const { updateUser } = useAuth();
  const [data, setData] = useState<PerfilResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getPerfil();
        setData(res);
      } catch {
        setError('Error al cargar el perfil.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleProfileSave = async (profileData: { nombre_completo?: string; email?: string }) => {
    const updated = await api.updatePerfil(profileData);
    updateUser(updated);
    setData((prev) => (prev ? { ...prev, usuario: updated } : prev));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={28} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Mi perfil</h1>
        <p className="text-sm text-slate-500 mt-1">Administra tu información personal y preferencias</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <UserCircle size={28} className="text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900">Datos personales</h2>
            </div>
            {data && (
              <ProfileForm user={data.usuario} onSave={handleProfileSave} />
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <ChangePasswordForm />
          </div>
        </div>

        <div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24">
            {data && (
              <PreferencesForm
                preferencias={data.preferencias}
                onSave={(prefs) => setData((prev) => (prev ? { ...prev, preferencias: prefs } : prev))}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
