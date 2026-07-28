import { useState, useEffect } from 'react';
import type { UserOut, UserCreateRequest, UserUpdateRequest } from '../../types/auth';
import { Loader2, Save } from 'lucide-react';

interface UserFormProps {
  initialData?: UserOut | null;
  mode: 'create' | 'edit';
  onSave: (data: UserCreateRequest | UserUpdateRequest) => Promise<void>;
}

const roles = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'vendedor', label: 'Vendedor / Cajero' },
  { value: 'almacen', label: 'Almacén / Compras' },
];

export default function UserForm({ initialData, mode, onSave }: UserFormProps) {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rol, setRol] = useState('vendedor');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setNombreCompleto(initialData.nombre_completo);
      setEmail(initialData.email);
      setRol(initialData.rol);
    }
  }, [initialData]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!nombreCompleto.trim()) newErrors.nombreCompleto = 'El nombre es obligatorio';
    if (!email.trim()) newErrors.email = 'El email es obligatorio';
    if (mode === 'create') {
      if (!password) newErrors.password = 'La contraseña es obligatoria';
      else if (password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
      if (password !== confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    if (!rol) newErrors.rol = 'Selecciona un rol';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
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
        if (nombreCompleto.trim() !== initialData?.nombre_completo) data.nombre_completo = nombreCompleto.trim();
        if (email.trim() !== initialData?.email) data.email = email.trim();
        if (rol !== initialData?.rol) data.rol = rol;
        await onSave(data);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
        <input
          type="text"
          value={nombreCompleto}
          onChange={(e) => setNombreCompleto(e.target.value)}
          placeholder="Nombre del usuario"
          className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          disabled={isLoading}
        />
        {errors.nombreCompleto && (
          <p className="text-xs text-red-600 mt-1">{errors.nombreCompleto}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@ejemplo.com"
          className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-xs text-red-600 mt-1">{errors.email}</p>
        )}
      </div>

      {mode === 'create' && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">{errors.password}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contraseña"
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>
            )}
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
        <select
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white"
          disabled={isLoading}
        >
          {roles.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        {errors.rol && (
          <p className="text-xs text-red-600 mt-1">{errors.rol}</p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-all"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isLoading ? 'Guardando...' : mode === 'create' ? 'Crear usuario' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
