import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { perfilApi } from '../services/api';
import type { PreferenciasOut } from '../types/auth';
import ProfileForm from '../components/profile/ProfileForm';
import ChangePasswordForm from '../components/profile/ChangePasswordForm';
import PreferencesForm from '../components/profile/PreferencesForm';
import { User, Lock, Settings, Loader2, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [preferencias, setPreferencias] = useState<PreferenciasOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'preferences'>('profile');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError('');
      try {
        const response = await perfilApi.get();
        updateUser(response.usuario);
        setPreferencias(response.preferencias);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al cargar perfil';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [updateUser]);

  const handleProfileSave = async (data: { nombre_completo?: string; email?: string }) => {
    const updatedUser = await perfilApi.update(data);
    updateUser(updatedUser);
  };

  const handlePreferencesSave = async (data: { idioma?: string; tema_visual?: string; zona_horaria?: string }) => {
    const updatedPrefs = await perfilApi.updatePreferencias(data);
    setPreferencias(updatedPrefs);
  };

  const tabs = [
    { id: 'profile', label: 'Datos Personales', icon: User },
    { id: 'password', label: 'Contraseña', icon: Lock },
    { id: 'preferences', label: 'Preferencias', icon: Settings },
  ] as const;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <p className="text-sm text-slate-500">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mi Perfil</h1>
        <p className="text-sm text-slate-500 mt-1">Gestiona tu información personal y preferencias</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-indigo-600 border border-slate-200 border-b-white -mb-[2px] shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        {activeTab === 'profile' && user && (
          <ProfileForm user={user} onSave={handleProfileSave} />
        )}
        {activeTab === 'password' && <ChangePasswordForm />}
        {activeTab === 'preferences' && preferencias && (
          <PreferencesForm preferencias={preferencias} onSave={handlePreferencesSave} />
        )}
      </div>
    </div>
  );
}
