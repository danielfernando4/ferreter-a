import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { UserForm } from '../components/users/UserForm';

export default function CreateUserPage() {
  const navigate = useNavigate();

  const handleSave = () => {
    navigate('/usuarios');
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/usuarios')}
          className="p-2 rounded-2xl hover:bg-slate-100 transition-all"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nuevo Usuario</h1>
          <p className="text-slate-500 text-sm mt-1">
            Crea un nuevo usuario en el sistema
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 max-w-lg">
        <UserForm mode="create" onSave={handleSave} />
      </div>
    </div>
  );
}
