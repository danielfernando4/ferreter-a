import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LayoutWithNav from '../../components/LayoutWithNav';
import SessionTimer from '../../components/SessionTimer';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import { createUser, getUser, updateUser } from '../../api/client';
import { validatePassword } from '../../utils/passwordPolicy';
import { validateRequired, validateEmail, ValidationErrors } from '../../utils/validation';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';

const ROLES = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'bodega', label: 'Bodega' },
  { value: 'vendedor', label: 'Vendedor' },
  { value: 'compras', label: 'Compras' },
];

export default function UserFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    role: 'vendedor',
    is_active: true,
  });
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      setError('');
      getUser(id)
        .then((data) => {
          setFormData({
            full_name: data.full_name || '',
            username: data.username || '',
            email: data.email || '',
            password: '',
            role: data.role || 'vendedor',
            is_active: data.is_active !== undefined ? data.is_active : true,
          });
        })
        .catch((err) => {
          setError(err.message || 'Error al cargar usuario');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isEdit, id]);

  const handleChange = (field: string, value: string | boolean) => {
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

    const fnErr = validateRequired(formData.full_name, 'Nombre completo');
    if (fnErr) errors.full_name = fnErr;

    const unErr = validateRequired(formData.username, 'Nombre de usuario');
    if (unErr) errors.username = unErr;

    const emErr = validateEmail(formData.email);
    if (emErr) errors.email = emErr;

    if (!isEdit) {
      const pwErr = validateRequired(formData.password, 'Contraseña');
      if (pwErr) errors.password = pwErr;
      else {
        const pwValid = validatePassword(formData.password);
        if (!pwValid.valid) errors.password = pwValid.message;
      }
    }

    const roleErr = validateRequired(formData.role, 'Rol');
    if (roleErr) errors.role = roleErr;

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
      if (isEdit && id) {
        await updateUser(id, {
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role,
          is_active: formData.is_active,
        });
        setSuccess('Usuario actualizado exitosamente');
      } else {
        await createUser({
          full_name: formData.full_name,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        });
        setSuccess('Usuario creado exitosamente');
      }
      setTimeout(() => {
        navigate('/admin/users');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al guardar usuario');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <LayoutWithNav>
        <LoadingState message="Cargando datos del usuario..." />
      </LayoutWithNav>
    );
  }

  return (
    <LayoutWithNav>
      <SessionTimer />

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/admin/users')}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isEdit ? 'Editar usuario' : 'Nuevo usuario'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {isEdit ? 'Modifica los datos del usuario' : 'Crea un nuevo usuario en el sistema'}
            </p>
          </div>
        </div>

        {/* Success message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
            <CheckCircle size={16} />
            {success}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
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
                placeholder="Nombre del usuario"
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
                disabled={isEdit}
                className={`w-full px-4 py-2.5 rounded-xl border ${
                  fieldErrors.username ? 'border-red-300 bg-red-50' : 'border-slate-200'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  isEdit ? 'bg-slate-50 text-slate-400' : ''
                }`}
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
                Rol
              </label>
              <select
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border ${
                  fieldErrors.role ? 'border-red-300 bg-red-50' : 'border-slate-200'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white`}
              >
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              {fieldErrors.role && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.role}</p>
              )}
            </div>

            {!isEdit && (
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
            )}

            {isEdit && (
              <div className="flex items-center gap-3 py-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <span className="text-sm font-medium text-slate-700">Usuario activo</span>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-2xl shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    {isEdit ? 'Actualizando...' : 'Creando...'}
                  </>
                ) : isEdit ? (
                  'Actualizar usuario'
                ) : (
                  'Crear usuario'
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/users')}
                className="px-6 py-2.5 border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 transition-all font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </LayoutWithNav>
  );
}
