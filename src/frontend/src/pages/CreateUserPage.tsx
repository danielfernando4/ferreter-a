import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { UserForm } from '../components/users/UserForm';
import * as api from '../services/api';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

export function CreateUserPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSave = async (data: Record<string, string>) => {
    setError('');
    try {
      await api.createUsuario({
        nombre_completo: data.nombre_completo,
        email: data.email,
        password: data.password,
        rol: data.rol,
      });
      navigate('/usuarios');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'status' in err) {
        const apiErr = err as { status: number; message: string };
        if (apiErr.status === 409) {
          setError('El correo electrónico ya está registrado');
        } else if (apiErr.status === 400) {
          setError(apiErr.message || 'Datos inválidos');
        } else {
          setError('Error al crear el usuario');
        }
      } else {
        setError('Error al conectar con el servidor');
      }
      throw err;
    }
  };

  return (
    <AppLayout title="Crear Usuario">
      <div className="max-w-2xl">
        <button
          onClick={() => navigate('/usuarios')}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a usuarios
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Nuevo usuario</h2>

          {error && (
            <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <UserForm mode="create" onSave={handleSave} />
        </div>
      </div>
    </AppLayout>
  );
}
