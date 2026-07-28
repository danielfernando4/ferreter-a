import { useAuth } from '../hooks/useAuth';
import { Users, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const cards = [
    {
      title: 'Usuarios',
      description: 'Gestiona los usuarios del sistema',
      icon: Users,
      path: '/usuarios',
      color: 'bg-blue-500',
    },
    {
      title: 'Mi Perfil',
      description: 'Ver y editar tu perfil',
      icon: UserCircle,
      path: '/perfil',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Bienvenido, {user?.nombre_completo || 'Usuario'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Panel principal de Ferretería
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(card => (
          <button
            key={card.path}
            onClick={() => navigate(card.path)}
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all text-left"
          >
            <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center mb-4`}>
              <card.icon size={24} className="text-white" />
            </div>
            <h3 className="font-semibold text-slate-900">{card.title}</h3>
            <p className="text-sm text-slate-500 mt-1">{card.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
