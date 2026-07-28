import { useNavigate } from 'react-router-dom';
import { createUsuario } from '../services/api';
import { UserForm } from '../components/users/UserForm';
import { ArrowLeft } from 'lucide-react';

export function CreateUserPage() {
  const navigate = useNavigate();

  const handleSave = async (data: Parameters<typeof createUsuario>[0]) => {
    await createUsuario(data);
    navigate('/usuarios');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/usuarios')}
          className="p-2 rounded-2xl border border-slate-300 text-slate-600 hover:bg-slate-50 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Nuevo usuario</h2>
          <p className="text-sm text-slate-500 mt-1">Crea un nuevo usuario en el sistema</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 max-w-lg">
        <UserForm mode="create" onSave={handleSave} />
      </div>
    </div>
  );
}
