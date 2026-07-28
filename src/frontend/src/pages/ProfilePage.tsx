import { useState, useEffect } from 'react';
import { getPerfil } from '../services/api';
import type { UserOut, PreferenciasOut } from '../types/auth';
import { useAuth } from '../hooks/useAuth';
import ProfileForm from '../components/profile/ProfileForm';
import ChangePasswordForm from '../components/profile/ChangePasswordForm';
import PreferencesForm from '../components/profile/PreferencesForm';
import { Loader2, User, Shield, Settings, Key } from 'lucide-react';

type Tab = 'profile' | 'preferences' | 'password';

export default function ProfilePage() {
  const { refreshUser } = useAuth();
  const [user, setUser] = useState<UserOut | null>(null);
  const [preferencias, setPreferencias] = useState<PreferenciasOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  useEffect(() => {
    const fetchPerfil = async () => {
      setIsLoading(true);
      try {
        const data = await getPerfil();
        setUser(data.usuario);
        setPreferencias(data.preferencias);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al cargar perfil';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPerfil();
  }, []);

  const handleProfileSave = (updatedUser: UserOut) => {
    setUser(updatedUser);
    refreshUser();
  };

  const handlePrefsSave = (updatedPrefs: PreferenciasOut) => {
    setPreferencias(updatedPrefs);
  };

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'preferences', label: 'Preferencias', icon: Settings },
    { id: 'password', label: 'Contraseña', icon: Key },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mi Perfil</h1>
        <p className="text-sm text-slate-500 mt-1">Gestiona tu información personal y preferencias</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="p-6">
          {user && (
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-blue-600">
                  {user.nombre_completo.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{user.nombre_completo}</h2>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Shield className="w-3.5 h-3.5" />
                  <span className="capitalize">{user.rol}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && user && (
            <ProfileForm user={user} onSave={handleProfileSave} />
          )}
          {activeTab === 'preferences' && preferencias && (
            <PreferencesForm preferencias={preferencias} onSave={handlePrefsSave} />
          )}
          {activeTab === 'password' && (
            <ChangePasswordForm />
          )}
        </div>
      </div>
    </div>
  );
}
