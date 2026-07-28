import { useState, type FormEvent, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface UserFormData {
  nombre_completo: string;
  email: string;
  password?: string;
  rol: string;
}

interface UserFormProps {
  initialData?: { nombre_completo: string; email: string; rol: string };
  mode: 'create' | 'edit';
  onSave: (data: UserFormData) => Promise<void>;
}

export default function UserForm({ initialData, mode, onSave }: UserFormProps) {
  const [nombre, setNombre] = useState(initialData?.nombre_completo || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState(initialData?.rol || 'vendedor');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState('');

  useEffect(() => {
    if (initialData) {
      setNombre(initialData.nombre_completo);
      setEmail(initialData.email);
      setRol(initialData.rol);
    }
  }, [initialData]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors('');

    if (!nombre.trim()) { setErrors('El nombre es obligatorio'); return; }
    if (!email.trim()) { setErrors('El email es obligatorio'); return; }
    if (mode === 'create' && !password) { setErrors('La contraseña es obligatoria'); return; }
    if (mode === 'create' && password.length < 6) { setErrors('La contraseña debe tener al menos 6 caracteres'); return; }

    setIsLoading(true);
    try {
      const data: UserFormData = { nombre_completo: nombre.trim(), email: email.trim(), rol };
      if (mode === 'create' && password) {
        data.password = password;
      }
      await onSave(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      setErrors(msg);
    }
    setIsLoading(false);
  };

  const roles = [
    { value: 'administrador', label: 'Administrador' },
    { value: 'vendedor', label: 'Vendedor / Cajero' },
    { value: 'almacen', label: 'Almacén / Comprador' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{errors}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Nombre completo
        </label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
          placeholder="Juan Pérez"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Correo electrónico
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
          placeholder="correo@ejemplo.com"
          disabled={isLoading}
        />
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
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
            placeholder="••••••••"
            disabled={isLoading}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Rol
        </label>
        <select
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
          disabled={isLoading}
        >
          {roles.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <span>{mode === 'create' ? 'Crear usuario' : 'Guardar cambios'}</span>
        )}
      </button>
    </form>
  );
}
