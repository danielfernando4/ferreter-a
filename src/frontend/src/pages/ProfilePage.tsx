import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LayoutWithNav from '../components/LayoutWithNav';
import SessionTimer from '../components/SessionTimer';
import { changePassword } from '../api/client';
import { validatePassword } from '../utils/passwordPolicy';
import { validateRequired, validatePasswordMatch, ValidationErrors } from '../utils/validation';
import { UserCircle, Lock, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errors: ValidationErrors = {};

    const cpErr = validateRequired(formData.current_password, 'Contraseña actual');
    if (cpErr) errors.current_password = cpErr;

    const npErr = validateRequired(formData.new_password, 'Nueva contraseña');
    if (npErr) errors.new_password = npErr;
    else {
      const pwValid = validatePassword(formData.new_password);
      if (!pwValid.valid) errors.new_password = pwValid.message;
    }

    const cfErr = validateRequired(formData.confirm_password, 'Confirmar contraseña');
    if (cfErr) errors.confirm_password = cfErr;
    else if (formData.new_password !== formData.confirm_password) {
      errors.confirm_password = 'Las contraseñas no coinciden';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      await changePassword({
        current_password: formData.current_password,
        new_password: formData.new_password,
        confirm_password: formData.confirm_password,
      });
      setSuccess('Contraseña actualizada exitosamente');
      setFormData({ current_password: '', new_password: '', confirm_password: '' });
      setShowChangePassword(false);
    } catch (err: any) {
      setError(err.message || 'Error al cambiar la contraseña');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <LayoutWithNav>
      <SessionTimer />

      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Mi Perfil</h1>

        {/* Profile info */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
              <UserCircle size={40} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{user.full_name}</h2>
              <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium capitalize">
                {user.role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
                Nombre de usuario
              </label>
              <p className="text-slate-900 font-medium mt-1">{user.username}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
                Correo electrónico
              </label>
              <p className="text-slate-900 font-medium mt-1">{user.email}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
                Estado
              </label>
              <p className={`font-medium mt-1 ${user.is_active ? 'text-emerald-600' : 'text-red-600'}`}>
                {user.is_active ? 'Activo' : 'Inactivo'}
              </p>
            </div>
            {user.created_at && (
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Miembro desde
                </label>
                <p className="text-slate-900 font-medium mt-1">
                  {new Date(user.created_at).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Change password */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lock size={20} className="text-slate-500" />
              <h2 className="text-lg font-semibold text-slate-900">Cambiar contraseña</h2>
            </div>
            <button
              onClick={() => setShowChangePassword(!showChangePassword)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              {showChangePassword ? 'Cancelar' : 'Cambiar'}
            </button>
          </div>

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2">
              <CheckCircle size={16} />
              {success}
            </div>
          )}

          {showChangePassword && (
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Contraseña actual
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={formData.current_password}
                    onChange={(e) => handleChange('current_password', e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border pr-10 ${
                      fieldErrors.current_password ? 'border-red-300 bg-red-50' : 'border-slate-200'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fieldErrors.current_password && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.current_password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={formData.new_password}
                    onChange={(e) => handleChange('new_password', e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border pr-10 ${
                      fieldErrors.new_password ? 'border-red-300 bg-red-50' : 'border-slate-200'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número, 1 especial"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fieldErrors.new_password && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.new_password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Confirmar nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    value={formData.confirm_password}
                    onChange={(e) => handleChange('confirm_password', e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border pr-10 ${
                      fieldErrors.confirm_password ? 'border-red-300 bg-red-50' : 'border-slate-200'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fieldErrors.confirm_password && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.confirm_password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-blue-600 text-white rounded-2xl shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Actualizando...
                  </>
                ) : (
                  'Actualizar contraseña'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </LayoutWithNav>
  );
}
