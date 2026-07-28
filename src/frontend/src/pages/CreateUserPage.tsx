import { useNavigate } from 'react-router-dom';
import UserForm from '../components/users/UserForm';
import { createUsuario } from '../services/api';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CreateUserPage() {
  const navigate = useNavigate();

  const handleSave = async (data: Parameters<typeof createUsuario>[0]) => {
    await createUsuario(data as Parameters<typeof createUsuario>[0]);
    navigate('/usuarios');
  };

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
        <h1 className="text-2xl font-bold text-slate-900">Nuevo usuario</h1>
        <p className="text-sm text-slate-500 mt-1">Crea un nuevo usuario en el sistema</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <UserForm mode="create" onSave={handleSave} />
      </div>
    </div>
  );
}
