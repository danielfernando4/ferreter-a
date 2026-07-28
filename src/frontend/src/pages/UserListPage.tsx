import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listUsuarios } from '../services/api';
import { UserTable } from '../components/users/UserTable';
import { SearchInput } from '../components/users/SearchInput';
import { Pagination } from '../components/users/Pagination';
import { DeactivateConfirmModal } from '../components/users/DeactivateConfirmModal';
import { TableSkeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { Plus } from 'lucide-react';
import type { UserOut } from '../types/auth';

export function UserListPage() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<UserOut[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deactivateTarget, setDeactivateTarget] = useState<UserOut | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await listUsuarios(search || undefined, page, 10);
      setUsuarios(result.items);
      setTotalPages(result.total_pages);
      setTotal(result.total);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar usuarios';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleEdit = (user: UserOut) => {
    navigate(`/usuarios/${user.id}/editar`);
  };

  const handleDeactivateConfirm = async () => {
    if (deactivateTarget) {
      setDeactivateTarget(null);
      await loadUsers();
    }
  };

  if (error) {
    return <ErrorState message={error} onRetry={loadUsers} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Usuarios</h2>
          <p className="text-sm text-slate-500 mt-1">
            {total > 0 ? `${total} usuario${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}` : 'Gestiona los usuarios del sistema'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/usuarios/nuevo')}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-2xl shadow-sm hover:bg-blue-700 transition-all text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nuevo usuario
        </button>
      </div>

      <div className="max-w-sm">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre o email..." />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={5} />
          </div>
        ) : (
          <UserTable
            usuarios={usuarios}
            onEdit={handleEdit}
            onDeactivate={setDeactivateTarget}
          />
        )}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {deactivateTarget && (
        <DeactivateConfirmModal
          userName={deactivateTarget.nombre_completo}
          userId={deactivateTarget.id}
          onConfirm={handleDeactivateConfirm}
          onCancel={() => setDeactivateTarget(null)}
        />
      )}
    </div>
  );
}
