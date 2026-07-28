import type { UserOut } from '../../types/auth';
import { Pencil, Trash2 } from 'lucide-react';

interface UserTableProps {
  users: UserOut[];
  onEdit: (user: UserOut) => void;
  onDeactivate: (user: UserOut) => void;
}

export default function UserTable({ users, onEdit, onDeactivate }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-500">No hay usuarios registrados</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 font-medium text-slate-500">Nombre</th>
            <th className="text-left py-3 px-4 font-medium text-slate-500">Email</th>
            <th className="text-left py-3 px-4 font-medium text-slate-500">Rol</th>
            <th className="text-left py-3 px-4 font-medium text-slate-500">Estado</th>
            <th className="text-right py-3 px-4 font-medium text-slate-500">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="py-3 px-4">
                <span className="font-medium text-slate-900">{user.nombre_completo}</span>
              </td>
              <td className="py-3 px-4 text-slate-600">{user.email}</td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                  {user.rol}
                </span>
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex items-center gap-1.5 ${
                    user.activo ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      user.activo ? 'bg-green-500' : 'bg-red-400'
                    }`}
                  />
                  {user.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(user)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                    title="Editar usuario"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {user.activo && (
                    <button
                      onClick={() => onDeactivate(user)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                      title="Desactivar usuario"
                    >
                      <Trash2 className="h-4 w-4" />
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
