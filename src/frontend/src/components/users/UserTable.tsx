import { Pencil, UserX, UserCheck } from 'lucide-react';
import type { UserOut } from '../../types/auth';

interface UserTableProps {
  usuarios: UserOut[];
  onEdit: (user: UserOut) => void;
  onDeactivate: (user: UserOut) => void;
  onReactivate: (user: UserOut) => void;
}

export default function UserTable({ usuarios, onEdit, onDeactivate, onReactivate }: UserTableProps) {
  const rolBadge = (rol: string) => {
    const colors: Record<string, string> = {
      administrador: 'bg-purple-100 text-purple-700',
      vendedor: 'bg-blue-100 text-blue-700',
      almacen: 'bg-amber-100 text-amber-700',
    };
    return colors[rol] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left">
            <th className="pb-3 font-semibold text-slate-700">Nombre</th>
            <th className="pb-3 font-semibold text-slate-700">Email</th>
            <th className="pb-3 font-semibold text-slate-700">Rol</th>
            <th className="pb-3 font-semibold text-slate-700">Estado</th>
            <th className="pb-3 font-semibold text-slate-700">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(user => (
            <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="py-3 text-slate-900 font-medium">{user.nombre_completo}</td>
              <td className="py-3 text-slate-600">{user.email}</td>
              <td className="py-3">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${rolBadge(user.rol)}`}>
                  {user.rol}
                </span>
              </td>
              <td className="py-3">
                <span className={`inline-flex items-center gap-1.5 ${
                  user.activo ? 'text-green-600' : 'text-red-500'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${user.activo ? 'bg-green-500' : 'bg-red-400'}`} />
                  {user.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(user)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  {user.activo ? (
                    <button
                      onClick={() => onDeactivate(user)}
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Desactivar"
                    >
                      <UserX size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => onReactivate(user)}
                      className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                      title="Reactivar"
                    >
                      <UserCheck size={16} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
