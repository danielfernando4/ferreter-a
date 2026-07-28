import { useState, type FormEvent } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import type { UserOut, UserCreateRequest, UserUpdateRequest } from '../../types/auth';
import { createUsuario, updateUsuario } from '../../services/api';

interface UserFormProps {
  initialData?: UserOut;
  onSave: () => void;
  mode: 'create' | 'edit';
}

export default function UserForm({ initialData, onSave, mode }: UserFormProps) {
  const [nombre, setNombre] = useState(initialData?.nombre_completo || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState(initialData?.rol || 'vendedor');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (mode === 'create') {
        const data: UserCreateRequest = { nombre_completo: nombre, email, password, rol };
        await createUsuario(data);
      } else {
        const data: UserUpdateRequest = {};
        if (nombre !== initialData?.nombre_completo) data.nombre_completo = nombre;
        if (email !== initialData?.email) data.email = email;
        if (rol !== initialData?.rol) data.rol = rol;
        if (initialData) await updateUsuario(initialData.id, data);
      }
      onSave();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar usuario';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre completo</label>
        <input
          type="text"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          required
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none text-sm"
          placeholder="Nombre del usuario"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo electrónico</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none text-sm"
          placeholder="correo@ejemplo.com"
        />
      </div>

      {mode === 'create' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none text-sm pr-10"
              placeholder="Mínimo 6 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Rol</label>
        <select
          value={rol}
          onChange={e => setRol(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none text-sm bg-white"
        >
          <option value="administrador">Administrador</option>
          <option value="vendedor">Vendedor</option>
          <option value="almacen">Almacén</option>
        </select>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 size={18} className="animate-spin" />}
          {isLoading ? 'Guardando...' : mode === 'create' ? 'Crear usuario' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
