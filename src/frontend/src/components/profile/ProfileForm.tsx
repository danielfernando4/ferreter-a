import { useState } from 'react';
import type { UserOut } from '../../types/auth';
import { Loader2 } from 'lucide-react';

interface ProfileFormProps {
  user: UserOut;
  onSave: (data: { nombre_completo?: string; email?: string }) => Promise<void>;
}

export default function ProfileForm({ user, onSave }: ProfileFormProps) {
  const [nombreCompleto, setNombreCompleto] = useState(user.nombre_completo);
  const [email, setEmail] = useState(user.email);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);
    try {
      await onSave({ nombre_completo: nombreCompleto, email });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Error al guardar los cambios.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          Perfil actualizado exitosamente.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
        <input
          type="text"
          value={nombreCompleto}
          onChange={(e) => setNombreCompleto(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
      >
        {isLoading ? <Loader2 size={20} className="animate-spin" /> : null}
        {isLoading ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  );
}
