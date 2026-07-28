import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { UserForm } from '../components/users/UserForm';
import { ErrorState } from '../components/ErrorState';
import { getUsuario } from '../services/api';
import type { UserOut } from '../types/auth';

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      setIsLoading(true);
      setError('');
      try {
        const data = await getUsuario(Number(id));
        setUser(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Error al cargar usuario');
        } else {
          setError('Error al cargar usuario');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleSave = () => {
    navigate('/usuarios');
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/usuarios')}
          className="p-2 rounded-2xl hover:bg-slate-100 transition-all"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editar Usuario</h1>
          <p className="text-slate-500 text-sm mt-1">
            Modifica los datos del usuario
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 max-w-lg">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <ErrorState
            title="Error al cargar usuario"
            message={error}
            onRetry={() => window.location.reload()}
          />
        ) : user ? (
          <UserForm
            initialData={user}
            mode="edit"
            onSave={handleSave}
          />
        ) : null}
      </div>
    </div>
  );
}
