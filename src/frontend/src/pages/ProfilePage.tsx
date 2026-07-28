import { useState, useEffect } from 'react';
import { UserCircle, Lock, Settings, AlertCircle } from 'lucide-react';
import ProfileForm from '../components/profile/ProfileForm';
import ChangePasswordForm from '../components/profile/ChangePasswordForm';
import PreferencesForm from '../components/profile/PreferencesForm';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';
import type { UserOut, PreferenciasOut } from '../types/auth';

type Tab = 'profile' | 'password' | 'preferences';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [preferencias, setPreferencias] = useState<PreferenciasOut | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      setError('');
      try {
        const data = await api.getPerfil();
        updateUser(data.usuario);
        setPreferencias(data.preferencias);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Error al cargar perfil';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [updateUser]);

  const tabs: { id: Tab; label: string; icon: typeof UserCircle }[] = [
    { id: 'profile', label: 'Datos Personales', icon: UserCircle },
    { id: 'password', label: 'Cambiar Contraseña', icon: Lock },
    { id: 'preferences', label: 'Preferencias', icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <p className="text-slate-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Mi Perfil</h2>
        <p className="text-sm text-slate-500 mt-1">
          Gestiona tus datos personales y preferencias
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm p-8">
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
