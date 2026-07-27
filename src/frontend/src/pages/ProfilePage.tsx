import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { changePassword } from '../api/client';
import { validatePasswordPolicy, validatePasswordMatch } from '../utils/validation';
import { UserCircle, Eye, EyeOff, AlertCircle, CheckCircle, KeyRound } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    setSuccessMsg('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrors({ form: 'Todos los campos son requeridos' });
      return;
    }

    const passErr = validatePasswordPolicy(newPassword);
    if (passErr) {
      setErrors({ newPassword: passErr });
      return;
    }

    const matchErr = validatePasswordMatch(newPassword, confirmPassword);
    if (matchErr) {
      setErrors({ confirmPassword: matchErr });
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setSuccessMsg('Contraseña actualizada exitosamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
      setShowChangePassword(false);
    } catch (err: any) {
      setApiError(err.message || 'Error al cambiar la contraseña');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      administrador: 'bg-purple-100 text-purple-700',
      bodega: 'bg-blue-100 text-blue-700',
      vendedor: 'bg-green-100 text-green-700',
      compras: 'bg-amber-100 text-amber-700',
    };
    return colors[role] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
          <UserCircle size={28} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mi Perfil</h1>
          <p className="text-slate-500">Información personal y configuración de cuenta</p>
        </div>
      </div>

      {/* Profile info */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
              <UserCircle size={40} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{user?.full_name || 'Usuario'}</h2>
              <span className={`inline-block px-3 py-0.5 rounded-full text-sm mt-1 ${roleBadgeColor(user?.role || '')}`}>
                {user?.role || ''}
              </span>
            </div>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-slate-500 mb-1">Nombre de usuario</label>
            <p className="text-base font-medium text-slate-900">{user?.username || '—'}</p>
          </div>
          <div>
            <label className="block text-sm text-slate-500 mb-1">Correo electrónico</label>
            <p className="text-base font-medium text-slate-900">{user?.email || '—'}</p>
          </div>
          <div>
            <label className="block text-sm text-slate-500 mb-1">Estado</label>
            <p className={`text-base font-medium ${user?.is_active ? 'text-green-600' : 'text-red-600'}`}>
              {user?.is_active ? 'Activo' : 'Inactivo'}
            </p>
          </div>
          <div>
            <label className="block text-sm text-slate-500 mb-1">Miembro desde</label>
            <p className="text-base font-medium text-slate-900">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Change password section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KeyRound size={22} className="text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-900">Cambiar Contraseña</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowChangePassword(!showChangePassword);
              setErrors({});
              setApiError('');
              setSuccessMsg('');
            }}
            className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
          >
            {showChangePassword ? 'Cancelar' : 'Cambiar'}
          </button>
        </div>

        {showChangePassword && (
          <div className="p-6">
            {successMsg && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3 text-green-700">
                <CheckCircle size={20} />
                <span className="text-sm">{successMsg}</span>
              </div>
            )}

            {apiError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700">
                <AlertCircle size={20} />
                <span className="text-sm">{apiError}</span>
              </div>
            )}

            {errors.form && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700">
                <AlertCircle size={20} />
                <span className="text-sm">{errors.form}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Contraseña actual
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-10"
                    placeholder="Tu contraseña actual"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setErrors({});
                    }}
                    className={`w-full px-4 py-2.5 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-10 ${
                      errors.newPassword ? 'border-red-300 bg-red-50' : 'border-slate-300'
                    }`}
                    placeholder="Nueva contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  Mínimo 8 caracteres, 1 mayúscula, 1 número y 1 carácter especial
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Confirmar nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrors({});
                    }}
                    className={`w-full px-4 py-2.5 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-10 ${
                      errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-slate-300'
                    }`}
                    placeholder="Repite la nueva contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-2xl shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? 'Actualizando...' : 'Actualizar Contraseña'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
