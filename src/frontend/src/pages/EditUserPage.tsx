import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usuariosApi } from '../services/api';
import UserForm from '../components/users/UserForm';
import type { UserOut, UserUpdateRequest } from '../types/auth';
import { ArrowLeft, Edit2, Loader2, AlertCircle } from 'lucide-react';

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadUser() {
      if (!id) return;
      setIsLoading(true);
      setError('');
      try {
        const data = await usuariosApi.getById(Number(id));
        setUser(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al cargar usuario';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, [id]);

  const handleSave = async (data: UserUpdateRequest) => {
    if (!id) return;
    await usuariosApi.update(Number(id), data);
    navigate('/usuarios');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <p className="text-sm text-slate-500">Cargando datos del usuario...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/usuarios')}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a usuarios
        </button>
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <button
          onClick={() => navigate('/usuarios')}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a usuarios
        </button>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Edit2 className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Editar Usuario</h1>
            <p className="text-sm text-slate-500">{user.nombre_completo}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <UserForm mode="edit" initialData={user} onSave={handleSave} />
      </div>
    </div>
  );
}
