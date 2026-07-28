import type { UserOut } from '../../types/auth';
import { Edit2, UserX } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface UserTableProps {
  usuarios: UserOut[];
  onEdit: (user: UserOut) => void;
  onDeactivate: (user: UserOut) => void;
}

function getRolBadgeColor(rol: string): string {
  switch (rol) {
    case 'administrador':
      return 'bg-purple-100 text-purple-700';
    case 'vendedor':
      return 'bg-blue-100 text-blue-700';
    case 'almacen':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function getRolLabel(rol: string): string {
  switch (rol) {
    case 'administrador':
      return 'Administrador';
    case 'vendedor':
      return 'Vendedor';
    case 'almacen':
      return 'Almacén';
    default:
      return rol;
  }
}

export default function UserTable({ usuarios, onEdit, onDeactivate }: UserTableProps) {
  const { user: currentUser } = useAuth();

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Nombre
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Email
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Rol
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {usuarios.map((user) => (
            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-slate-600">
                      {user.nombre_completo?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-slate-900">
                    {user.nombre_completo}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRolBadgeColor(user.rol)}`}
                >
                  {getRolLabel(user.rol)}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center gap-1.5 text-sm ${
                    user.activo ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      user.activo ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  {user.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onEdit(user)}
                    className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    title="Editar usuario"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  {user.activo && currentUser?.id !== user.id && (
                    <button
                      onClick={() => onDeactivate(user)}
                      className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
                      title="Desactivar usuario"
                    >
                      <UserX className="h-4 w-4" />
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
