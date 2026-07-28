import { useNavigate } from 'react-router-dom';
import { usuariosApi } from '../services/api';
import UserForm from '../components/users/UserForm';
import type { UserCreateRequest } from '../types/auth';
import { ArrowLeft, UserPlus } from 'lucide-react';

export default function CreateUserPage() {
  const navigate = useNavigate();

  const handleSave = async (data: UserCreateRequest) => {
    await usuariosApi.create(data);
    navigate('/usuarios');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <button
          onClick={() => navigate('/usuarios')}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a usuarios
        </button>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <UserPlus className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Nuevo Usuario</h1>
            <p className="text-sm text-slate-500">Crea un nuevo usuario en el sistema</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <UserForm mode="create" onSave={handleSave} />
      </div>
    </div>
  );
}
