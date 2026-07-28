import { useEffect, useState } from 'react';
import { getPerfil, updatePerfil, updatePreferencias } from '../services/api';
import ProfileForm from '../components/profile/ProfileForm';
import ChangePasswordForm from '../components/profile/ChangePasswordForm';
import PreferencesForm from '../components/profile/PreferencesForm';
import { useAuth } from '../context/AuthContext';
import type { UserOut, PreferenciasOut } from '../types/auth';
import { Loader2, UserCircle, AlertTriangle } from 'lucide-react';

export default function ProfilePage() {
  const { updateUser } = useAuth();
  const [user, setUser] = useState<UserOut | null>(null);
  const [preferencias, setPreferencias] = useState<PreferenciasOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getPerfil()
      .then((perfil) => {
        setUser(perfil.usuario);
        setPreferencias(perfil.preferencias);
        setIsLoading(false);
      })
      .catch((err: any) => {
        setError(err.message || 'Error al cargar el perfil.');
        setIsLoading(false);
      });
  }, []);

  const handleProfileSave = async (data: { nombre_completo?: string; email?: string }) => {
    const updatedUser = await updatePerfil(data);
    setUser(updatedUser);
    updateUser(updatedUser);
  };

  const handlePreferencesSave = async (data: { idioma?: string; tema_visual?: string; zona_horaria?: string }) => {
    const updatedPref = await updatePreferencias(data);
    setPreferencias(updatedPref);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
          <UserCircle className="h-6 w-6 text-slate-900" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mi perfil</h1>
          <p className="text-sm text-slate-500 mt-1">Administra tu información personal y preferencias</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {user && <ProfileForm user={user} onSave={handleProfileSave} />}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <ChangePasswordForm />
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          {preferencias && (
            <PreferencesForm preferencias={preferencias} onSave={handlePreferencesSave} />
          )}
        </div>
      </div>
    </div>
  );
}
