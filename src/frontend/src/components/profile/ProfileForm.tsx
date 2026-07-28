import React, { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';
import type { UserOut } from '../../types/auth';

interface ProfileFormProps {
  user: UserOut;
  onSave: (data: { nombre_completo?: string; email?: string }) => Promise<void>;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ user, onSave }) => {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setNombreCompleto(user.nombre_completo || '');
    setEmail(user.email || '');
  }, [user]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!nombreCompleto.trim()) {
      newErrors.nombreCompleto = 'El nombre es obligatorio.';
    }
    if (!email.trim()) {
      newErrors.email = 'El correo es obligatorio.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Formato de correo inválido.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setSuccess(false);
    try {
      await onSave({
        nombre_completo: nombreCompleto.trim(),
        email: email.trim(),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar.';
      setErrors({ submit: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {errors.submit}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-600">
          Perfil actualizado exitosamente.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Nombre completo
        </label>
        <input
          type="text"
          value={nombreCompleto}
          onChange={(e) => setNombreCompleto(e.target.value)}
          className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm ${
            errors.nombreCompleto ? 'border-red-300' : 'border-slate-300'
          }`}
        />
        {errors.nombreCompleto && (
          <p className="text-xs text-red-500 mt-1">{errors.nombreCompleto}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Correo electrónico
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm ${
            errors.email ? 'border-red-300' : 'border-slate-300'
          }`}
        />
        {errors.email && (
          <p className="text-xs text-red-500 mt-1">{errors.email}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {isLoading ? 'Guardando...' : 'Guardar Cambios'}
      </button>
    </form>
  );
};

export default ProfileForm;
