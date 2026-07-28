import { Edit2, UserX, UserCheck } from 'lucide-react';
import type { UserOut } from '../../types/auth';

interface UserTableProps {
  usuarios: UserOut[];
  onEdit: (user: UserOut) => void;
  onDeactivate: (user: UserOut) => void;
  onReactivate: (user: UserOut) => void;
}

const rolColors: Record<string, string> = {
  administrador: 'bg-purple-100 text-purple-700',
  vendedor: 'bg-blue-100 text-blue-700',
  almacen: 'bg-amber-100 text-amber-700',
};

export default function UserTable({ usuarios, onEdit, onDeactivate, onReactivate }: UserTableProps) {
  if (usuarios.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>No hay usuarios registrados</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 font-medium text-slate-600">Nombre</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
            <th className="text-left px-4 py-3 font-medium text-slate-600">Rol</th>
            <th className="text-center px-4 py-3 font-medium text-slate-600">Estado</th>
            <th className="text-right px-4 py-3 font-medium text-slate-600">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {usuarios.map((user) => (
            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 font-medium text-slate-900">
                {user.nombre_completo}
              </td>
              <td className="px-4 py-3 text-slate-600">{user.email}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                    rolColors[user.rol] || 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {user.rol}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.activo
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {user.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onEdit(user)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                    title="Editar usuario"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  {user.activo ? (
                    <button
                      onClick={() => onDeactivate(user)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                      title="Desactivar usuario"
                    >
                      <UserX className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onReactivate(user)}
                      className="p-2 rounded-xl text-slate-400 hover:text-green-600 hover:bg-green-50 transition-all"
                      title="Reactivar usuario"
                    >
                      <UserCheck className="h-4 w-4" />
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
