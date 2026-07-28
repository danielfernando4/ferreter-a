import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import UserForm from '../components/users/UserForm';
import * as api from '../services/api';
import type { UserOut } from '../types/auth';

export default function EditUserPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadUser() {
      if (!id) return;
      setIsLoading(true);
      setError('');
      try {
        const data = await api.getUsuario(Number(id));
        setUser(data);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Error al cargar usuario';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, [id]);

  function handleSave() {
    navigate('/usuarios');
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/usuarios')}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a usuarios
        </button>
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-slate-600">{error || 'Usuario no encontrado'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/usuarios')}
          className="p-2 rounded-2xl text-slate-600 hover:bg-slate-100 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Editar Usuario</h2>
          <p className="text-sm text-slate-500 mt-1">
            Editando a {user.nombre_completo}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8">
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
