import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2, RefreshCw } from 'lucide-react';
import { listUsuarios, deactivateUsuario, reactivateUsuario } from '../services/api';
import type { UserOut } from '../types/auth';
import UserTable from '../components/users/UserTable';
import SearchInput from '../components/users/SearchInput';
import Pagination from '../components/users/Pagination';
import DeactivateConfirmModal from '../components/users/DeactivateConfirmModal';

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
  const [reactivateTarget, setReactivateTarget] = useState<UserOut | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsuarios = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await listUsuarios({ search: search || undefined, page, page_size: 10 });
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
    fetchUsuarios();
  }, [fetchUsuarios]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setActionLoading(true);
    try {
      await deactivateUsuario(deactivateTarget.id);
      setDeactivateTarget(null);
      fetchUsuarios();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al desactivar usuario';
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!reactivateTarget) return;
    setActionLoading(true);
    try {
      await reactivateUsuario(reactivateTarget.id);
      setReactivateTarget(null);
      fetchUsuarios();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al reactivar usuario';
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
          <p className="text-sm text-slate-500 mt-1">
            {total > 0 ? `${total} usuario${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}` : 'Gestiona los usuarios del sistema'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsuarios}
            className="p-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 transition-all"
            title="Recargar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/usuarios/nuevo')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo usuario</span>
          </button>
        </div>
      </div>

      <div className="max-w-sm">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre o email..." />
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <UserTable
              usuarios={usuarios}
              onEdit={(user) => navigate(`/usuarios/${user.id}/editar`)}
              onDeactivate={(user) => setDeactivateTarget(user)}
              onReactivate={(user) => setReactivateTarget(user)}
            />
            <div className="mt-6">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      {deactivateTarget && (
        <DeactivateConfirmModal
          userName={deactivateTarget.nombre_completo}
          onConfirm={handleDeactivate}
          onCancel={() => setDeactivateTarget(null)}
          isLoading={actionLoading}
        />
      )}

      {reactivateTarget && (
        <DeactivateConfirmModal
          userName={reactivateTarget.nombre_completo}
          onConfirm={handleReactivate}
          onCancel={() => setReactivateTarget(null)}
          isLoading={actionLoading}
          isReactivate
        />
      )}
    </div>
  );
}
