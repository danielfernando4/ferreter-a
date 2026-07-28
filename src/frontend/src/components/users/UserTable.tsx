import { Edit2, UserX, UserCheck, Shield } from 'lucide-react';
import { UserOut } from '../../services/api';

interface UserTableProps {
  usuarios: UserOut[];
  onEdit: (user: UserOut) => void;
  onDeactivate: (user: UserOut) => void;
  onReactivate?: (user: UserOut) => void;
}

const rolColors: Record<string, string> = {
  administrador: 'bg-purple-100 text-purple-700',
  vendedor: 'bg-blue-100 text-blue-700',
  almacen: 'bg-green-100 text-green-700',
};

export default function UserTable({
  usuarios,
  onEdit,
  onDeactivate,
  onReactivate,
}: UserTableProps) {
  if (usuarios.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        No hay usuarios registrados
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
            <tr
              key={user.id}
              className="border-b border-slate-100 hover:bg-slate-50 transition-all"
            >
              <td className="py-3 px-4 text-slate-900 font-medium">
                {user.nombre_completo}
              </td>
              <td className="py-3 px-4 text-slate-600">{user.email}</td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                    rolColors[user.rol] || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <Shield size={12} />
                  {user.rol}
                </span>
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                    user.activo
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {user.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onEdit(user)}
                    className="p-2 rounded-xl hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-all"
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  {user.activo ? (
                    <button
                      onClick={() => onDeactivate(user)}
                      className="p-2 rounded-xl hover:bg-red-50 text-slate-500 hover:text-red-600 transition-all"
                      title="Desactivar"
                    >
                      <UserX size={16} />
                    </button>
                  ) : (
                    onReactivate && (
                      <button
                        onClick={() => onReactivate(user)}
                        className="p-2 rounded-xl hover:bg-green-50 text-slate-500 hover:text-green-600 transition-all"
                        title="Reactivar"
                      >
                        <UserCheck size={16} />
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
  );
}
