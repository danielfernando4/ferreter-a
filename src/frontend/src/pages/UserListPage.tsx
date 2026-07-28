import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import UserTable from '../components/users/UserTable';
import SearchInput from '../components/users/SearchInput';
import Pagination from '../components/users/Pagination';
import DeactivateConfirmModal from '../components/users/DeactivateConfirmModal';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { TableSkeleton } from '../components/Skeleton';
import { listUsuarios, deactivateUsuario } from '../services/api';
import type { UserOut } from '../types/auth';

const UserListPage: React.FC = () => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<UserOut[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deactivateTarget, setDeactivateTarget] = useState<UserOut | null>(null);

  const fetchUsuarios = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await listUsuarios(search || undefined, page, 10);
      setUsuarios(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar usuarios.';
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

  const handleEdit = (user: UserOut) => {
    navigate(`/usuarios/${user.id}/editar`);
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;

    try {
      await deactivateUsuario(deactivateTarget.id);
      setDeactivateTarget(null);
      fetchUsuarios();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al desactivar usuario.';
      setError(message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Usuarios</h2>
          <p className="text-sm text-slate-500 mt-1">
            Gestiona los usuarios del sistema
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/usuarios/nuevo')}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      <div className="max-w-sm">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre o email..."
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        {isLoading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchUsuarios} />
        ) : usuarios.length === 0 ? (
          <EmptyState
            title="No hay usuarios"
            message={search ? 'No se encontraron usuarios con ese criterio de búsqueda.' : 'Aún no hay usuarios registrados en el sistema.'}
            actionLabel={!search ? 'Crear Usuario' : undefined}
            onAction={!search ? () => navigate('/usuarios/nuevo') : undefined}
          />
        ) : (
          <>
            <UserTable
              usuarios={usuarios}
              onEdit={handleEdit}
              onDeactivate={(user) => setDeactivateTarget(user)}
            />
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
            <div className="text-center text-xs text-slate-400 mt-3">
              {total} usuario(s) encontrado(s)
            </div>
          </>
        )}
      </div>

      {deactivateTarget && (
        <DeactivateConfirmModal
          userName={deactivateTarget.nombre_completo}
          onConfirm={handleDeactivate}
          onCancel={() => setDeactivateTarget(null)}
        />
      )}
    </div>
  );
};

export default UserListPage;
