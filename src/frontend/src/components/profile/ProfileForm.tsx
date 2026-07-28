import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import type { UserOut } from '../../types/auth';
import { updatePerfil } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface ProfileFormProps {
  user: UserOut;
  onSave: () => void;
}

export default function ProfileForm({ user, onSave }: ProfileFormProps) {
  const { updateUser } = useAuth();
  const [nombre, setNombre] = useState(user.nombre_completo);
  const [email, setEmail] = useState(user.email);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const data: { nombre_completo?: string; email?: string } = {};
      if (nombre !== user.nombre_completo) data.nombre_completo = nombre;
      if (email !== user.email) data.email = email;
      if (Object.keys(data).length === 0) {
        onSave();
        return;
      }
      const updated = await updatePerfil(data);
      updateUser(updated);
      onSave();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar perfil';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre completo</label>
        <input
          type="text"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          required
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo electrónico</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="py-2.5 px-6 rounded-xl bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isLoading && <Loader2 size={18} className="animate-spin" />}
        {isLoading ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  );
}
