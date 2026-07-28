import { useState } from 'react';
import { Loader2, UserPlus, Save } from 'lucide-react';
import type { UserOut, UserCreateRequest, UserUpdateRequest } from '../../types/auth';

interface UserFormProps {
  initialData?: UserOut | null;
  onSave: (data: UserCreateRequest | UserUpdateRequest) => Promise<void>;
  mode: 'create' | 'edit';
}

export default function UserForm({ initialData, onSave, mode }: UserFormProps) {
  const [nombreCompleto, setNombreCompleto] = useState(initialData?.nombre_completo || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState(initialData?.rol || 'vendedor');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!nombreCompleto.trim()) {
      newErrors.nombreCompleto = 'El nombre es obligatorio';
    }
    if (!email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email inválido';
    }
    if (mode === 'create' && !password.trim()) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (mode === 'create' && password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres';
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
        await onSave({
          nombre_completo: nombreCompleto.trim(),
          email: email.trim(),
          password,
          rol,
        } as UserCreateRequest);
      } else {
        const data: UserUpdateRequest = {};
        if (nombreCompleto !== initialData?.nombre_completo) data.nombre_completo = nombreCompleto.trim();
        if (email !== initialData?.email) data.email = email.trim();
        if (rol !== initialData?.rol) data.rol = rol;
        await onSave(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Nombre Completo <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={nombreCompleto}
          onChange={(e) => setNombreCompleto(e.target.value)}
          className={`w-full px-4 py-2.5 rounded-xl border ${
            errors.nombreCompleto ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-indigo-500'
          } focus:ring-2 focus:border-indigo-500 outline-none transition-all text-sm`}
          placeholder="Nombre completo"
        />
        {errors.nombreCompleto && (
          <p className="mt-1 text-xs text-red-600">{errors.nombreCompleto}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full px-4 py-2.5 rounded-xl border ${
            errors.email ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-indigo-500'
          } focus:ring-2 focus:border-indigo-500 outline-none transition-all text-sm`}
          placeholder="correo@ejemplo.com"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-600">{errors.email}</p>
        )}
      </div>

      {mode === 'create' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Contraseña <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl border ${
              errors.password ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-indigo-500'
            } focus:ring-2 focus:border-indigo-500 outline-none transition-all text-sm`}
            placeholder="Mínimo 6 caracteres"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password}</p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Rol <span className="text-red-500">*</span>
        </label>
        <select
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm bg-white"
        >
          <option value="administrador">Administrador</option>
          <option value="vendedor">Vendedor</option>
          <option value="almacen">Almacén</option>
        </select>
        {errors.rol && (
          <p className="mt-1 text-xs text-red-600">{errors.rol}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {mode === 'create' ? 'Creando...' : 'Guardando...'}
          </>
        ) : mode === 'create' ? (
          <>
            <UserPlus className="h-4 w-4" />
            Crear Usuario
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Guardar Cambios
          </>
        )}
      </button>
    </form>
  );
}
