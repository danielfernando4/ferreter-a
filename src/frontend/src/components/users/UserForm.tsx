import { useState, type FormEvent } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import type { UserOut, UserCreateRequest, UserUpdateRequest } from '../../types/auth';
import * as api from '../../services/api';

interface UserFormProps {
  initialData?: UserOut | null;
  mode: 'create' | 'edit';
  onSave: () => void;
  onCancel: () => void;
}

const roles = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'vendedor', label: 'Vendedor' },
  { value: 'almacen', label: 'Almacén' },
];

export default function UserForm({
  initialData,
  mode,
  onSave,
  onCancel,
}: UserFormProps) {
  const [nombreCompleto, setNombreCompleto] = useState(
    initialData?.nombre_completo ?? ''
  );
  const [email, setEmail] = useState(initialData?.email ?? '');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState(initialData?.rol ?? 'vendedor');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors([]);

    const fieldErrors: string[] = [];
    if (!nombreCompleto.trim()) fieldErrors.push('El nombre es obligatorio.');
    if (!email.trim()) fieldErrors.push('El email es obligatorio.');
    if (mode === 'create' && !password) fieldErrors.push('La contraseña es obligatoria.');
    if (mode === 'create' && password.length < 6)
      fieldErrors.push('La contraseña debe tener al menos 6 caracteres.');
    if (!rol) fieldErrors.push('El rol es obligatorio.');

    if (fieldErrors.length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'create') {
        const data: UserCreateRequest = {
          nombre_completo: nombreCompleto.trim(),
          email: email.trim(),
          password,
          rol,
        };
        await api.createUsuario(data);
      } else if (initialData) {
        const data: UserUpdateRequest = {};
        if (nombreCompleto.trim() !== initialData.nombre_completo)
          data.nombre_completo = nombreCompleto.trim();
        if (email.trim() !== initialData.email) data.email = email.trim();
        if (rol !== initialData.rol) data.rol = rol;
        await api.updateUsuario(initialData.id, data);
      }
      onSave();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al guardar el usuario';
      setErrors([message]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      {errors.length > 0 && (
        <div className="space-y-1 p-4 rounded-2xl bg-red-50">
          {errors.map((err, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Nombre Completo *
        </label>
        <input
          type="text"
          value={nombreCompleto}
          onChange={(e) => setNombreCompleto(e.target.value)}
          required
          placeholder="Nombre del usuario"
          className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Email *
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="usuario@correo.com"
          className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      {mode === 'create' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Contraseña *
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
            className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Rol *
        </label>
        <select
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        >
          {roles.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50 transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          ) : (
            <>
              <Save className="w-5 h-5" />
              {mode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
