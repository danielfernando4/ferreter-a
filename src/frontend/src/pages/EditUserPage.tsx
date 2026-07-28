import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { UserForm } from '../components/users/UserForm';
import * as api from '../services/api';
import type { UserOut } from '../types/auth';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!id) {
      setError('ID de usuario no proporcionado');
      setIsLoading(false);
      return;
    }

    async function loadUser() {
      try {
        const data = await api.getUsuario(Number(id));
        setUser(data);
      } catch {
        setError('Error al cargar los datos del usuario');
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, [id]);

  const handleSave = async (data: Record<string, string>) => {
    if (!id) return;
    setSaveError('');
    try {
      await api.updateUsuario(Number(id), {
        nombre_completo: data.nombre_completo,
        email: data.email,
        rol: data.rol,
      });
      navigate('/usuarios');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'status' in err) {
        const apiErr = err as { status: number; message: string };
        if (apiErr.status === 409) {
          setSaveError('El correo electrónico ya está registrado');
        } else if (apiErr.status === 404) {
          setSaveError('Usuario no encontrado');
        } else {
          setSaveError(apiErr.message || 'Error al actualizar');
        }
      } else {
        setSaveError('Error al conectar con el servidor');
      }
      throw err;
    }
  };

  return (
    <AppLayout title="Editar Usuario">
      <div className="max-w-2xl">
        <button
          onClick={() => navigate('/usuarios')}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a usuarios
        </button>

        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-slate-200 rounded w-1/3" />
              <div className="h-10 bg-slate-200 rounded" />
              <div className="h-10 bg-slate-200 rounded" />
              <div className="h-10 bg-slate-200 rounded" />
            </div>
          </div>
        ) : error || !user ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error || 'Usuario no encontrado'}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">
              Editar: {user.nombre_completo || ''}
            </h2>

            {saveError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {saveError}
              </div>
            )}

            <UserForm
              mode="edit"
              initialData={user}
              onSave={handleSave}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
