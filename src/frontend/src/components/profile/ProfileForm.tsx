import React, { useState } from 'react';
import { Loader2, Save, User } from 'lucide-react';
import { UserOut } from '../../services/api';

interface ProfileFormProps {
  user: UserOut;
  onSave: (data: { nombre_completo?: string; email?: string }) => Promise<void>;
}

export default function ProfileForm({ user, onSave }: ProfileFormProps) {
  const [nombreCompleto, setNombreCompleto] = useState(user.nombre_completo);
  const [email, setEmail] = useState(user.email);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCompleto.trim() || !email.trim()) {
      setError('Todos los campos son obligatorios');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const data: { nombre_completo?: string; email?: string } = {};
      if (nombreCompleto !== user.nombre_completo) data.nombre_completo = nombreCompleto.trim();
      if (email !== user.email) data.email = email.trim();
      if (Object.keys(data).length > 0) {
        await onSave(data);
      }
      setSuccess('Perfil actualizado exitosamente');
    } catch (err: any) {
      setError(err.detail || 'Error al actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-blue-100 rounded-xl">
          <User className="text-blue-600" size={24} />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Datos personales</h3>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Nombre completo
        </label>
        <input
          type="text"
          value={nombreCompleto}
          onChange={(e) => setNombreCompleto(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Correo electrónico
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900"
          disabled={isLoading}
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 text-sm px-4 py-2 rounded-xl border border-green-200">
          {success}
        </div>
      )}

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
        {isLoading ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  );
}
