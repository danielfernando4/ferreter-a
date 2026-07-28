import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usuariosApi } from '../services/api';
import type { UserOut, UserCreateRequest, UserUpdateRequest } from '../types/auth';
import UserForm from '../components/users/UserForm';
import AppLayout from '../components/layout/AppLayout';
import { Pencil, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

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

    let cancelled = false;
    async function load() {
      try {
        const data = await usuariosApi.get(Number(id));
        if (!cancelled) setUser(data);
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Error al cargar usuario';
          setError(msg);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  async function handleSave(data: UserCreateRequest | UserUpdateRequest) {
    await usuariosApi.update(Number(id!), data as UserUpdateRequest);
    navigate('/usuarios');
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (error || !user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center gap-3 py-12">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="text-sm text-slate-600">{error || 'Usuario no encontrado'}</p>
          <button
            type="button"
            onClick={() => navigate('/usuarios')}
            className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all"
          >
            Volver a usuarios
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => navigate('/usuarios')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Pencil className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Editar usuario</h1>
              <p className="text-sm text-slate-500">{user.nombre_completo}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <UserForm initialData={user} mode="edit" onSave={handleSave} />
        </div>
      </div>
    </AppLayout>
  );
}
