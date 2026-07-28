import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../services/api';
import type { UserCreateRequest, UserUpdateRequest } from '../../types/auth';
import UserForm from '../components/users/UserForm';
import { ArrowLeft } from 'lucide-react';

export default function CreateUserPage() {
  const navigate = useNavigate();
  const [globalError, setGlobalError] = useState('');

  const handleSave = async (data: UserCreateRequest | UserUpdateRequest) => {
    setGlobalError('');
    try {
      await api.createUsuario(data as UserCreateRequest);
      navigate('/usuarios');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setGlobalError(err.message);
      } else {
        setGlobalError('Error al crear el usuario');
      }
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/usuarios')}
          className="p-2 rounded-xl hover:bg-slate-100 transition-all"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nuevo usuario</h1>
          <p className="text-sm text-slate-500 mt-1">Crea un nuevo usuario del sistema</p>
        </div>
      </div>

      {globalError && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {globalError}
        </div>
      )}

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
