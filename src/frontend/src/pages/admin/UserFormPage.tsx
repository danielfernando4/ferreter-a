import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createUser, updateUser, getUser } from '../../api/client';
import { validateRequired, validateEmail, validatePasswordPolicy } from '../../utils/validation';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import { Users, AlertCircle, Eye, EyeOff, Save, ArrowLeft } from 'lucide-react';

const ROLES = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'bodega', label: 'Bodega' },
  { value: 'vendedor', label: 'Vendedor' },
  { value: 'compras', label: 'Compras' },
];

const UserFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('vendedor');
  const [isActive, setIsActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      const loadUser = async () => {
        try {
          const user = await getUser(id);
          setFullName(user.full_name);
          setUsername(user.username);
          setEmail(user.email);
          setRole(user.role);
          setIsActive(user.is_active);
        } catch (err: any) {
          setLoadError(err.message || 'Error al cargar usuario');
        } finally {
          setLoading(false);
        }
      };
      loadUser();
    }
  }, [isEdit, id]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const nameErr = validateRequired(fullName, 'Nombre completo');
    if (nameErr) newErrors.full_name = nameErr;

    if (!isEdit) {
      const usernameErr = validateRequired(username, 'Nombre de usuario');
      if (usernameErr) newErrors.username = usernameErr;
    }

    const emailErr = validateEmail(email);
    if (emailErr) newErrors.email = emailErr;

    if (!isEdit) {
      const passErr = validatePasswordPolicy(password);
      if (passErr) newErrors.password = passErr;

      if (password !== confirmPassword) {
        newErrors.confirm_password = 'Las contraseñas no coinciden';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      if (isEdit && id) {
        await updateUser(id, {
          full_name: fullName,
          email,
          role,
          is_active: isActive,
        });
      } else {
        await createUser({
          full_name: fullName,
          username,
          email,
          password,
          role,
        });
      }
      navigate('/admin/users');
    } catch (err: any) {
      setApiError(err.message || 'Error al guardar usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Cargando usuario..." />;
  if (loadError) return <ErrorState message={loadError} onRetry={() => navigate('/admin/users')} />;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/admin/users')}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
          <Users size={28} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h1>
          <p className="text-slate-500">
            {isEdit ? 'Modifica los datos del usuario' : 'Crea un nuevo usuario en el sistema'}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        {/* API Error */}
        {apiError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700">
            <AlertCircle size={20} />
            <span className="text-sm">{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setErrors({});
              }}
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
              Nombre de usuario {!isEdit && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setErrors({});
              }}
              disabled={isEdit}
              className={`w-full px-4 py-2.5 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                isEdit ? 'bg-slate-50 text-slate-400' : ''
              } ${errors.username ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
              placeholder="Ej: jperez"
            />
            {errors.username && (
              <p className="text-red-500 text-xs mt-1">{errors.username}</p>
            )}
            {isEdit && (
              <p className="text-xs text-slate-400 mt-1">El nombre de usuario no se puede modificar</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Correo electrónico <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors({});
              }}
              className={`w-full px-4 py-2.5 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                errors.email ? 'border-red-300 bg-red-50' : 'border-slate-300'
              }`}
              placeholder="Ej: juan@ejemplo.com"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password (only for create) */}
          {!isEdit && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors({});
                    }}
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Confirmar contraseña <span className="text-red-500">*</span>
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
                      errors.confirm_password ? 'border-red-300 bg-red-50' : 'border-slate-300'
                    }`}
                    placeholder="Repite la contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirm_password && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirm_password}</p>
                )}
              </div>
            </>
          )}

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Rol <span className="text-red-500">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Active (only for edit) */}
          {isEdit && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                Usuario activo
              </label>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-2xl shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Save size={20} />
              {isSubmitting
                ? 'Guardando...'
                : isEdit
                ? 'Guardar Cambios'
                : 'Crear Usuario'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200 transition-all"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormPage;
