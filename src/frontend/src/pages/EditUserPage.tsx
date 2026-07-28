import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as api from '../services/api';
import UserForm from '../components/users/UserForm';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState<{ nombre_completo: string; email: string; rol: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadUser() {
      if (!id) return;
      try {
        const user = await api.getUsuario(Number(id));
        setInitialData({
          nombre_completo: user.nombre_completo,
          email: user.email,
          rol: user.rol,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al cargar usuario';
        setError(msg);
      }
      setIsLoading(false);
    }
    loadUser();
  }, [id]);

  const handleSave = async (data: { nombre_completo: string; email: string; password?: string; rol: string }) => {
    await api.updateUsuario(Number(id), {
      nombre_completo: data.nombre_completo,
      email: data.email,
      rol: data.rol,
    });
    navigate('/usuarios');
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <button
          onClick={() => navigate('/usuarios')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a usuarios
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Editar usuario</h1>
        <p className="text-sm text-slate-500 mt-1">Modifica los datos del usuario</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        ) : initialData ? (
          <UserForm initialData={initialData} mode="edit" onSave={handleSave} />
        ) : (
          <p className="text-center text-slate-500 text-sm">Usuario no encontrado</p>
        )}
      </div>
    </div>
  );
}
