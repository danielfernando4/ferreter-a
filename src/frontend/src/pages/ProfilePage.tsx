import { useState, useEffect } from 'react';
import ProfileForm from '../components/profile/ProfileForm';
import ChangePasswordForm from '../components/profile/ChangePasswordForm';
import PreferencesForm from '../components/profile/PreferencesForm';
import { getPerfil, getPreferencias } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Loader2, AlertCircle, User, Lock, Settings } from 'lucide-react';
import type { PreferenciasOut } from '../types/auth';

type Tab = 'profile' | 'password' | 'preferences';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [preferencias, setPreferencias] = useState<PreferenciasOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getPerfil(), getPreferencias()])
      .then(([perfilRes, prefs]) => {
        updateUser(perfilRes.usuario);
        setPreferencias(prefs);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Error al cargar perfil';
        setError(msg);
      })
      .finally(() => setIsLoading(false));
  }, [updateUser]);

  const tabs: { key: Tab; label: string; icon: typeof User }[] = [
    { key: 'profile', label: 'Datos personales', icon: User },
    { key: 'password', label: 'Contraseña', icon: Lock },
    { key: 'preferences', label: 'Preferencias', icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Mi perfil</h1>
        <p className="text-sm text-slate-500 mt-1">Gestiona tu información personal y preferencias</p>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        {activeTab === 'profile' && user && (
          <ProfileForm user={user} onSave={updateUser} />
        )}
        {activeTab === 'password' && <ChangePasswordForm />}
        {activeTab === 'preferences' && preferencias && (
          <PreferencesForm
            preferencias={preferencias}
            onSave={setPreferencias}
          />
        )}
      </div>
    </div>
  );
}
