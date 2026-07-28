import { Edit, Trash2, UserCheck } from 'lucide-react';
import type { UserOut } from '../../types/auth';

interface UserTableProps {
  usuarios: UserOut[];
  onEdit: (user: UserOut) => void;
  onDeactivate: (user: UserOut) => void;
}

export function UserTable({ usuarios, onEdit, onDeactivate }: UserTableProps) {
  if (usuarios.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        No se encontraron usuarios
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
        <tbody className="divide-y divide-slate-100">
          {usuarios.map((user) => (
            <tr key={user.id} className="hover:bg-slate-50 transition-all">
              <td className="py-3 px-4 font-medium text-slate-900">{user.nombre_completo}</td>
              <td className="py-3 px-4 text-slate-600">{user.email}</td>
              <td className="py-3 px-4">
                <span className="capitalize text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                  {user.rol}
                </span>
              </td>
              <td className="py-3 px-4">
                {user.activo ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-700">
                    <UserCheck className="w-3.5 h-3.5" />
                    Activo
                  </span>
                ) : (
                  <span className="text-xs font-medium text-slate-400">Inactivo</span>
                )}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(user)}
                    className="p-2 rounded-2xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    title="Editar usuario"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {user.activo && (
                    <button
                      type="button"
                      onClick={() => onDeactivate(user)}
                      className="p-2 rounded-2xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
                      title="Desactivar usuario"
                    >
                      <Trash2 className="w-4 h-4" />
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
