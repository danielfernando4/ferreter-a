import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { perfilApi } from '../services/api';
import type { PreferenciasOut } from '../types/auth';
import AppLayout from '../components/layout/AppLayout';
import ProfileForm from '../components/profile/ProfileForm';
import ChangePasswordForm from '../components/profile/ChangePasswordForm';
import PreferencesForm from '../components/profile/PreferencesForm';
import { UserCircle, Loader2, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [preferencias, setPreferencias] = useState<PreferenciasOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await perfilApi.get();
        if (!cancelled) {
          setPreferencias(data.preferencias);
          updateUser(data.usuario);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Error al cargar perfil';
          setError(msg);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [updateUser]);

  async function handleProfileSave(data: { nombre_completo?: string; email?: string }) {
    const updated = await perfilApi.update(data);
    updateUser(updated);
  }

  async function handlePreferencesSave(data: Partial<PreferenciasOut>) {
    const updated = await perfilApi.updatePreferencias(data);
    setPreferencias(updated);
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center gap-3 py-12">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="text-sm text-slate-600">{error}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <UserCircle className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Mi Perfil</h1>
            <p className="text-sm text-slate-500">Administra tu información personal</p>
          </div>
        </div>

        {user && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <ProfileForm user={user} onSave={handleProfileSave} />
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <ChangePasswordForm />
        </div>

        {preferencias && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <PreferencesForm preferencias={preferencias} onSave={handlePreferencesSave} />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
