import React, { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';
import { UserOut, UserCreateRequest, UserUpdateRequest } from '../../services/api';

interface UserFormProps {
  initialData?: UserOut;
  onSave: (
    data: UserCreateRequest | UserUpdateRequest
  ) => Promise<void>;
  mode: 'create' | 'edit';
}

const roles = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'vendedor', label: 'Vendedor / Cajero' },
  { value: 'almacen', label: 'Almacén / Compras' },
];

export default function UserForm({ initialData, onSave, mode }: UserFormProps) {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('vendedor');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setNombreCompleto(initialData.nombre_completo || '');
      setEmail(initialData.email || '');
      setRol(initialData.rol || 'vendedor');
    }
  }, [initialData]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!nombreCompleto.trim()) errs.nombreCompleto = 'El nombre es obligatorio';
    if (!email.trim()) errs.email = 'El email es obligatorio';
    if (mode === 'create' && !password) errs.password = 'La contraseña es obligatoria';
    if (mode === 'create' && password && password.length < 6)
      errs.password = 'Mínimo 6 caracteres';
    if (!rol) errs.rol = 'Selecciona un rol';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        if (nombreCompleto !== initialData?.nombre_completo) data.nombre_completo = nombreCompleto.trim();
        if (email !== initialData?.email) data.email = email.trim();
        if (rol !== initialData?.rol) data.rol = rol;
        await onSave(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-2.5 rounded-xl border ${
      errors[field]
        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
        : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
    } focus:ring-2 outline-none bg-white text-slate-900 transition-all`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Nombre completo <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={nombreCompleto}
          onChange={(e) => setNombreCompleto(e.target.value)}
          className={inputClass('nombreCompleto')}
          placeholder="Nombre del usuario"
          disabled={isLoading}
        />
        {errors.nombreCompleto && (
          <p className="text-xs text-red-500 mt-1">{errors.nombreCompleto}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Correo electrónico <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass('email')}
          placeholder="usuario@correo.com"
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-xs text-red-500 mt-1">{errors.email}</p>
        )}
      </div>

      {mode === 'create' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Contraseña <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass('password')}
            placeholder="Mínimo 6 caracteres"
            disabled={isLoading}
          />
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">{errors.password}</p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Rol <span className="text-red-500">*</span>
        </label>
        <select
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          className={inputClass('rol')}
          disabled={isLoading}
        >
          {roles.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        {errors.rol && (
          <p className="text-xs text-red-500 mt-1">{errors.rol}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all font-medium"
      >
        {isLoading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <Save size={18} />
        )}
        {isLoading
          ? 'Guardando...'
          : mode === 'create'
          ? 'Crear usuario'
          : 'Guardar cambios'}
      </button>
    </form>
  );
}
