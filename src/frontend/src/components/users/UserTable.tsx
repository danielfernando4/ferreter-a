import type { UserOut } from '../../types/auth';
import { Pencil, UserX, UserCheck } from 'lucide-react';

interface UserTableProps {
  usuarios: UserOut[];
  onEdit: (user: UserOut) => void;
  onDeactivate: (user: UserOut) => void;
  onReactivate?: (user: UserOut) => void;
}

const rolBadge = (rol: string) => {
  const styles: Record<string, string> = {
    administrador: 'bg-purple-100 text-purple-700',
    vendedor: 'bg-blue-100 text-blue-700',
    almacen: 'bg-amber-100 text-amber-700',
  };
  return styles[rol] || 'bg-slate-100 text-slate-700';
};

export default function UserTable({ usuarios, onEdit, onDeactivate, onReactivate }: UserTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 font-semibold text-slate-700">Nombre</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-700">Email</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-700">Rol</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-700">Estado</th>
            <th className="text-right px-4 py-3 font-semibold text-slate-700">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {usuarios.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                No hay usuarios registrados
              </td>
            </tr>
          ) : (
            usuarios.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-slate-900 font-medium">{user.nombre_completo}</td>
                <td className="px-4 py-3 text-slate-600">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2.5 py-1 rounded-xl text-xs font-medium capitalize ${rolBadge(user.rol)}`}>
                    {user.rol}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {user.activo ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-xl">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2.5 py-1 rounded-xl">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      Inactivo
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(user)}
                      className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {user.activo ? (
                      <button
                        type="button"
                        onClick={() => onDeactivate(user)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        title="Desactivar"
                      >
                        <UserX className="h-4 w-4" />
                      </button>
                    ) : (
                      onReactivate && (
                        <button
                          type="button"
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
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
