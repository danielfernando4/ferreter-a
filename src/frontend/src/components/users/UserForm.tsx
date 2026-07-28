import { useState, type ReactNode } from 'react';
import type { UserOut } from '../../types/auth';
import { Loader2 } from 'lucide-react';

interface UserFormProps {
  initialData?: UserOut | null;
  onSave: (data: { nombre_completo: string; email: string; password?: string; rol: string }) => Promise<void>;
  mode: 'create' | 'edit';
  children?: ReactNode;
}

export default function UserForm({ initialData, onSave, mode, children }: UserFormProps) {
  const [nombreCompleto, setNombreCompleto] = useState(initialData?.nombre_completo || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState(initialData?.rol || 'vendedor');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors('');

    if (!nombreCompleto.trim() || !email.trim()) {
      setErrors('Todos los campos obligatorios deben estar completos.');
      return;
    }
    if (mode === 'create' && !password.trim()) {
      setErrors('La contraseña es obligatoria.');
      return;
    }

    setIsLoading(true);
    try {
      await onSave({
        nombre_completo: nombreCompleto,
        email,
        ...(mode === 'create' ? { password } : {}),
        rol,
      });
    } catch {
      setErrors('Error al guardar el usuario. Verifica los datos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {errors}
        </div>
      )}

      {children}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
        <input
          type="text"
          value={nombreCompleto}
          onChange={(e) => setNombreCompleto(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900"
          placeholder="Nombre completo"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900"
          placeholder="correo@ejemplo.com"
          required
        />
      </div>

      {mode === 'create' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900"
            placeholder="Contraseña"
            required
            minLength={6}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
        <select
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 bg-white"
        >
          <option value="vendedor">Vendedor</option>
          <option value="administrador">Administrador</option>
          <option value="almacen">Almacén</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
      >
        {isLoading ? <Loader2 size={20} className="animate-spin" /> : null}
        {isLoading ? 'Guardando...' : mode === 'create' ? 'Crear usuario' : 'Guardar cambios'}
      </button>
    </form>
  );
}
