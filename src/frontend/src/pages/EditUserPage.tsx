import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUsuario, updateUsuario } from '../services/api';
import { UserForm } from '../components/users/UserForm';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { ArrowLeft } from 'lucide-react';
import type { UserOut } from '../types/auth';

export function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await getUsuario(Number(id));
        setUser(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al cargar usuario';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSave = async (data: Parameters<typeof updateUsuario>[1]) => {
    if (!id) return;
    await updateUsuario(Number(id), data);
    navigate('/usuarios');
  };

  if (isLoading) {
    return <LoadingState message="Cargando datos del usuario..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/usuarios')}
          className="p-2 rounded-2xl border border-slate-300 text-slate-600 hover:bg-slate-50 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Editar usuario</h2>
          <p className="text-sm text-slate-500 mt-1">
            Editando a {user?.nombre_completo || ''}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 max-w-lg">
        <UserForm initialData={user} mode="edit" onSave={handleSave} />
      </div>
    </div>
  );
}
