import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import type { UserOut, UserCreateRequest, UserUpdateRequest } from '../../types/auth';

interface UserFormProps {
  initialData?: UserOut;
  onSave: (data: UserCreateRequest | UserUpdateRequest) => Promise<void>;
  mode: 'create' | 'edit';
  onCancel: () => void;
}

export default function UserForm({ initialData, onSave, mode, onCancel }: UserFormProps) {
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
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email inválido';
    if (mode === 'create' && !password) newErrors.password = 'La contraseña es obligatoria';
    if (mode === 'create' && password && password.length < 6)
      newErrors.password = 'Mínimo 6 caracteres';
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
          nombre_completo: nombre.trim(),
          email: email.trim(),
          password,
          rol,
        } as UserCreateRequest);
      } else {
        const data: UserUpdateRequest = {};
        if (nombre !== initialData?.nombre_completo) data.nombre_completo = nombre.trim();
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
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Nombre completo
        </label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className={`w-full px-4 py-2.5 rounded-xl border ${
            errors.nombre ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-300'
          } focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm`}
          placeholder="Nombre del usuario"
        />
        {errors.nombre && <p className="mt-1 text-xs text-red-600">{errors.nombre}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Correo electrónico
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full px-4 py-2.5 rounded-xl border ${
            errors.email ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-300'
          } focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm`}
          placeholder="correo@ejemplo.com"
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
      </div>

      {mode === 'create' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl border ${
              errors.password ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-300'
            } focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm`}
            placeholder="Mínimo 6 caracteres"
          />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Rol</label>
        <select
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-sm bg-white"
        >
          <option value="administrador">Administrador</option>
          <option value="vendedor">Vendedor / Cajero</option>
          <option value="almacen">Almacén / Comprador</option>
        </select>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isLoading
            ? 'Guardando...'
            : mode === 'create'
              ? 'Crear usuario'
              : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
