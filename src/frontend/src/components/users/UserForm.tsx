import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import type { UserOut, UserCreateRequest, UserUpdateRequest } from '../../types/auth';

interface UserFormProps {
  initialData?: UserOut | null;
  onSave: (data: UserCreateRequest | UserUpdateRequest) => Promise<void>;
  mode: 'create' | 'edit';
}

const roles = ['administrador', 'vendedor', 'almacen'];

export function UserForm({ initialData, onSave, mode }: UserFormProps) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('vendedor');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (initialData) {
      setNombre(initialData.nombre_completo);
      setEmail(initialData.email);
      setRol(initialData.rol);
    }
  }, [initialData]);

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!nombre.trim()) errs.push('El nombre es obligatorio');
    if (!email.trim()) errs.push('El email es obligatorio');
    if (mode === 'create' && !password) errs.push('La contraseña es obligatoria');
    if (mode === 'create' && password && password.length < 6) errs.push('La contraseña debe tener al menos 6 caracteres');
    if (!rol) errs.push('El rol es obligatorio');
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    setIsLoading(true);
    try {
      if (mode === 'create') {
        await onSave({ nombre_completo: nombre.trim(), email: email.trim(), password, rol } as UserCreateRequest);
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm space-y-1">
          {errors.map((err, i) => (
            <p key={i}>{err}</p>
          ))}
        </div>
      )}

      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 mb-1.5">
          Nombre completo
        </label>
        <input
          id="nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
          placeholder="Nombre del usuario"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
          placeholder="correo@ejemplo.com"
        />
      </div>

      {mode === 'create' && (
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={mode === 'create'}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
            placeholder="••••••••"
          />
        </div>
      )}

      <div>
        <label htmlFor="rol" className="block text-sm font-medium text-slate-700 mb-1.5">
          Rol
        </label>
        <select
          id="rol"
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all bg-white"
        >
          {roles.map((r) => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-2xl shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all text-sm font-medium flex items-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isLoading ? 'Guardando...' : mode === 'create' ? 'Crear usuario' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
