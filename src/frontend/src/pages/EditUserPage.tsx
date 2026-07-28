import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as api from '../../services/api';
import type { UserOut, UserUpdateRequest } from '../../types/auth';
import UserForm from '../components/users/UserForm';
import { ArrowLeft } from 'lucide-react';

export default function EditUserPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [globalError, setGlobalError] = useState('');

  useEffect(() => {
    if (!id) {
      setError('ID de usuario no proporcionado');
      setIsLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const data = await api.getUsuario(Number(id));
        setUser(data);
      } catch {
        setError('Error al cargar los datos del usuario');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleSave = async (data: UserUpdateRequest) => {
    setGlobalError('');
    try {
      await api.updateUsuario(Number(id), data);
      navigate('/usuarios');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setGlobalError(err.message);
      } else {
        setGlobalError('Error al actualizar el usuario');
      }
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/usuarios')}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a usuarios
        </button>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/usuarios')}
          className="p-2 rounded-xl hover:bg-slate-100 transition-all"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editar usuario</h1>
          <p className="text-sm text-slate-500 mt-1">
            Editando: {user?.nombre_completo}
          </p>
        </div>
      </div>

      {globalError && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {globalError}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        {user && (
          <UserForm
            mode="edit"
            initialData={user}
            onSave={handleSave}
            onCancel={() => navigate('/usuarios')}
          />
        )}
      </div>
    </div>
  );
}
