import React from 'react';
import { Edit, Trash2, UserX, CheckCircle, XCircle } from 'lucide-react';
import type { UserOut } from '../../types/auth';

interface UserTableProps {
  usuarios: UserOut[];
  onEdit: (user: UserOut) => void;
  onDeactivate: (user: UserOut) => void;
}

const roleLabels: Record<string, string> = {
  administrador: 'Administrador',
  vendedor: 'Vendedor',
  almacen: 'Almacén',
};

const UserTable: React.FC<UserTableProps> = ({
  usuarios,
  onEdit,
  onDeactivate,
}) => {
  if (usuarios.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        No se encontraron usuarios.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wide">
              Nombre
            </th>
            <th className="text-left py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wide">
              Email
            </th>
            <th className="text-left py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wide">
              Rol
            </th>
            <th className="text-left py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wide">
              Estado
            </th>
            <th className="text-right py-3 px-4 font-semibold text-slate-600 text-xs uppercase tracking-wide">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((user) => (
            <tr
              key={user.id}
              className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <td className="py-3 px-4 text-slate-900 font-medium">
                {user.nombre_completo}
              </td>
              <td className="py-3 px-4 text-slate-500">{user.email}</td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                  {roleLabels[user.rol] || user.rol}
                </span>
              </td>
              <td className="py-3 px-4">
                {user.activo ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-red-500">
                    <XCircle className="w-3.5 h-3.5" />
                    Inactivo
                  </span>
                )}
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(user)}
                    className="p-2 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors"
                    title="Editar usuario"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {user.activo && (
                    <button
                      type="button"
                      onClick={() => onDeactivate(user)}
                      className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                      title="Desactivar usuario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {!user.activo && (
                    <button
                      type="button"
                      className="p-2 rounded-lg hover:bg-green-50 text-slate-500 hover:text-green-600 transition-colors"
                      title="Usuario inactivo"
                      disabled
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
};

export default UserTable;
