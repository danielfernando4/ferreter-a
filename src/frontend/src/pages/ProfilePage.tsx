import { useState, useEffect } from 'react';
import { UserCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ProfileForm } from '../components/profile/ProfileForm';
import { ChangePasswordForm } from '../components/profile/ChangePasswordForm';
import { PreferencesForm } from '../components/profile/PreferencesForm';
import { ErrorState } from '../components/ErrorState';
import { getPerfil } from '../services/api';
import type { UserOut, PreferenciasOut } from '../types/auth';

type Tab = 'perfil' | 'password' | 'preferencias';

export default function ProfilePage() {
  const { user: contextUser, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('perfil');
  const [user, setUser] = useState<UserOut | null>(contextUser);
  const [preferencias, setPreferencias] = useState<PreferenciasOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await getPerfil();
        setUser(data.usuario);
        setPreferencias(data.preferencias);
        updateUser(data.usuario);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Error al cargar perfil');
        } else {
          setError('Error al cargar perfil');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [updateUser]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'perfil', label: 'Mi Perfil' },
    { id: 'password', label: 'Contraseña' },
    { id: 'preferencias', label: 'Preferencias' },
  ];

  const handleProfileSave = (updatedUser: UserOut) => {
    setUser(updatedUser);
    updateUser(updatedUser);
  };

  const handlePreferencesSave = (updatedPrefs: PreferenciasOut) => {
    setPreferencias(updatedPrefs);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
          <UserCircle size={22} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mi Perfil</h1>
          <p className="text-slate-500 text-sm mt-1">
            Administra tu información personal y preferencias
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <ErrorState
          title="Error al cargar perfil"
          message={error}
          onRetry={() => window.location.reload()}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tabs sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-4 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              {activeTab === 'perfil' && user && (
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">
                    Datos Personales
                  </h2>
                  <ProfileForm user={user} onSave={handleProfileSave} />
                </div>
              )}

              {activeTab === 'password' && (
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">
                    Cambiar Contraseña
                  </h2>
                  <ChangePasswordForm userId={user?.id} />
                </div>
              )}

              {activeTab === 'preferencias' && preferencias && (
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">
                    Preferencias del Sistema
                  </h2>
                  <PreferencesForm
                    preferencias={preferencias}
                    onSave={handlePreferencesSave}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
