import { useState, useEffect } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { ProfileForm } from '../components/profile/ProfileForm';
import { ChangePasswordForm } from '../components/profile/ChangePasswordForm';
import { PreferencesForm } from '../components/profile/PreferencesForm';
import * as api from '../services/api';
import type { UserOut, PreferenciasOut } from '../types/auth';
import { AlertCircle, User } from 'lucide-react';

export function ProfilePage() {
  const [user, setUser] = useState<UserOut | null>(null);
  const [preferencias, setPreferencias] = useState<PreferenciasOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPerfil() {
      try {
        const data = await api.getPerfil();
        setUser(data.usuario);
        setPreferencias(data.preferencias);
      } catch {
        setError('Error al cargar el perfil');
      } finally {
        setIsLoading(false);
      }
    }
    loadPerfil();
  }, []);

  const handleProfileSave = async (data: { nombre_completo: string; email: string }) => {
    const updated = await api.updatePerfil(data);
    setUser(updated);
  };

  const handlePreferencesSave = async (data: { idioma: string; tema_visual: string; zona_horaria: string }) => {
    const updated = await api.updatePreferencias(data);
    setPreferencias(updated);
  };

  if (isLoading) {
    return (
      <AppLayout title="Perfil">
        <div className="max-w-2xl">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="animate-pulse space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-slate-200 rounded w-1/3" />
                  <div className="h-4 bg-slate-100 rounded w-1/4" />
                </div>
              </div>
              <div className="h-10 bg-slate-200 rounded" />
              <div className="h-10 bg-slate-200 rounded" />
              <div className="h-10 bg-slate-200 rounded" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !user) {
    return (
      <AppLayout title="Perfil">
        <div className="max-w-2xl">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error || 'No se pudo cargar el perfil'}</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Perfil">
      <div className="max-w-2xl space-y-6">
        {/* User info card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold">
              {(user.nombre_completo || '').charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{user.nombre_completo || ''}</h2>
              <p className="text-sm text-slate-500">{user.email || ''}</p>
              <span className="inline-flex items-center gap-1 mt-1 text-xs text-slate-500">
                <User className="w-3 h-3" />
                Rol: <span className="capitalize font-medium">{user.rol || ''}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Profile form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
          <ProfileForm user={user} onSave={handleProfileSave} />
        </div>

        {/* Change password */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
          <ChangePasswordForm />
        </div>

        {/* Preferences */}
        {preferencias && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
            <PreferencesForm
              preferencias={preferencias}
              onSave={handlePreferencesSave}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
