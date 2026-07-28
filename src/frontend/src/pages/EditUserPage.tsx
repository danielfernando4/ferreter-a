import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import UserForm from '../components/users/UserForm';
import * as api from '../services/api';
import { ApiError } from '../services/api';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { UserOut } from '../types/auth';

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (!id) return;
    const loadUser = async () => {
      try {
        const data = await api.getUsuario(Number(id));
        setUser(data);
      } catch {
        setApiError('Error al cargar los datos del usuario.');
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, [id]);

  const handleSave = async (data: { nombre_completo: string; email: string; rol: string }) => {
    try {
      await api.updateUsuario(Number(id), data);
      navigate('/usuarios');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setApiError('Ya existe un usuario con ese correo electrónico.');
        } else {
          setApiError(err.message);
        }
      } else {
        setApiError('Error al actualizar el usuario.');
      }
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={28} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 font-medium">Usuario no encontrado.</p>
        <Link to="/usuarios" className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block">
          Volver a usuarios
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/usuarios"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 font-medium mb-2"
        >
          <ArrowLeft size={16} />
          Volver a usuarios
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Editar usuario</h1>
        <p className="text-sm text-slate-500 mt-1">{user.nombre_completo}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 max-w-lg">
        {apiError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {apiError}
          </div>
        )}
        <UserForm initialData={user} onSave={handleSave} mode="edit" />
      </div>
    </div>
  );
}
