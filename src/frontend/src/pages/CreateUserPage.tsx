import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import UserForm from '../components/users/UserForm';
import ErrorState from '../components/ErrorState';
import { createUsuario } from '../services/api';

const CreateUserPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSave = async (data: {
    nombre_completo: string;
    email: string;
    password?: string;
    rol: string;
  }) => {
    setError('');
    try {
      await createUsuario({
        nombre_completo: data.nombre_completo,
        email: data.email,
        password: data.password || '',
        rol: data.rol,
      });
      navigate('/usuarios');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear usuario.';
      setError(message);
      throw err;
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/usuarios"
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Nuevo Usuario</h2>
          <p className="text-sm text-slate-500 mt-1">
            Crea un nuevo usuario en el sistema
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}
        <UserForm mode="create" onSave={handleSave} />
      </div>
    </div>
  );
};

export default CreateUserPage;
