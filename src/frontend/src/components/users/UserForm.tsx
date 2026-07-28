import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface UserFormData {
  nombre_completo: string;
  email: string;
  password?: string;
  rol: string;
}

interface UserFormProps {
  initialData?: {
    nombre_completo: string;
    email: string;
    rol: string;
  };
  onSave: (data: UserFormData) => Promise<void>;
  mode: 'create' | 'edit';
}

const ROLES = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'vendedor', label: 'Vendedor' },
  { value: 'almacen', label: 'Almacén' },
];

export default function UserForm({ initialData, onSave, mode }: UserFormProps) {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('vendedor');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (initialData) {
      setNombreCompleto(initialData.nombre_completo);
      setEmail(initialData.email);
      setRol(initialData.rol);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const validationErrors: string[] = [];
    if (!nombreCompleto.trim()) validationErrors.push('El nombre es obligatorio');
    if (!email.trim()) validationErrors.push('El email es obligatorio');
    if (mode === 'create' && !password) validationErrors.push('La contraseña es obligatoria');
    if (mode === 'create' && password && password.length < 6) validationErrors.push('La contraseña debe tener al menos 6 caracteres');

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      await onSave({
        nombre_completo: nombreCompleto.trim(),
        email: email.trim(),
        ...(mode === 'create' ? { password } : {}),
        rol,
      });
    } catch (err: any) {
      setErrors([err.message || 'Error al guardar el usuario']);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors.length > 0 && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200">
          {errors.map((err, i) => (
            <p key={i} className="text-sm text-red-700">{err}</p>
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
          value={nombreCompleto}
          onChange={(e) => setNombreCompleto(e.target.value)}
          placeholder="Juan Pérez"
          required
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
          placeholder="correo@ejemplo.com"
          required
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
            placeholder="Mínimo 6 caracteres"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Guardando...
          </>
        ) : (
          mode === 'create' ? 'Crear usuario' : 'Guardar cambios'
        )}
      </button>
    </form>
  );
}
