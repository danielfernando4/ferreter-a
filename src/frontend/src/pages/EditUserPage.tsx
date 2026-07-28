import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserForm } from '../components/users/UserForm';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { Skeleton } from '../components/Skeleton';
import { ArrowLeft, UserCog } from 'lucide-react';
import type { UserOut } from '../types/auth';

export function EditUserPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
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
        const { getUsuario } = await import('../services/api');
        const userData = await getUsuario(Number(id));
        setUser(userData);
      } catch (err: unknown) {
        const apiErr = err as { message?: string };
        setError(apiErr?.message || 'Error al cargar usuario');
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
    const { updateUsuario } = await import('../services/api');
    await updateUsuario(Number(id), {
      nombre_completo: data.nombre_completo,
      email: data.email,
      rol: data.rol,
    });
    navigate('/usuarios');
  };

  if (isLoading) {
    return (
      <div className="max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-10 w-full mb-3" count={4} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md">
        <ErrorState message={error} onRetry={() => navigate('/usuarios')} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/usuarios')}
          className="p-2 rounded-2xl hover:bg-slate-100 transition-all text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editar Usuario</h1>
          <p className="text-sm text-slate-500 mt-1">
            Modifica los datos del usuario
          </p>
        </div>
      </div>

      <div className="max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <UserCog className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">
                {user?.nombre_completo}
              </h2>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
          <UserForm initialData={user} mode="edit" onSave={handleSave} />
        </div>
      </div>
    </div>
  );
}
