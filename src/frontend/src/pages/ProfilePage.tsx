import { useState, useEffect } from 'react';
import * as api from '../../services/api';
import type { UserOut, PreferenciasOut, PerfilUpdateRequest, PreferenciasUpdateRequest } from '../types/auth';
import ProfileForm from '../components/profile/ProfileForm';
import ChangePasswordForm from '../components/profile/ChangePasswordForm';
import PreferencesForm from '../components/profile/PreferencesForm';
import { useAuth } from '../hooks/useAuth';
import { UserCircle, Lock, Settings } from 'lucide-react';

type Tab = 'profile' | 'password' | 'preferences';

export default function ProfilePage() {
  const { updateUser } = useAuth();
  const [user, setUser] = useState<UserOut | null>(null);
  const [preferencias, setPreferencias] = useState<PreferenciasOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await api.getPerfil();
        setUser(data.usuario);
        setPreferencias(data.preferencias);
      } catch {
        // Error handled silently
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleProfileSave = async (data: PerfilUpdateRequest) => {
    const updated = await api.updatePerfil(data);
    setUser(updated);
    updateUser(updated);
  };

  const handlePreferencesSave = async (data: PreferenciasUpdateRequest) => {
    const updated = await api.updatePreferencias(data);
    setPreferencias(updated);
  };

  const tabs: { id: Tab; label: string; icon: typeof UserCircle }[] = [
    { id: 'profile', label: 'Perfil', icon: UserCircle },
    { id: 'password', label: 'Contraseña', icon: Lock },
    { id: 'preferences', label: 'Preferencias', icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mi Perfil</h1>
        <p className="text-sm text-slate-500 mt-1">
          Gestiona tu información personal y preferencias
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        {activeTab === 'profile' && user && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Datos personales</h2>
            <ProfileForm user={user} onSave={handleProfileSave} />
          </div>
        )}

        {activeTab === 'password' && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Cambiar contraseña</h2>
            <ChangePasswordForm />
          </div>
        )}

        {activeTab === 'preferences' && preferencias && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Preferencias</h2>
            <PreferencesForm preferencias={preferencias} onSave={handlePreferencesSave} />
          </div>
        )}
      </div>
    </div>
  );
}
