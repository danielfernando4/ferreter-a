import { Pencil, Trash2 } from 'lucide-react';
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
        <p className="text-slate-500 text-sm">No hay usuarios registrados</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 font-medium text-slate-700">Nombre</th>
            <th className="text-left px-4 py-3 font-medium text-slate-700">Email</th>
            <th className="text-left px-4 py-3 font-medium text-slate-700">Rol</th>
            <th className="text-left px-4 py-3 font-medium text-slate-700">Estado</th>
            <th className="text-right px-4 py-3 font-medium text-slate-700">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {usuarios.map((user) => (
            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 font-medium text-slate-900">{user.nombre_completo}</td>
              <td className="px-4 py-3 text-slate-600">{user.email}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${
                    rolColors[user.rol] || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {user.rol}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center gap-1.5 ${
                    user.activo ? 'text-green-700' : 'text-red-700'
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
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(user)}
                    className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeactivate(user)}
                    disabled={!user.activo}
                    className="p-2 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Desactivar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
