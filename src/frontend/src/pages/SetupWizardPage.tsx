import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Shield, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { setupFirstAdmin } from '../api/client';
import { validateRequired, validateEmail, validatePasswordPolicy, validatePasswordMatch } from '../utils/validation';
import LoadingState from '../components/LoadingState';

const SetupWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    setApiError('');
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const nameErr = validateRequired(formData.full_name, 'Nombre completo');
    if (nameErr) newErrors.full_name = nameErr;

    const usernameErr = validateRequired(formData.username, 'Nombre de usuario');
    if (usernameErr) newErrors.username = usernameErr;

    const emailErr = validateEmail(formData.email);
    if (emailErr) newErrors.email = emailErr;

    const passErr = validatePasswordPolicy(formData.password);
    if (passErr) newErrors.password = passErr;

    const matchErr = validatePasswordMatch(formData.password, formData.confirm_password);
    if (matchErr) newErrors.confirm_password = matchErr;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      await setupFirstAdmin({
        full_name: formData.full_name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setApiError(err.message || 'Error al crear el administrador');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
              <CheckCircle size={36} className="text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Configuración Completa!</h2>
          <p className="text-slate-600 mb-6">
            El administrador ha sido creado exitosamente. Redirigiendo al inicio de sesión...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
              <Store size={36} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Ferretería</h1>
          <p className="text-slate-500 mt-2">Configuración Inicial</p>
          <div className="flex items-center justify-center gap-2 mt-3 text-sm text-amber-600 bg-amber-50 rounded-2xl px-4 py-2">
            <Shield size={16} />
            <span>Primera ejecución — Crea el administrador del sistema</span>
          </div>
        </div>

        {/* API Error */}
        {apiError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700">
            <AlertCircle size={20} />
            <span className="text-sm">{apiError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                errors.full_name ? 'border-red-300 bg-red-50' : 'border-slate-300'
              }`}
              placeholder="Ej: Juan Pérez"
            />
            {errors.full_name && (
              <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre de usuario <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                errors.username ? 'border-red-300 bg-red-50' : 'border-slate-300'
              }`}
              placeholder="Ej: jperez"
            />
            {errors.username && (
              <p className="text-red-500 text-xs mt-1">{errors.username}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Correo electrónico <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                errors.email ? 'border-red-300 bg-red-50' : 'border-slate-300'
              }`}
              placeholder="Ej: juan@ejemplo.com"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Contraseña <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-10 ${
                  errors.password ? 'border-red-300 bg-red-50' : 'border-slate-300'
                }`}
                placeholder="Mínimo 8 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
            <p className="text-xs text-slate-400 mt-1">
              Mínimo 8 caracteres, 1 mayúscula, 1 número y 1 carácter especial
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Confirmar contraseña <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirm_password}
                onChange={(e) => handleChange('confirm_password', e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-10 ${
                  errors.confirm_password ? 'border-red-300 bg-red-50' : 'border-slate-300'
                }`}
                placeholder="Repite la contraseña"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirm_password && (
              <p className="text-red-500 text-xs mt-1">{errors.confirm_password}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 text-white rounded-2xl shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            {isSubmitting ? 'Creando administrador...' : 'Crear Administrador'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetupWizardPage;
