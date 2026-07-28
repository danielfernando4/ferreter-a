import React, { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';
import type { UserOut } from '../../types/auth';

interface UserFormProps {
  initialData?: UserOut | null;
  mode: 'create' | 'edit';
  onSave: (data: {
    nombre_completo: string;
    email: string;
    password?: string;
    rol: string;
  }) => Promise<void>;
}

const UserForm: React.FC<UserFormProps> = ({ initialData, mode, onSave }) => {
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
    const newErrors: Record<string, string> = {};

    if (!nombreCompleto.trim()) {
      newErrors.nombreCompleto = 'El nombre completo es obligatorio.';
    }
    if (!email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'El formato del correo no es válido.';
    }
    if (mode === 'create' && !password) {
      newErrors.password = 'La contraseña es obligatoria.';
    }
    if (mode === 'create' && password && password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (!rol) {
      newErrors.rol = 'El rol es obligatorio.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const data: {
        nombre_completo: string;
        email: string;
        password?: string;
        rol: string;
      } = {
        nombre_completo: nombreCompleto.trim(),
        email: email.trim(),
        rol,
      };
      if (mode === 'create') {
        data.password = password;
      }
      await onSave(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 mb-1">
          Nombre completo *
        </label>
        <input
          id="nombre"
          type="text"
          value={nombreCompleto}
          onChange={(e) => setNombreCompleto(e.target.value)}
          placeholder="Nombre completo"
          className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm ${
            errors.nombreCompleto ? 'border-red-300 bg-red-50' : 'border-slate-300'
          }`}
        />
        {errors.nombreCompleto && (
          <p className="text-xs text-red-500 mt-1">{errors.nombreCompleto}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
          Correo electrónico *
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@ejemplo.com"
          className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm ${
            errors.email ? 'border-red-300 bg-red-50' : 'border-slate-300'
          }`}
        />
        {errors.email && (
          <p className="text-xs text-red-500 mt-1">{errors.email}</p>
        )}
      </div>

      {mode === 'create' && (
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
            Contraseña *
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm ${
              errors.password ? 'border-red-300 bg-red-50' : 'border-slate-300'
            }`}
          />
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">{errors.password}</p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="rol" className="block text-sm font-medium text-slate-700 mb-1">
          Rol *
        </label>
        <select
          id="rol"
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm bg-white ${
            errors.rol ? 'border-red-300 bg-red-50' : 'border-slate-300'
          }`}
        >
          <option value="administrador">Administrador</option>
          <option value="vendedor">Vendedor</option>
          <option value="almacen">Almacén</option>
        </select>
        {errors.rol && (
          <p className="text-xs text-red-500 mt-1">{errors.rol}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {isLoading
          ? 'Guardando...'
          : mode === 'create'
          ? 'Crear Usuario'
          : 'Guardar Cambios'}
      </button>
    </form>
  );
};

export default UserForm;
