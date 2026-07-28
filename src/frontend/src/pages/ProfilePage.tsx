import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, UserCircle } from 'lucide-react';
import ProfileForm from '../components/profile/ProfileForm';
import ChangePasswordForm from '../components/profile/ChangePasswordForm';
import PreferencesForm from '../components/profile/PreferencesForm';
import { perfilApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { PreferenciasOut } from '../types/auth';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [preferencias, setPreferencias] = useState<PreferenciasOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await perfilApi.get();
        setPreferencias(response.preferencias);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al cargar perfil';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileSave = async (data: { nombre_completo?: string; email?: string }) => {
    const updatedUser = await perfilApi.update(data);
    updateUser(updatedUser);
  };

  const handlePreferencesSave = async (data: Partial<PreferenciasOut>) => {
    const updated = await perfilApi.updatePreferencias(data);
    setPreferencias(updated);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
          <UserCircle className="h-8 w-8 text-slate-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mi Perfil</h1>
          <p className="text-sm text-slate-500">
            {user?.nombre_completo} · {user?.email}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Datos personales</h2>
        {user && <ProfileForm user={user} onSave={handleProfileSave} />}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        {preferencias && (
          <PreferencesForm
            preferencias={preferencias}
            onSave={handlePreferencesSave}
          />
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
