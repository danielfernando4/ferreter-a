import { Pencil, UserX } from 'lucide-react';
import type { UserOut } from '../../types/auth';

interface UserTableProps {
  usuarios: UserOut[];
  onEdit: (user: UserOut) => void;
  onDeactivate: (user: UserOut) => void;
}

const rolColors: Record<string, string> = {
  administrador: 'bg-purple-100 text-purple-700',
  vendedor: 'bg-blue-100 text-blue-700',
  almacen: 'bg-green-100 text-green-700',
};

export function UserTable({ usuarios, onEdit, onDeactivate }: UserTableProps) {
  if (usuarios.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No hay usuarios registrados</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
              Nombre
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
              Email
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
              Rol
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {usuarios.map((user) => (
            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-medium">
                    {(user.nombre_completo || '').charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-slate-900">
                    {user.nombre_completo || ''}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4 text-sm text-slate-600">{user.email || ''}</td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    rolColors[user.rol] || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {user.rol || ''}
                </span>
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex items-center gap-1.5 text-sm ${
                    user.activo ? 'text-green-600' : 'text-red-600'
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
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onEdit(user)}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-all"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {user.activo && (
                    <button
                      onClick={() => onDeactivate(user)}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-red-600 transition-all"
                      title="Desactivar"
                    >
                      <UserX className="w-4 h-4" />
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
