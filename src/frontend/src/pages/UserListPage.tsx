import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usuariosApi } from '../services/api';
import type { UserOut } from '../types/auth';
import UserTable from '../components/users/UserTable';
import SearchInput from '../components/users/SearchInput';
import Pagination from '../components/users/Pagination';
import DeactivateConfirmModal from '../components/users/DeactivateConfirmModal';
import { Plus, Users, Loader2, AlertCircle } from 'lucide-react';

export default function UserListPage() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<UserOut[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deactivateTarget, setDeactivateTarget] = useState<UserOut | null>(null);

  const loadUsuarios = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await usuariosApi.list({ search: search || undefined, page, page_size: 10 });
      setUsuarios(response.items);
      setTotalPages(response.total_pages);
      setTotal(response.total);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar usuarios';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    loadUsuarios();
  }, [loadUsuarios]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await usuariosApi.deactivate(deactivateTarget.id);
      setDeactivateTarget(null);
      loadUsuarios();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al desactivar usuario';
      setError(message);
      setDeactivateTarget(null);
    }
  };

  const handleReactivate = async (user: UserOut) => {
    try {
      await usuariosApi.reactivate(user.id);
      loadUsuarios();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al reactivar usuario';
      setError(message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
          <p className="text-sm text-slate-500 mt-1">
            {total > 0 ? `${total} usuario${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}` : 'Gestiona los usuarios del sistema'}
          </p>
        </div>
        <button
          onClick={() => navigate('/usuarios/nuevo')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          Nuevo Usuario
        </button>
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <SearchInput value={search} onChange={handleSearchChange} placeholder="Buscar por nombre o email..." />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            <p className="text-sm text-slate-500">Cargando usuarios...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Table */}
          <UserTable
            usuarios={usuarios}
            onEdit={(user) => navigate(`/usuarios/${user.id}/editar`)}
            onDeactivate={setDeactivateTarget}
            onReactivate={handleReactivate}
          />

          {/* Pagination */}
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </>
      )}

      {/* Deactivate Modal */}
      {deactivateTarget && (
        <DeactivateConfirmModal
          userName={deactivateTarget.nombre_completo}
          onConfirm={handleDeactivate}
          onCancel={() => setDeactivateTarget(null)}
        />
      )}
    </div>
  );
}
