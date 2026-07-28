import { useNavigate } from 'react-router-dom';
import { usuariosApi } from '../services/api';
import UserForm from '../components/users/UserForm';
import AppLayout from '../components/layout/AppLayout';
import type { UserCreateRequest, UserUpdateRequest } from '../types/auth';
import { UserPlus, ArrowLeft } from 'lucide-react';

export default function CreateUserPage() {
  const navigate = useNavigate();

  async function handleSave(data: UserCreateRequest | UserUpdateRequest) {
    await usuariosApi.create(data as UserCreateRequest);
    navigate('/usuarios');
  }

  return (
    <AppLayout>
      <div className="max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => navigate('/usuarios')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Nuevo usuario</h1>
              <p className="text-sm text-slate-500">Crea una nueva cuenta de usuario</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <UserForm mode="create" onSave={handleSave} />
        </div>
      </div>
    </AppLayout>
  );
}
