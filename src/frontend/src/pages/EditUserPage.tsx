import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import UserForm from '../components/users/UserForm';
import { usuariosApi } from '../services/api';
import type { UserOut, UserUpdateRequest } from '../types/auth';

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setError('ID de usuario no proporcionado');
      setIsLoading(false);
      return;
    }
    const fetchUser = async () => {
      try {
        const data = await usuariosApi.get(Number(id));
        setUser(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al cargar usuario';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleSave = async (data: UserUpdateRequest) => {
    if (!id) return;
    await usuariosApi.update(Number(id), data);
    navigate('/usuarios');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/usuarios')}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a usuarios
        </button>
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error || 'Usuario no encontrado'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate('/usuarios')}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a usuarios
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Editar usuario</h1>
        <p className="text-sm text-slate-500 mt-1">
          Editando: {user.nombre_completo}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <UserForm
          initialData={user}
          mode="edit"
          onSave={handleSave}
          onCancel={() => navigate('/usuarios')}
        />
      </div>
    </div>
  );
}
