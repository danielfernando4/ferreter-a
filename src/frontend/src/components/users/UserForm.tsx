import { useState, useEffect } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import type { UserOut, UserCreateRequest, UserUpdateRequest } from '../../types/auth';
import { createUsuario, updateUsuario } from '../../services/api';

interface UserFormProps {
  initialData?: UserOut | null;
  mode: 'create' | 'edit';
  onSave: () => void;
  onCancel: () => void;
}

export default function UserForm({ initialData, mode, onSave, onCancel }: UserFormProps) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rol, setRol] = useState('vendedor');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (initialData) {
      setNombre(initialData.nombre_completo);
      setEmail(initialData.email);
      setRol(initialData.rol);
    }
  }, [initialData]);

  const validate = (): boolean => {
    if (!nombre.trim() || !email.trim()) {
      setErrors('Nombre y email son obligatorios');
      return false;
    }
    if (mode === 'create' && (!password.trim() || !confirmPassword.trim())) {
      setErrors('La contraseña es obligatoria');
      return false;
    }
    if (mode === 'create' && password.length < 6) {
      setErrors('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (mode === 'create' && password !== confirmPassword) {
      setErrors('Las contraseñas no coinciden');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setErrors('');
    try {
      if (mode === 'create') {
        const data: UserCreateRequest = {
          nombre_completo: nombre.trim(),
          email: email.trim(),
          password,
          rol,
        };
        await createUsuario(data);
      } else if (initialData) {
        const data: UserUpdateRequest = {};
        if (nombre.trim() !== initialData.nombre_completo) data.nombre_completo = nombre.trim();
        if (email.trim() !== initialData.email) data.email = email.trim();
        if (rol !== initialData.rol) data.rol = rol;
        await updateUsuario(initialData.id, data);
      }
      onSave();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar el usuario';
      setErrors(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      {errors && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {errors}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
          placeholder="Nombre del usuario"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
          placeholder="usuario@ejemplo.com"
        />
      </div>
      {mode === 'create' && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 pr-10"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
              placeholder="Repite la contraseña"
            />
          </div>
        </>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
        <select
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white"
        >
          <option value="administrador">Administrador</option>
          <option value="vendedor">Vendedor</option>
          <option value="almacen">Almacén</option>
        </select>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-all flex items-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isLoading ? 'Guardando...' : mode === 'create' ? 'Crear usuario' : 'Guardar cambios'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
