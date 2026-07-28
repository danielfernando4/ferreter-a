import { useState } from 'react';
import type { UserOut, UserCreateRequest, UserUpdateRequest } from '../../types/auth';
import { Save, X } from 'lucide-react';

interface UserFormProps {
  initialData?: UserOut;
  onSave: (data: UserCreateRequest | UserUpdateRequest) => Promise<void>;
  onCancel: () => void;
  mode: 'create' | 'edit';
}

const roles = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'vendedor', label: 'Vendedor' },
  { value: 'almacen', label: 'Almacén' },
];

export default function UserForm({ initialData, onSave, onCancel, mode }: UserFormProps) {
  const [nombre, setNombre] = useState(initialData?.nombre_completo || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState(initialData?.rol || 'vendedor');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    if (!email.trim()) newErrors.email = 'El email es obligatorio';
    if (mode === 'create' && !password) newErrors.password = 'La contraseña es obligatoria';
    if (mode === 'create' && password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
    if (!rol) newErrors.rol = 'El rol es obligatorio';
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
          nombre_completo: nombre,
          email,
          password,
          rol,
        } as UserCreateRequest);
      } else {
        const data: UserUpdateRequest = {};
        if (nombre !== initialData?.nombre_completo) data.nombre_completo = nombre;
        if (email !== initialData?.email) data.email = email;
        if (rol !== initialData?.rol) data.rol = rol;
        await onSave(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Nombre completo
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del usuario"
            className={`w-full px-4 py-2.5 rounded-xl border ${
              errors.nombre ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'
            } bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
          />
          {errors.nombre && <p className="mt-1 text-xs text-red-600">{errors.nombre}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Correo electrónico
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            className={`w-full px-4 py-2.5 rounded-xl border ${
              errors.email ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'
            } bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>

        {mode === 'create' && (
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className={`w-full px-4 py-2.5 rounded-xl border ${
                errors.password ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'
              } bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>
        )}

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Rol</label>
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            {roles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          {errors.rol && <p className="mt-1 text-xs text-red-600">{errors.rol}</p>}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all"
        >
          <X className="h-4 w-4" />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-all"
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4" />
              {mode === 'create' ? 'Crear usuario' : 'Guardar cambios'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
