import { Edit, UserX, UserCheck } from 'lucide-react';
import type { UserOut } from '../../types/auth';

interface UserTableProps {
  usuarios: UserOut[];
  onEdit: (user: UserOut) => void;
  onDeactivate: (user: UserOut) => void;
  onReactivate: (user: UserOut) => void;
}

const rolBadge = (rol: string) => {
  const styles: Record<string, string> = {
    administrador: 'bg-purple-100 text-purple-700',
    vendedor: 'bg-blue-100 text-blue-700',
    almacen: 'bg-green-100 text-green-700',
  };
  return styles[rol] || 'bg-slate-100 text-slate-700';
};

const statusBadge = (activo: boolean) =>
  activo
    ? 'bg-green-100 text-green-700'
    : 'bg-red-100 text-red-700';

export default function UserTable({ usuarios, onEdit, onDeactivate, onReactivate }: UserTableProps) {
  if (usuarios.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        No hay usuarios registrados.
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
          {usuarios.map((user) => (
            <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="py-3 px-4 font-medium text-slate-900">{user.nombre_completo}</td>
              <td className="py-3 px-4 text-slate-600">{user.email}</td>
              <td className="py-3 px-4">
                <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${rolBadge(user.rol)}`}>
                  {user.rol}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${statusBadge(user.activo)}`}>
                  {user.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(user)}
                    className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {user.activo ? (
                    <button
                      onClick={() => onDeactivate(user)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                      title="Desactivar"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onReactivate(user)}
                      className="p-2 rounded-lg hover:bg-green-50 text-green-600"
                      title="Reactivar"
                    >
                      <UserCheck className="w-4 h-4" />
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
