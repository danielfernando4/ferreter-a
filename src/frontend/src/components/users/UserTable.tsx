import type { UserOut } from '../../types/auth';
import { Edit, Trash2, UserCheck, UserX } from 'lucide-react';

interface UserTableProps {
  usuarios: UserOut[];
  onEdit: (user: UserOut) => void;
  onDeactivate: (user: UserOut) => void;
  onReactivate: (user: UserOut) => void;
}

export default function UserTable({ usuarios, onEdit, onDeactivate, onReactivate }: UserTableProps) {
  if (usuarios.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <UserX size={48} className="mx-auto mb-3 text-slate-300" />
        <p className="text-lg font-medium">No hay usuarios registrados</p>
        <p className="text-sm">Crea el primer usuario para comenzar.</p>
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
            <th className="text-center py-3 px-4 font-medium text-slate-500">Estado</th>
            <th className="text-right py-3 px-4 font-medium text-slate-500">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((user) => (
            <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-all">
              <td className="py-3 px-4 text-slate-900 font-medium">{user.nombre_completo}</td>
              <td className="py-3 px-4 text-slate-600">{user.email}</td>
              <td className="py-3 px-4">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.rol === 'administrador'
                    ? 'bg-purple-100 text-purple-700'
                    : user.rol === 'vendedor'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {user.rol === 'administrador' ? 'Admin' : user.rol === 'vendedor' ? 'Vendedor' : 'Almacén'}
                </span>
              </td>
              <td className="py-3 px-4 text-center">
                {user.activo ? (
                  <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                    <UserCheck size={14} />
                    Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-red-500 text-xs font-medium">
                    <UserX size={14} />
                    Inactivo
                  </span>
                )}
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onEdit(user)}
                    className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                  {user.activo ? (
                    <button
                      onClick={() => onDeactivate(user)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                      title="Desactivar"
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => onReactivate(user)}
                      className="px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 rounded-lg transition-all"
                      title="Reactivar"
                    >
                      Reactivar
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
