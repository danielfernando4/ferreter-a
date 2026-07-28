import { useState, type FormEvent } from 'react';
import { Save, Loader2 } from 'lucide-react';
import type { UserOut } from '../../types/auth';
import * as api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface UserFormProps {
  initialData?: UserOut | null;
  onSave: () => void;
  mode: 'create' | 'edit';
}

export default function UserForm({ initialData, onSave, mode }: UserFormProps) {
  const { token } = useAuth();
  const [nombre, setNombre] = useState(initialData?.nombre_completo || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState(initialData?.rol || 'vendedor');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors('');
    setIsLoading(true);
    try {
      if (mode === 'create') {
        await api.createUsuario(token!, {
          nombre_completo: nombre.trim(),
          email: email.trim(),
          password,
          rol,
        });
      } else {
        await api.updateUsuario(token!, initialData!.id, {
          nombre_completo: nombre.trim() || undefined,
          email: email.trim() || undefined,
          rol,
        });
      }
      onSave();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar usuario';
      setErrors(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      {errors && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl border border-red-200">
          {errors}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre completo</label>
        <input
          type="text"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          required
          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900"
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
          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900"
          placeholder="usuario@ejemplo.com"
        />
      </div>

      {mode === 'create' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Rol</label>
        <select
          value={rol}
          onChange={e => setRol(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 bg-white"
        >
          <option value="administrador">Administrador</option>
          <option value="vendedor">Vendedor</option>
          <option value="almacen">Almacén</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
        {isLoading ? 'Guardando...' : mode === 'create' ? 'Crear usuario' : 'Guardar cambios'}
      </button>
    </form>
  );
}
