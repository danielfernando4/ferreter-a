import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getUsuario, updateUsuario, UserUpdateRequest } from '../services/api';
import UserForm from '../components/users/UserForm';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

export default function EditUserPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!id) {
      setError('ID de usuario no proporcionado');
      setIsLoading(false);
      return;
    }

    const load = async () => {
      try {
        const data = await getUsuario(Number(id));
        setUser(data);
      } catch (err: any) {
        setError(err.detail || 'Error al cargar el usuario');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSave = async (data: UserUpdateRequest) => {
    try {
      await updateUsuario(Number(id), data);
      navigate('/usuarios');
    } catch (err: any) {
      setSaveError(err.detail || 'Error al actualizar el usuario');
      throw err;
    }
  };

  if (isLoading) {
    return <LoadingState message="Cargando datos del usuario..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => navigate('/usuarios')} />;
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/usuarios')}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2 transition-all"
        >
          <ArrowLeft size={16} />
          Volver a usuarios
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Editar usuario</h1>
        <p className="text-sm text-slate-500 mt-1">
          {user?.nombre_completo || 'Editando usuario'}
        </p>
      </div>

      {saveError && (
        <div className="mb-4 bg-red-50 text-red-600 text-sm px-4 py-2 rounded-xl border border-red-200 max-w-lg">
          {saveError}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        {user && (
          <UserForm
            initialData={user}
            mode="edit"
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
}
