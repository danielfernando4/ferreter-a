import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUsuario } from '../services/api';
import UserForm from '../components/users/UserForm';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function CreateUserPage() {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);

  const handleSave = async (data: any) => {
    await createUsuario(data);
    setSuccess(true);
    setTimeout(() => navigate('/usuarios', { replace: true }), 1500);
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/usuarios"
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nuevo usuario</h1>
          <p className="text-sm text-slate-500 mt-1">Crea un nuevo usuario en el sistema</p>
        </div>
      </div>

      {success ? (
        <div className="bg-green-50 text-green-600 text-sm px-4 py-3 rounded-xl border border-green-200 flex items-center gap-2 max-w-lg">
          <CheckCircle className="h-4 w-4" />
          Usuario creado exitosamente. Redirigiendo...
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <UserForm onSave={handleSave} mode="create" />
        </div>
      )}
    </div>
  );
}
