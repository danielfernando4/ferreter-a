import { useState, type FormEvent } from 'react';
import type { UserOut } from '../../types/auth';
import { Save } from 'lucide-react';

interface UserFormProps {
  initialData?: Partial<UserOut>;
  onSave: (data: Record<string, string>) => Promise<void>;
  mode: 'create' | 'edit';
}

export function UserForm({ initialData, onSave, mode }: UserFormProps) {
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
    if (mode === 'create' && password && password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
    if (!rol) newErrors.rol = 'El rol es obligatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const data: Record<string, string> = { nombre_completo: nombre, email, rol };
      if (mode === 'create') data.password = password;
      await onSave(data);
    } catch {
      // error handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre completo</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className={`w-full px-4 py-2.5 rounded-xl border ${
            errors.nombre ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'
          } focus:ring-2 focus:border-transparent outline-none transition-all text-slate-900`}
          placeholder="Nombre del usuario"
          disabled={isLoading}
        />
        {errors.nombre && <p className="mt-1 text-xs text-red-600">{errors.nombre}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo electrónico</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full px-4 py-2.5 rounded-xl border ${
            errors.email ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'
          } focus:ring-2 focus:border-transparent outline-none transition-all text-slate-900`}
          placeholder="correo@ejemplo.com"
          disabled={isLoading}
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
      </div>

      {mode === 'create' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl border ${
              errors.password ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'
            } focus:ring-2 focus:border-transparent outline-none transition-all text-slate-900`}
            placeholder="Mínimo 6 caracteres"
            disabled={isLoading}
          />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Rol</label>
        <select
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          className={`w-full px-4 py-2.5 rounded-xl border ${
            errors.rol ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'
          } focus:ring-2 focus:border-transparent outline-none transition-all text-slate-900 bg-white`}
          disabled={isLoading}
        >
          <option value="administrador">Administrador</option>
          <option value="vendedor">Vendedor</option>
          <option value="almacen">Almacén</option>
        </select>
        {errors.rol && <p className="mt-1 text-xs text-red-600">{errors.rol}</p>}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Save className="w-4 h-4" />
            {mode === 'create' ? 'Crear usuario' : 'Guardar cambios'}
          </>
        )}
      </button>
    </form>
  );
}
