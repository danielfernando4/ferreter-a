import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getUsuario } from '../services/api';
import type { UserOut } from '../types/auth';
import UserForm from '../components/users/UserForm';

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getUsuario(Number(id))
      .then(setUser)
      .catch(err => {
        const msg = err instanceof Error ? err.message : 'Error al cargar usuario';
        setError(msg);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error || 'Usuario no encontrado'}
        </div>
        <button
          onClick={() => navigate('/usuarios')}
          className="mt-4 text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1"
        >
          <ArrowLeft size={16} />
          Volver a usuarios
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <button
          onClick={() => navigate('/usuarios')}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-2"
        >
          <ArrowLeft size={16} />
          Volver a usuarios
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Editar usuario</h1>
        <p className="text-sm text-slate-500 mt-1">Editando a {user.nombre_completo}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
        <UserForm initialData={user} mode="edit" onSave={() => navigate('/usuarios')} />
      </div>
    </div>
  );
}
