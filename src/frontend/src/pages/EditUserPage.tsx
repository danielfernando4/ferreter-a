import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import UserForm from '../components/users/UserForm';
import { getUsuario, updateUsuario } from '../services/api';
import type { UserOut } from '../types/auth';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      try {
        const data = await getUsuario(Number(id));
        if (!cancelled) setUser(data);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Error al cargar el usuario');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  const handleSave = async (data: { nombre_completo: string; email: string; rol: string }) => {
    if (!id) return;
    await updateUsuario(Number(id), {
      nombre_completo: data.nombre_completo,
      email: data.email,
      rol: data.rol,
    });
    navigate('/usuarios');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
        <p className="text-sm text-red-600">{error || 'Usuario no encontrado'}</p>
        <button
          onClick={() => navigate('/usuarios')}
          className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Volver a usuarios
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/usuarios')}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a usuarios
      </button>

      <div className="max-w-lg">
        <h2 className="text-xl font-semibold text-slate-900 mb-1">Editar usuario</h2>
        <p className="text-sm text-slate-500 mb-6">Actualiza los datos del usuario.</p>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <UserForm
            initialData={{ nombre_completo: user.nombre_completo, email: user.email, rol: user.rol }}
            onSave={handleSave}
            mode="edit"
          />
        </div>
      </div>
    </div>
  );
}
