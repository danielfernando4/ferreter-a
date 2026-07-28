import { useNavigate } from 'react-router-dom';
import UserForm from '../components/users/UserForm';

export default function CreateUserPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nuevo usuario</h1>
        <p className="text-sm text-slate-500 mt-1">Crea un nuevo usuario en el sistema</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <UserForm
          mode="create"
          onSave={() => navigate('/usuarios')}
          onCancel={() => navigate('/usuarios')}
        />
      </div>
    </div>
  );
}
