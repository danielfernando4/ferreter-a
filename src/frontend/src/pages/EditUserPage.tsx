import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getUsuario, updateUsuario } from '../services/api';
import UserForm from '../components/users/UserForm';
import type { UserOut } from '../types/auth';
import { ArrowLeft, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('ID de usuario no proporcionado.');
      setIsLoading(false);
      return;
    }
    getUsuario(Number(id))
      .then((data) => {
        setUser(data);
        setIsLoading(false);
      })
      .catch((err: any) => {
        setError(err.message || 'Error al cargar el usuario.');
        setIsLoading(false);
      });
  }, [id]);

  const handleSave = async (data: any) => {
    if (!id) return;
    await updateUsuario(Number(id), data);
    setSuccess(true);
    setTimeout(() => navigate('/usuarios', { replace: true }), 1500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-slate-600">{error}</p>
          <Link to="/usuarios" className="text-sm text-slate-900 underline mt-2 inline-block">
            Volver a usuarios
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/usuarios"
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editar usuario</h1>
          <p className="text-sm text-slate-500 mt-1">
            Editando a {user?.nombre_completo}
          </p>
        </div>
      </div>

      {success ? (
        <div className="bg-green-50 text-green-600 text-sm px-4 py-3 rounded-xl border border-green-200 flex items-center gap-2 max-w-lg">
          <CheckCircle className="h-4 w-4" />
          Usuario actualizado exitosamente. Redirigiendo...
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {user && <UserForm initialData={user} onSave={handleSave} mode="edit" />}
        </div>
      )}
    </div>
  );
}
