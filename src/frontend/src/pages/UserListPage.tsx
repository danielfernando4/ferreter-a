import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserTable } from '../components/users/UserTable';
import { SearchInput } from '../components/users/SearchInput';
import { Pagination } from '../components/users/Pagination';
import { DeactivateConfirmModal } from '../components/users/DeactivateConfirmModal';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Plus, Users } from 'lucide-react';
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
  const [userToDeactivate, setUserToDeactivate] = useState<UserOut | null>(null);

  const fetchUsuarios = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const { listUsuarios } = await import('../services/api');
      const result = await listUsuarios({
        search: search || undefined,
        page,
        page_size: 10,
      });
      setUsuarios(result.items);
      setTotal(result.total);
      setTotalPages(result.total_pages);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message || 'Error al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDeactivate = async () => {
    if (!userToDeactivate) return;
    try {
      const { deactivateUsuario } = await import('../services/api');
      await deactivateUsuario(userToDeactivate.id);
      setUserToDeactivate(null);
      fetchUsuarios();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr?.message || 'Error al desactivar usuario');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
          <p className="text-sm text-slate-500 mt-1">
            {total > 0
              ? `${total} usuario${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}`
              : 'Gestiona los usuarios del sistema'}
          </p>
        </div>
        <button
          onClick={() => navigate('/usuarios/nuevo')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-2xl shadow-sm hover:bg-blue-700 transition-all text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Buscar usuarios por nombre o email..."
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" count={5} />
          </div>
        ) : error ? (
          <div className="p-6">
            <ErrorState message={error} onRetry={fetchUsuarios} />
          </div>
        ) : usuarios.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No hay usuarios"
              description={
                search
                  ? 'No se encontraron usuarios con ese criterio de búsqueda'
                  : 'Aún no hay usuarios registrados en el sistema'
              }
              icon={<Users className="w-12 h-12" />}
              actionLabel={!search ? 'Crear Usuario' : undefined}
              onAction={!search ? () => navigate('/usuarios/nuevo') : undefined}
            />
          </div>
        ) : (
          <>
            <UserTable
              usuarios={usuarios}
              onEdit={(user) => navigate(`/usuarios/${user.id}/editar`)}
              onDeactivate={(user) => setUserToDeactivate(user)}
            />
            <div className="border-t border-slate-200 px-4 py-3">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      {userToDeactivate && (
        <DeactivateConfirmModal
          userName={userToDeactivate.nombre_completo}
          onConfirm={handleDeactivate}
          onCancel={() => setUserToDeactivate(null)}
        />
      )}
    </div>
  );
}
