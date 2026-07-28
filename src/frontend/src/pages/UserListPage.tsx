import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import UserTable from '../components/users/UserTable';
import SearchInput from '../components/users/SearchInput';
import Pagination from '../components/users/Pagination';
import DeactivateConfirmModal from '../components/users/DeactivateConfirmModal';
import type { UserOut } from '../types/auth';
import { Loader2, AlertCircle, Plus, UserPlus } from 'lucide-react';

export default function UserListPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserOut[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deactivateTarget, setDeactivateTarget] = useState<UserOut | null>(null);
  const [pageSize] = useState(10);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.listUsuarios({ search: search || undefined, page, page_size: pageSize });
      setUsers(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar usuarios';
      setError(msg);
    }
    setIsLoading(false);
  }, [search, page, pageSize]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const handleEdit = (user: UserOut) => {
    navigate(`/usuarios/${user.id}/editar`);
  };

  const handleDeactivate = (user: UserOut) => {
    setDeactivateTarget(user);
  };

  const handleDeactivateConfirm = () => {
    setDeactivateTarget(null);
    loadUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
          <p className="text-sm text-slate-500 mt-1">
            {total > 0 ? `${total} usuario${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}` : 'Gestión de usuarios'}
          </p>
        </div>
        <button
          onClick={() => navigate('/usuarios/nuevo')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-all shadow-sm text-sm"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo usuario
        </button>
      </div>

      <div className="max-w-sm">
        <SearchInput value={search} onChange={handleSearch} placeholder="Buscar por nombre o email..." />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : search && users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No se encontraron usuarios con "{search}"</p>
          </div>
        ) : (
          <UserTable
            users={users}
            onEdit={handleEdit}
            onDeactivate={handleDeactivate}
          />
        )}
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {deactivateTarget && (
        <DeactivateConfirmModal
          userId={deactivateTarget.id}
          userName={deactivateTarget.nombre_completo}
          onConfirm={handleDeactivateConfirm}
          onCancel={() => setDeactivateTarget(null)}
        />
      )}
    </div>
  );
}
