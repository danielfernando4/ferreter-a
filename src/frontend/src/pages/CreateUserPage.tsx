import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUsuario, UserCreateRequest } from '../services/api';
import UserForm from '../components/users/UserForm';
import { ArrowLeft } from 'lucide-react';

export default function CreateUserPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSave = async (data: UserCreateRequest) => {
    try {
      await createUsuario(data);
      navigate('/usuarios');
    } catch (err: any) {
      setError(err.detail || 'Error al crear el usuario');
      throw err;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/usuarios')}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2 transition-all"
        >
          <ArrowLeft size={16} />
          Volver a usuarios
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Nuevo usuario</h1>
        <p className="text-sm text-slate-500 mt-1">
          Crea un nuevo usuario para el sistema
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 text-sm px-4 py-2 rounded-xl border border-red-200 max-w-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <UserForm mode="create" onSave={handleSave} />
      </div>
    </div>
  );
}
