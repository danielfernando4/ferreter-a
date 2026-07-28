import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import UserForm from '../components/users/UserForm';

export default function CreateUserPage() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/usuarios')}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nuevo usuario</h1>
          <p className="text-sm text-slate-500 mt-1">Crea un nuevo usuario en el sistema</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <UserForm mode="create" onSave={() => navigate('/usuarios')} />
      </div>
    </div>
  );
}
