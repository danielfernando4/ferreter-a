import { Edit, Trash2, Power, PowerOff } from 'lucide-react';
import type { UserOut } from '../../types/auth';

interface UserTableProps {
  usuarios: UserOut[];
  onEdit: (user: UserOut) => void;
  onDeactivate: (user: UserOut) => void;
  onReactivate: (user: UserOut) => void;
}

export default function UserTable({
  usuarios,
  onEdit,
  onDeactivate,
  onReactivate,
}: UserTableProps) {
  if (usuarios.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        No hay usuarios registrados.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">
              Nombre
            </th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">
              Email
            </th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">
              Rol
            </th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">
              Estado
            </th>
            <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((user) => (
            <tr
              key={user.id}
              className="border-b border-slate-100 hover:bg-slate-50 transition-all"
            >
              <td className="px-4 py-4 text-sm font-medium text-slate-900">
                {user.nombre_completo}
              </td>
              <td className="px-4 py-4 text-sm text-slate-600">
                {user.email}
              </td>
              <td className="px-4 py-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                  {user.rol}
                </span>
              </td>
              <td className="px-4 py-4">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    user.activo
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {user.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(user)}
                    className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {user.activo ? (
                    <button
                      onClick={() => onDeactivate(user)}
                      className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
                      title="Desactivar"
                    >
                      <PowerOff className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onReactivate(user)}
                      className="p-2 rounded-xl text-slate-500 hover:text-green-600 hover:bg-green-50 transition-all"
                      title="Reactivar"
                    >
                      <Power className="w-4 h-4" />
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
