import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUsuario } from '../services/api';
import type { UserOut } from '../types/auth';
import UserForm from '../components/users/UserForm';
import { Loader2 } from 'lucide-react';

export default function EditUserPage() {
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
        const message = err instanceof Error ? err.message : 'Error al cargar usuario';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Editar usuario</h1>
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Editar usuario</h1>
        <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">Usuario no encontrado</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Editar usuario</h1>
        <p className="text-sm text-slate-500 mt-1">Modifica los datos del usuario</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <UserForm
          initialData={user}
          mode="edit"
          onSave={() => navigate('/usuarios')}
          onCancel={() => navigate('/usuarios')}
        />
      </div>
    </div>
  );
}
