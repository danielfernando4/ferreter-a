import { Pencil, UserX, UserCheck } from 'lucide-react';
import type { UserOut } from '../../types/auth';

interface UserTableProps {
  usuarios: UserOut[];
  onEdit: (id: number) => void;
  onDeactivate: (id: number, name: string) => void;
  onReactivate: (id: number) => void;
}

function getRolBadgeColor(rol: string): string {
  switch (rol) {
    case 'administrador':
      return 'bg-purple-100 text-purple-700';
    case 'vendedor':
      return 'bg-blue-100 text-blue-700';
    case 'almacen':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export function UserTable({
  usuarios,
  onEdit,
  onDeactivate,
  onReactivate,
}: UserTableProps) {
  if (usuarios.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
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
        <tbody>
          {usuarios.map((usuario) => (
            <tr
              key={usuario.id}
              className="border-b border-slate-100 hover:bg-slate-50 transition-all"
            >
              <td className="py-3 px-4 font-medium text-slate-900">
                {usuario.nombre_completo}
              </td>
              <td className="py-3 px-4 text-slate-600">{usuario.email}</td>
              <td className="py-3 px-4">
                <span
                  className={`inline-block px-3 py-1 rounded-2xl text-xs font-medium capitalize ${getRolBadgeColor(
                    usuario.rol
                  )}`}
                >
                  {usuario.rol}
                </span>
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                    usuario.activo ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      usuario.activo ? 'bg-green-500' : 'bg-red-400'
                    }`}
                  />
                  {usuario.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(usuario.id)}
                    className="p-2 rounded-2xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  {usuario.activo ? (
                    <button
                      onClick={() => onDeactivate(usuario.id, usuario.nombre_completo)}
                      className="p-2 rounded-2xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                      title="Desactivar"
                    >
                      <UserX size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => onReactivate(usuario.id)}
                      className="p-2 rounded-2xl text-slate-400 hover:text-green-600 hover:bg-green-50 transition-all"
                      title="Reactivar"
                    >
                      <UserCheck size={16} />
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
