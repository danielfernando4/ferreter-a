import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import UserForm from '../components/users/UserForm';

export default function CreateUserPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <button
          onClick={() => navigate('/usuarios')}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-2"
        >
          <ArrowLeft size={16} />
          Volver a usuarios
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Nuevo usuario</h1>
        <p className="text-sm text-slate-500 mt-1">Crea un nuevo usuario en el sistema</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
        <UserForm mode="create" onSave={() => navigate('/usuarios')} />
      </div>
    </div>
  );
}
