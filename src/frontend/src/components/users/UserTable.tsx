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
  almacen: 'bg-amber-100 text-amber-700',
};

export default function UserTable({ usuarios, onEdit, onDeactivate }: UserTableProps) {
  if (usuarios.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No hay usuarios registrados</p>
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
          {usuarios.map(user => (
            <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="py-3 px-4">
                <span className="font-medium text-slate-900">{user.nombre_completo}</span>
              </td>
              <td className="py-3 px-4 text-slate-600">{user.email}</td>
              <td className="py-3 px-4">
                <span
                  className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${
                    rolColors[user.rol] || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {user.rol}
                </span>
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                    user.activo ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      user.activo ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  {user.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onEdit(user)}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-all"
                    title="Editar usuario"
                  >
                    <Pencil size={16} />
                  </button>
                  {user.activo && (
                    <button
                      onClick={() => onDeactivate(user)}
                      className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-all"
                      title="Desactivar usuario"
                    >
                      <UserX size={16} />
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
