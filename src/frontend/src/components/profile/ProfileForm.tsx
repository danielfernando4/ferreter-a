import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { UserOut } from '../../types/auth';
import { updatePerfil } from '../../services/api';

interface ProfileFormProps {
  user: UserOut;
  onSave: (user: UserOut) => void;
}

export default function ProfileForm({ user, onSave }: ProfileFormProps) {
  const [nombre, setNombre] = useState(user.nombre_completo);
  const [email, setEmail] = useState(user.email);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim()) {
      setError('Todos los campos son obligatorios');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const data: { nombre_completo?: string; email?: string } = {};
      if (nombre.trim() !== user.nombre_completo) data.nombre_completo = nombre.trim();
      if (email.trim() !== user.email) data.email = email.trim();
      if (Object.keys(data).length === 0) {
        setSuccess('Sin cambios que guardar');
        setIsLoading(false);
        return;
      }
      const updated = await updatePerfil(data);
      onSave(updated);
      setSuccess('Perfil actualizado exitosamente');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar el perfil';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}
      {success && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">{success}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-all flex items-center gap-2"
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {isLoading ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  );
}
