import { useNavigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-6">
          <ShieldOff className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Acceso denegado</h1>
        <p className="text-slate-500 mb-6">
          No tienes permisos para acceder a esta página.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
