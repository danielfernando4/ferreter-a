import { useState } from 'react';
import type { UserOut, PerfilUpdateRequest } from '../../types/auth';
import { Save, X } from 'lucide-react';

interface ProfileFormProps {
  user: UserOut;
  onSave: (data: PerfilUpdateRequest) => Promise<void>;
}

export default function ProfileForm({ user, onSave }: ProfileFormProps) {
  const [nombre, setNombre] = useState(user.nombre_completo);
  const [email, setEmail] = useState(user.email);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const data: PerfilUpdateRequest = {};
      if (nombre !== user.nombre_completo) data.nombre_completo = nombre;
      if (email !== user.email) data.email = email;
      if (Object.keys(data).length === 0) {
        setIsLoading(false);
        return;
      }
      await onSave(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al guardar los cambios');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre completo</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo electrónico</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-all"
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4" />
              Guardar cambios
            </>
          )}
        </button>
      </div>
    </form>
  );
}
