import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import LayoutWithNav from '../../components/LayoutWithNav';
import SessionTimer from '../../components/SessionTimer';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { listUsers, deleteUser } from '../../api/client';
import {
  Users,
  Plus,
  Search,
  Trash2,
  Edit3,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface UserItem {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at?: string;
}

export default function UserListPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listUsers();
      setUsers(data as UserItem[]);
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (userId: string, userName: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar al usuario "${userName}"?`)) {
      return;
    }
    setDeleteLoading(userId);
    setError('');
    setSuccessMsg('');
    try {
      await deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setSuccessMsg(`Usuario "${userName}" eliminado exitosamente`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al eliminar usuario');
    } finally {
      setDeleteLoading(null);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadgeClass = (role: string) => {
    const classes: Record<string, string> = {
      administrador: 'bg-purple-100 text-purple-700',
      bodega: 'bg-blue-100 text-blue-700',
      vendedor: 'bg-green-100 text-green-700',
      compras: 'bg-amber-100 text-amber-700',
    };
    return classes[role] || 'bg-slate-100 text-slate-700';
  };

  return (
    <LayoutWithNav>
      <SessionTimer />

      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
            <p className="text-slate-500 text-sm mt-1">
              Gestiona los usuarios del sistema
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/users/new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-2xl shadow-sm hover:bg-blue-700 transition-all font-medium text-sm"
          >
            <Plus size={18} />
            Nuevo usuario
          </button>
        </div>

        {/* Success message */}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
            <CheckCircle size={16} />
            {successMsg}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6">
            <ErrorState message={error} onRetry={fetchUsers} />
          </div>
        )}

        {/* Search */}
        {!loading && !error && users.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar usuarios por nombre, usuario o email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        )}

        {/* Content */}
        {loading ? (
          <LoadingState message="Cargando usuarios..." />
        ) : error ? null : filteredUsers.length === 0 ? (
          users.length === 0 ? (
            <EmptyState
              icon={<Users size={64} />}
              title="No hay usuarios"
              description="Aún no se han creado usuarios en el sistema."
              actionLabel="Crear usuario"
              onAction={() => navigate('/admin/users/new')}
            />
          ) : (
            <EmptyState
              icon={<Search size={64} />}
              title="Sin resultados"
              description={`No se encontraron usuarios que coincidan con "${search}"`}
            />
          )
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900 text-sm">{user.full_name}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{user.username}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full capitalize ${getRoleBadgeClass(user.role)}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.is_active ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-600">
                            <CheckCircle size={14} /> Activo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-red-600">
                            <XCircle size={14} /> Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Editar usuario"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id, user.full_name)}
                            disabled={deleteLoading === user.id}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                            title="Eliminar usuario"
                          >
                            {deleteLoading === user.id ? (
                              <Loader2 className="animate-spin" size={16} />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </LayoutWithNav>
  );
}
