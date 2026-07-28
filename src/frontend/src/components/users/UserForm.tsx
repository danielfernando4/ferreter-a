import { useState, useEffect } from 'react';
import { Loader2, User, Mail, Lock, Shield } from 'lucide-react';
import type { UserOut, UserCreateRequest, UserUpdateRequest } from '../../types/auth';
import { createUsuario, updateUsuario } from '../../services/api';

interface UserFormProps {
  initialData?: UserOut;
  onSave: () => void;
  mode: 'create' | 'edit';
}

const ROLES = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'vendedor', label: 'Vendedor / Cajero' },
  { value: 'almacen', label: 'Almacén / Comprador' },
];

export function UserForm({ initialData, onSave, mode }: UserFormProps) {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('vendedor');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setNombreCompleto(initialData.nombre_completo || '');
      setEmail(initialData.email || '');
      setRol(initialData.rol || 'vendedor');
    }
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!nombreCompleto.trim()) {
      newErrors.nombreCompleto = 'El nombre es obligatorio';
    }
    if (!email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio';
    } else if (!email.includes('@')) {
      newErrors.email = 'Correo electrónico inválido';
    }
    if (mode === 'create' && !password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (mode === 'create' && password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    if (!rol) {
      newErrors.rol = 'El rol es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      if (mode === 'create') {
        const data: UserCreateRequest = {
          nombre_completo: nombreCompleto.trim(),
          email: email.trim(),
          password,
          rol,
        };
        await createUsuario(data);
      } else if (initialData) {
        const data: UserUpdateRequest = {
          nombre_completo: nombreCompleto.trim(),
          email: email.trim(),
          rol,
        };
        await updateUsuario(initialData.id, data);
      }
      onSave();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrors({ form: err.message || 'Error al guardar usuario' });
      } else {
        setErrors({ form: 'Error al guardar usuario' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors.form && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-2xl text-sm">
          {errors.form}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Nombre Completo
        </label>
        <div className="relative">
          <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={nombreCompleto}
            onChange={(e) => setNombreCompleto(e.target.value)}
            placeholder="Nombre del usuario"
            className={`w-full pl-10 pr-4 py-2.5 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm ${
              errors.nombreCompleto ? 'border-red-300 bg-red-50' : 'border-slate-300'
            }`}
          />
        </div>
        {errors.nombreCompleto && (
          <p className="text-red-500 text-xs mt-1">{errors.nombreCompleto}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Correo Electrónico
        </label>
        <div className="relative">
          <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            className={`w-full pl-10 pr-4 py-2.5 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm ${
              errors.email ? 'border-red-300 bg-red-50' : 'border-slate-300'
            }`}
          />
        </div>
        {errors.email && (
          <p className="text-red-500 text-xs mt-1">{errors.email}</p>
        )}
      </div>

      {mode === 'create' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Contraseña
          </label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className={`w-full pl-10 pr-4 py-2.5 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm ${
                errors.password ? 'border-red-300 bg-red-50' : 'border-slate-300'
              }`}
            />
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Rol
        </label>
        <div className="relative">
          <Shield size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm appearance-none bg-white ${
              errors.rol ? 'border-red-300 bg-red-50' : 'border-slate-300'
            }`}
          >
            <option value="">Selecciona un rol</option>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        {errors.rol && (
          <p className="text-red-500 text-xs mt-1">{errors.rol}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-2xl shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
      >
        {isLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <User size={18} />
        )}
        {isLoading
          ? 'Guardando...'
          : mode === 'create'
          ? 'Crear Usuario'
          : 'Actualizar Usuario'}
      </button>
    </form>
  );
}
