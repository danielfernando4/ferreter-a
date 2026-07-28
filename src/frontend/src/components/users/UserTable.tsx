import type { UserOut } from '../../types/auth';
import { Edit, Trash2, UserCheck, UserX } from 'lucide-react';

interface UserTableProps {
  usuarios: UserOut[];
  onEdit: (user: UserOut) => void;
  onDeactivate: (user: UserOut) => void;
}

export default function UserTable({ usuarios, onEdit, onDeactivate }: UserTableProps) {
  if (usuarios.length === 0) {
    return (
      <div className="text-center py-12">
        <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">No hay usuarios registrados</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rol</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {usuarios.map((user) => (
            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
              <td className="py-3 px-4">
                <p className="text-sm font-medium text-slate-900">{user.nombre_completo}</p>
              </td>
              <td className="py-3 px-4">
                <p className="text-sm text-slate-600">{user.email}</p>
              </td>
              <td className="py-3 px-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.rol === 'administrador'
                    ? 'bg-purple-100 text-purple-700'
                    : user.rol === 'vendedor'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {user.rol}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                  user.activo ? 'text-green-600' : 'text-red-600'
                }`}>
                  {user.activo ? (
                    <UserCheck className="w-3.5 h-3.5" />
                  ) : (
                    <UserX className="w-3.5 h-3.5" />
                  )}
                  {user.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onEdit(user)}
                    className="p-2 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors"
                    title="Editar usuario"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeactivate(user)}
                    className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                    title={user.activo ? 'Desactivar usuario' : 'Activar usuario'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
