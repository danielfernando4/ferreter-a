import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import UserTable from '../components/users/UserTable';
import SearchInput from '../components/users/SearchInput';
import Pagination from '../components/users/Pagination';
import DeactivateConfirmModal from '../components/users/DeactivateConfirmModal';
import { usuariosApi } from '../services/api';
import type { UserOut } from '../types/auth';

export default function UserListPage() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<UserOut[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    user: UserOut;
    action: 'deactivate' | 'reactivate';
  } | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await usuariosApi.list({
        search: search || undefined,
        page,
        page_size: 10,
      });
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
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleConfirmAction = async () => {
    if (!confirmModal) return;
    setModalLoading(true);
    try {
      if (confirmModal.action === 'deactivate') {
        await usuariosApi.deactivate(confirmModal.user.id);
      } else {
        await usuariosApi.reactivate(confirmModal.user.id);
      }
      setConfirmModal(null);
      fetchUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al procesar la acción';
      setError(message);
    } finally {
      setModalLoading(false);
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
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all text-sm font-medium self-start"
        >
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </button>
      </div>

      {/* Search */}
      <SearchInput
        value={search}
        onChange={handleSearchChange}
        placeholder="Buscar por nombre o email..."
      />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={fetchUsers}
            className="p-1 hover:bg-red-100 rounded-lg transition-all"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && usuarios.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-500 text-sm">
            {search
              ? 'No se encontraron usuarios con ese criterio de búsqueda'
              : 'No hay usuarios registrados'}
          </p>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && usuarios.length > 0 && (
        <UserTable
          usuarios={usuarios}
          onEdit={(user) => navigate(`/usuarios/${user.id}/editar`)}
          onDeactivate={(user) => setConfirmModal({ user, action: 'deactivate' })}
          onReactivate={(user) => setConfirmModal({ user, action: 'reactivate' })}
        />
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <DeactivateConfirmModal
          userName={confirmModal.user.nombre_completo}
          action={confirmModal.action}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmModal(null)}
          isLoading={modalLoading}
        />
      )}
    </div>
  );
}
