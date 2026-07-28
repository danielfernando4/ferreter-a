import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import UserForm from '../components/users/UserForm';
import { ArrowLeft } from 'lucide-react';

export default function CreateUserPage() {
  const navigate = useNavigate();

  const handleSave = async (data: { nombre_completo: string; email: string; password?: string; rol: string }) => {
    await api.createUsuario({
      nombre_completo: data.nombre_completo,
      email: data.email,
      password: data.password || '',
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
        <h1 className="text-2xl font-bold text-slate-900">Nuevo usuario</h1>
        <p className="text-sm text-slate-500 mt-1">Crea un nuevo usuario en el sistema</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        <UserForm mode="create" onSave={handleSave} />
      </div>
    </div>
  );
}
