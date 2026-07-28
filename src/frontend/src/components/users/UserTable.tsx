import React from 'react';
import { Edit2, UserX } from 'lucide-react';
import type { UserOut } from '../../types/auth';

interface UserTableProps {
  usuarios: UserOut[];
  onEdit: (user: UserOut) => void;
  onDeactivate: (user: UserOut) => void;
}

export function UserTable({ usuarios, onEdit, onDeactivate }: UserTableProps) {
  if (usuarios.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 text-sm">
        No se encontraron usuarios
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wider">
              Nombre
            </th>
            <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wider">
              Email
            </th>
            <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wider">
              Rol
            </th>
            <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wider">
              Estado
            </th>
            <th className="text-right py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wider">
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
              <td className="py-3 px-4 text-slate-900 font-medium">
                {user.nombre_completo}
              </td>
              <td className="py-3 px-4 text-slate-600">{user.email}</td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                  {user.rol}
                </span>
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.activo
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {user.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(user)}
                    className="p-2 rounded-2xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    title="Editar usuario"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {user.activo && (
                    <button
                      onClick={() => onDeactivate(user)}
                      className="p-2 rounded-2xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                      title="Desactivar usuario"
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
