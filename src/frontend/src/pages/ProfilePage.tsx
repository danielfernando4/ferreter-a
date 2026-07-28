import { useState, useEffect } from 'react';
import { Loader2, User, Key, Settings } from 'lucide-react';
import { getPerfil } from '../services/api';
import type { PerfilResponse } from '../types/auth';
import ProfileForm from '../components/profile/ProfileForm';
import ChangePasswordForm from '../components/profile/ChangePasswordForm';
import PreferencesForm from '../components/profile/PreferencesForm';

type Tab = 'perfil' | 'password' | 'preferencias';

export default function ProfilePage() {
  const [data, setData] = useState<PerfilResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('perfil');

  useEffect(() => {
    getPerfil()
      .then(setData)
      .catch(err => {
        const msg = err instanceof Error ? err.message : 'Error al cargar perfil';
        setError(msg);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
        {error}
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'perfil', label: 'Datos personales', icon: User },
    { id: 'password', label: 'Contraseña', icon: Key },
    { id: 'preferencias', label: 'Preferencias', icon: Settings },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mi Perfil</h1>
        <p className="text-sm text-slate-500 mt-1">
          Gestiona tu información personal y preferencias
        </p>
      </div>

      {/* User info card */}
      {data && (
        <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl font-bold">
            {data.usuario.nombre_completo?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{data.usuario.nombre_completo}</h2>
            <p className="text-sm text-slate-500">{data.usuario.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 capitalize">
              {data.usuario.rol}
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl shadow-sm p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-1 justify-center ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
        {activeTab === 'perfil' && data && (
          <ProfileForm
            user={data.usuario}
            onSave={() => {
              getPerfil().then(setData).catch(() => {});
            }}
          />
        )}
        {activeTab === 'password' && <ChangePasswordForm />}
        {activeTab === 'preferencias' && data && (
          <PreferencesForm
            preferencias={data.preferencias}
            onSave={prefs => {
              setData(prev => prev ? { ...prev, preferencias: prefs } : prev);
            }}
          />
        )}
      </div>
    </div>
  );
}
