import { useNavigate, Link } from 'react-router-dom';
import UserForm from '../components/users/UserForm';
import * as api from '../services/api';
import { ApiError } from '../services/api';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

export default function CreateUserPage() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');

  const handleSave = async (data: { nombre_completo: string; email: string; password?: string; rol: string }) => {
    try {
      await api.createUsuario({
        nombre_completo: data.nombre_completo,
        email: data.email,
        password: data.password || '',
        rol: data.rol,
      });
      navigate('/usuarios');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setApiError('Ya existe un usuario con ese correo electrónico.');
        } else {
          setApiError(err.message);
        }
      } else {
        setApiError('Error al crear el usuario.');
      }
      throw err;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/usuarios"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 font-medium mb-2"
        >
          <ArrowLeft size={16} />
          Volver a usuarios
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Nuevo usuario</h1>
        <p className="text-sm text-slate-500 mt-1">Crea un nuevo usuario en el sistema</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 max-w-lg">
        {apiError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {apiError}
          </div>
        )}
        <UserForm onSave={handleSave} mode="create" />
      </div>
    </div>
  );
}
