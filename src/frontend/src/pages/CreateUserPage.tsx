import { useNavigate } from 'react-router-dom';
import UserForm from '../components/users/UserForm';
import { createUsuario } from '../services/api';
import { ArrowLeft } from 'lucide-react';

export default function CreateUserPage() {
  const navigate = useNavigate();

  const handleSave = async (data: { nombre_completo: string; email: string; password?: string; rol: string }) => {
    await createUsuario({
      nombre_completo: data.nombre_completo,
      email: data.email,
      password: data.password || '',
      rol: data.rol,
    });
    navigate('/usuarios');
  };

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
        <h2 className="text-xl font-semibold text-slate-900 mb-1">Nuevo usuario</h2>
        <p className="text-sm text-slate-500 mb-6">Crea un nuevo usuario en el sistema.</p>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <UserForm onSave={handleSave} mode="create" />
        </div>
      </div>
    </div>
  );
}
