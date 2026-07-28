import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserForm } from '../components/users/UserForm';
import { ArrowLeft, UserPlus } from 'lucide-react';

export function CreateUserPage() {
  const navigate = useNavigate();

  const handleSave = async (data: {
    nombre_completo: string;
    email: string;
    password?: string;
    rol: string;
  }) => {
    const { createUsuario } = await import('../services/api');
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
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/usuarios')}
          className="p-2 rounded-2xl hover:bg-slate-100 transition-all text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nuevo Usuario</h1>
          <p className="text-sm text-slate-500 mt-1">
            Crea un nuevo usuario en el sistema
          </p>
        </div>
      </div>

      <div className="max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Datos del Usuario</h2>
              <p className="text-xs text-slate-500">
                Completa todos los campos obligatorios
              </p>
            </div>
          </div>
          <UserForm mode="create" onSave={handleSave} />
        </div>
      </div>
    </div>
  );
}
