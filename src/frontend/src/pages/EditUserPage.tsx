import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import UserForm from '../components/users/UserForm';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import { getUsuario, updateUsuario } from '../services/api';
import type { UserOut } from '../types/auth';

const EditUserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const data = await getUsuario(Number(id));
        setUser(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al cargar usuario.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleSave = async (data: {
    nombre_completo: string;
    email: string;
    password?: string;
    rol: string;
  }) => {
    setError('');
    try {
      await updateUsuario(Number(id), {
        nombre_completo: data.nombre_completo,
        email: data.email,
        rol: data.rol,
      });
      navigate('/usuarios');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar usuario.';
      setError(message);
      throw err;
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/usuarios"
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Editar Usuario</h2>
          <p className="text-sm text-slate-500 mt-1">
            Actualiza los datos del usuario
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        {isLoading ? (
          <LoadingState message="Cargando datos del usuario..." />
        ) : error && !user ? (
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        ) : user ? (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}
            <UserForm initialData={user} mode="edit" onSave={handleSave} />
          </>
        ) : null}
      </div>
    </div>
  );
};

export default EditUserPage;
