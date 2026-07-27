import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Loader2, CheckCircle } from 'lucide-react';
import { checkSetupStatus, setupFirstAdmin } from '../api/client';
import { validatePassword } from '../utils/passwordPolicy';
import { validateRequired, validateEmail, validatePasswordMatch, ValidationErrors } from '../utils/validation';

export default function SetupWizardPage() {
  const navigate = useNavigate();
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    let cancelled = false;
    checkSetupStatus()
      .then((data) => {
        if (!cancelled) {
          setSetupRequired(data.setup_required);
          if (!data.setup_required) {
            navigate('/login', { replace: true });
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSetupRequired(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingStatus(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const validate = (): boolean => {
    const errors: ValidationErrors = {};

    const fnErr = validateRequired(formData.full_name, 'Nombre completo');
    if (fnErr) errors.full_name = fnErr;

    const unErr = validateRequired(formData.username, 'Nombre de usuario');
    if (unErr) errors.username = unErr;

    const emErr = validateEmail(formData.email);
    if (emErr) errors.email = emErr;

    const pwErr = validateRequired(formData.password, 'Contraseña');
    if (pwErr) errors.password = pwErr;
    else {
      const pwValid = validatePassword(formData.password);
      if (!pwValid.valid) errors.password = pwValid.message;
    }

    const cpErr = validateRequired(formData.confirm_password, 'Confirmar contraseña');
    if (cpErr) errors.confirm_password = cpErr;
    else {
      const matchErr = validatePasswordMatch(formData.password, formData.confirm_password);
      if (matchErr) errors.confirm_password = matchErr;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      await setupFirstAdmin({
        full_name: formData.full_name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al crear el administrador');
    } finally {
      setSubmitting(false);
    }
  };

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

  if (loadingStatus) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="text-slate-500 text-sm">Verificando configuración del sistema...</p>
        </div>
      </div>
    );
  }

  if (setupRequired === false) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-sm mb-4">
            <Store className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Ferretería</h1>
          <p className="text-slate-500 mt-1">Configuración inicial del sistema</p>
        </div>

        {success ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mb-4">
              <CheckCircle className="text-green-600" size={28} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">¡Administrador creado!</h2>
            <p className="text-slate-500 text-sm">Redirigiendo al inicio de sesión...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">
              Crear administrador
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border ${
                    fieldErrors.full_name ? 'border-red-300 bg-red-50' : 'border-slate-200'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  placeholder="Ingresa tu nombre completo"
                />
                {fieldErrors.full_name && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.full_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border ${
                    fieldErrors.username ? 'border-red-300 bg-red-50' : 'border-slate-200'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  placeholder="Usuario para iniciar sesión"
                />
                {fieldErrors.username && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.username}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border ${
                    fieldErrors.email ? 'border-red-300 bg-red-50' : 'border-slate-200'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  placeholder="correo@ejemplo.com"
                />
                {fieldErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border ${
                    fieldErrors.password ? 'border-red-300 bg-red-50' : 'border-slate-200'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número, 1 especial"
                />
                {fieldErrors.password && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  value={formData.confirm_password}
                  onChange={(e) => handleChange('confirm_password', e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border ${
                    fieldErrors.confirm_password ? 'border-red-300 bg-red-50' : 'border-slate-200'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  placeholder="Repite la contraseña"
                />
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
                    Configurando...
                  </>
                ) : (
                  'Configurar sistema'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
