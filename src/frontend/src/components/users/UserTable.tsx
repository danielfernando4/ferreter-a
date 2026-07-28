import { UserOut } from '../../types/auth';
import { Edit3, UserX, UserCheck } from 'lucide-react';

interface UserTableProps {
  usuarios: UserOut[];
  onEdit: (user: UserOut) => void;
  onDeactivate: (user: UserOut) => void;
  onReactivate: (user: UserOut) => void;
}

export default function UserTable({ usuarios, onEdit, onDeactivate, onReactivate }: UserTableProps) {
  if (!usuarios || usuarios.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>No hay usuarios registrados.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 font-medium text-slate-600">Nombre</th>
            <th className="text-left py-3 px-4 font-medium text-slate-600">Email</th>
            <th className="text-left py-3 px-4 font-medium text-slate-600">Rol</th>
            <th className="text-left py-3 px-4 font-medium text-slate-600">Estado</th>
            <th className="text-right py-3 px-4 font-medium text-slate-600">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((user) => (
            <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="py-3 px-4 font-medium text-slate-900">
                {user.nombre_completo}
              </td>
              <td className="py-3 px-4 text-slate-600">{user.email}</td>
              <td className="py-3 px-4">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                  {user.rol}
                </span>
              </td>
              <td className="py-3 px-4">
                {user.activo ? (
                  <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Inactivo
                  </span>
                )}
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onEdit(user)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                    title="Editar"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  {user.activo ? (
                    <button
                      onClick={() => onDeactivate(user)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                      title="Desactivar"
                    >
                      <UserX className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onReactivate(user)}
                      className="p-2 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 transition-all"
                      title="Reactivar"
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
