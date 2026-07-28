import type { UserOut } from '../../types/auth';
import { Edit2, UserX, UserCheck } from 'lucide-react';

interface UserTableProps {
  usuarios: UserOut[];
  onEdit: (user: UserOut) => void;
  onDeactivate: (user: UserOut) => void;
  onReactivate?: (user: UserOut) => void;
}

const roleLabels: Record<string, string> = {
  administrador: 'Administrador',
  vendedor: 'Vendedor',
  almacen: 'Almacén',
};

const roleColors: Record<string, string> = {
  administrador: 'bg-purple-100 text-purple-700',
  vendedor: 'bg-blue-100 text-blue-700',
  almacen: 'bg-amber-100 text-amber-700',
};

export default function UserTable({ usuarios, onEdit, onDeactivate, onReactivate }: UserTableProps) {
  if (usuarios.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
        <UserX className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">No hay usuarios registrados</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Email
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Rol
              </th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4 text-sm font-medium text-slate-900">
                  {user.nombre_completo}
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {user.email}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${
                      roleColors[user.rol] || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {roleLabels[user.rol] || user.rol}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium ${
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
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(user)}
                      className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {user.activo ? (
                      <button
                        onClick={() => onDeactivate(user)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        title="Desactivar"
                      >
                        <UserX className="h-4 w-4" />
                      </button>
                    ) : (
                      onReactivate && (
                        <button
                          onClick={() => onReactivate(user)}
                          className="p-2 rounded-xl text-slate-400 hover:text-green-600 hover:bg-green-50 transition-all"
                          title="Reactivar"
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                      )
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
