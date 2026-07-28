import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, Loader2 } from 'lucide-react';
import ProfileForm from '../components/profile/ProfileForm';
import ChangePasswordForm from '../components/profile/ChangePasswordForm';
import PreferencesForm from '../components/profile/PreferencesForm';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';
import type { UserOut, PreferenciasOut } from '../types/auth';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user: authUser, token, updateUser } = useAuth();
  const [usuario, setUsuario] = useState<UserOut | null>(null);
  const [preferencias, setPreferencias] = useState<PreferenciasOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'preferences'>('profile');

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await api.getPerfil(token);
        setUsuario(res.usuario);
        setPreferencias(res.preferencias);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al cargar perfil';
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleProfileSave = (updated: UserOut) => {
    setUsuario(updated);
    updateUser(updated);
  };

  const handlePreferencesSave = (updated: PreferenciasOut) => {
    setPreferencias(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl border border-red-200 mb-4">
          {error}
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'profile' as const, label: 'Datos personales' },
    { id: 'password' as const, label: 'Cambiar contraseña' },
    { id: 'preferences' as const, label: 'Preferencias' },
  ];

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <UserCircle className="text-blue-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mi Perfil</h1>
          <p className="text-sm text-slate-500 mt-1">
            {usuario?.email || ''}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        {activeTab === 'profile' && usuario && (
          <ProfileForm user={usuario} onSave={handleProfileSave} />
        )}
        {activeTab === 'password' && (
          <ChangePasswordForm />
        )}
        {activeTab === 'preferences' && preferencias && (
          <PreferencesForm preferencias={preferencias} onSave={handlePreferencesSave} />
        )}
      </div>
    </div>
  );
}
