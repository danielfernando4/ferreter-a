import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import UserForm from '../components/users/UserForm';
import { getUsuario, updateUsuario } from '../services/api';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { UserOut } from '../types/auth';

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getUsuario(Number(id))
      .then(setUser)
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Error al cargar usuario';
        setError(msg);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleSave = async (data: Parameters<typeof updateUsuario>[1]) => {
    await updateUsuario(Number(id), data);
    navigate('/usuarios');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-900" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error || 'Usuario no encontrado'}
        </div>
        <Link to="/usuarios" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mt-4">
          <ArrowLeft className="w-4 h-4" />
          Volver a usuarios
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          to="/usuarios"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a usuarios
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Editar usuario</h1>
        <p className="text-sm text-slate-500 mt-1">Modifica los datos del usuario</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <UserForm initialData={user} mode="edit" onSave={handleSave} />
      </div>
    </div>
  );
}
