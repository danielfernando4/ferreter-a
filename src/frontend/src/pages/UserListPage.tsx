import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listUsuarios, deactivateUsuario, reactivateUsuario, UserOut } from '../services/api';
import UserTable from '../components/users/UserTable';
import SearchInput from '../components/users/SearchInput';
import Pagination from '../components/users/Pagination';
import DeactivateConfirmModal from '../components/users/DeactivateConfirmModal';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { Plus, Users } from 'lucide-react';

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

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await listUsuarios(search || undefined, page, 10);
      setUsuarios(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      setError(err.detail || 'Error al cargar usuarios');
      setUsuarios([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleEdit = (user: UserOut) => {
    navigate(`/usuarios/${user.id}/editar`);
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await deactivateUsuario(deactivateTarget.id);
      setDeactivateTarget(null);
      fetchData();
    } catch (err: any) {
      setError(err.detail || 'Error al desactivar usuario');
      setDeactivateTarget(null);
    }
  };

  const handleReactivate = async (user: UserOut) => {
    try {
      await reactivateUsuario(user.id);
      fetchData();
    } catch (err: any) {
      setError(err.detail || 'Error al reactivar usuario');
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
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium text-sm"
        >
          <Plus size={18} />
          Nuevo usuario
        </button>
      </div>

      <div className="mb-4 max-w-sm">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Buscar por nombre o email..."
        />
      </div>

      {isLoading ? (
        <LoadingState message="Cargando usuarios..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : usuarios.length === 0 ? (
        <EmptyState
          icon={<Users size={48} />}
          title="No hay usuarios"
          description="Aún no se han registrado usuarios en el sistema."
          actionLabel="Crear usuario"
          onAction={() => navigate('/usuarios/nuevo')}
        />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <UserTable
            usuarios={usuarios}
            onEdit={handleEdit}
            onDeactivate={setDeactivateTarget}
            onReactivate={handleReactivate}
          />
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

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
