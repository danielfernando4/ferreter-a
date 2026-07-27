import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listUsers, deleteUser } from '../../api/client';
import type { UserResponse } from '../../types';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import EmptyState from '../../components/EmptyState';
import { Users, Plus, Trash2, Edit, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const UserListPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDelete = async (userId: string, username: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar al usuario "${username}"?`)) {
      return;
    }

    setDeletingId(userId);
    setDeleteError('');
    try {
      await deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: any) {
      setDeleteError(err.message || 'Error al eliminar usuario');
    } finally {
      setDeletingId(null);
    }
  };

  const roleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      administrador: 'bg-purple-100 text-purple-700',
      bodega: 'bg-blue-100 text-blue-700',
      vendedor: 'bg-green-100 text-green-700',
      compras: 'bg-amber-100 text-amber-700',
    };
    return colors[role] || 'bg-slate-100 text-slate-700';
  };

  if (loading) return <LoadingState message="Cargando usuarios..." />;

  if (error) return <ErrorState message={error} onRetry={loadUsers} />;

  if (users.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Users size={28} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
              <p className="text-slate-500">Gestión de usuarios del sistema</p>
            </div>
          </div>
        </div>
        <EmptyState
          title="No hay usuarios registrados"
          description="Crea el primer usuario para comenzar a gestionar el sistema."
          actionLabel="Crear Usuario"
          onAction={() => navigate('/admin/users/new')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
            <Users size={28} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
            <p className="text-slate-500">{users.length} usuario(s) registrado(s)</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/users/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-2xl shadow-sm hover:bg-blue-700 transition-all"
        >
          <Plus size={20} />
          Nuevo Usuario
        </button>
      </div>

      {/* Delete error */}
      {deleteError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          <span className="text-sm">{deleteError}</span>
        </div>
      )}

      {/* Users table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-all">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900">{user.full_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">{user.username}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">{user.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-medium ${roleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.is_active ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle size={14} />
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600 text-sm">
                        <XCircle size={14} />
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(user.id!, user.username)}
                        disabled={deletingId === user.id}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all disabled:opacity-50"
                        title="Eliminar"
                      >
                        {deletingId === user.id ? (
                          <span className="text-xs">...</span>
                        ) : (
                          <Trash2 size={18} />
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
    </div>
  );
};

export default UserListPage;
