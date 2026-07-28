import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { UserOut } from '../../types/auth';

interface ProfileFormProps {
  user: UserOut;
  onSave: (data: { nombre_completo?: string; email?: string }) => Promise<void>;
}

export function ProfileForm({ user, onSave }: ProfileFormProps) {
  const [nombre, setNombre] = useState(user.nombre_completo);
  const [email, setEmail] = useState(user.email);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSuccess('');
    const errs: string[] = [];
    if (!nombre.trim()) errs.push('El nombre es obligatorio');
    if (!email.trim()) errs.push('El email es obligatorio');
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    setIsLoading(true);
    try {
      const data: { nombre_completo?: string; email?: string } = {};
      if (nombre !== user.nombre_completo) data.nombre_completo = nombre.trim();
      if (email !== user.email) data.email = email.trim();
      if (Object.keys(data).length > 0) {
        await onSave(data);
      }
      setSuccess('Perfil actualizado exitosamente');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar perfil';
      setErrors([message]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm space-y-1">
          {errors.map((err, i) => (
            <p key={i}>{err}</p>
          ))}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl text-sm">
          {success}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre completo</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo electrónico</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="px-6 py-2.5 bg-blue-600 text-white rounded-2xl shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all text-sm font-medium flex items-center gap-2"
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {isLoading ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  );
}
