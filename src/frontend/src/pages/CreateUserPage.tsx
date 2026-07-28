import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import UserForm from '../components/users/UserForm';

export default function CreateUserPage() {
  const navigate = useNavigate();

  function handleSave() {
    navigate('/usuarios');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/usuarios')}
          className="p-2 rounded-2xl text-slate-600 hover:bg-slate-100 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Nuevo Usuario</h2>
          <p className="text-sm text-slate-500 mt-1">
            Crea un nuevo usuario para el sistema
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8">
        <UserForm
          mode="create"
          onSave={handleSave}
          onCancel={() => navigate('/usuarios')}
        />
      </div>
    </div>
  );
}
