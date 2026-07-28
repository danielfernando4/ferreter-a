import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import UserForm from '../components/users/UserForm';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';
import type { UserOut } from '../types/auth';

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [user, setUser] = useState<UserOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id || !token) return;
    (async () => {
      try {
        const data = await api.getUsuario(token, parseInt(id));
        setUser(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al cargar usuario';
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">Cargando datos del usuario...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl border border-red-200 mb-4">
          {error || 'Usuario no encontrado'}
        </div>
        <button
          onClick={() => navigate('/usuarios')}
          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all"
        >
          Volver a usuarios
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/usuarios')}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editar usuario</h1>
          <p className="text-sm text-slate-500 mt-1">{user.nombre_completo}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <UserForm mode="edit" initialData={user} onSave={() => navigate('/usuarios')} />
      </div>
    </div>
  );
}
