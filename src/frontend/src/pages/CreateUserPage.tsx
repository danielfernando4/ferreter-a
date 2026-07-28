import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import UserForm from '../components/users/UserForm';
import { usuariosApi } from '../services/api';
import type { UserCreateRequest } from '../types/auth';

export default function CreateUserPage() {
  const navigate = useNavigate();

  const handleSave = async (data: UserCreateRequest) => {
    await usuariosApi.create(data);
    navigate('/usuarios');
  };

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate('/usuarios')}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a usuarios
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Nuevo usuario</h1>
        <p className="text-sm text-slate-500 mt-1">Crea un nuevo usuario en el sistema</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <UserForm
          mode="create"
          onSave={handleSave}
          onCancel={() => navigate('/usuarios')}
        />
      </div>
    </div>
  );
}
