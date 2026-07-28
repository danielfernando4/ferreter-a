import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { listUsuarios, deactivateUsuario, reactivateUsuario } from '../services/api';
import type { UserOut, PaginatedUsersResponse } from '../types/auth';
import UserTable from '../components/users/UserTable';
import SearchInput from '../components/users/SearchInput';
import Pagination from '../components/users/Pagination';
import DeactivateConfirmModal from '../components/users/DeactivateConfirmModal';
import { Plus, Loader2, AlertCircle, Users } from 'lucide-react';

export default function UserListPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [usuarios, setUsuarios] = useState<PaginatedUsersResponse | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deactivateTarget, setDeactivateTarget] = useState<UserOut | null>(null);
  const pageSize = 10;

  const fetchUsuarios = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await listUsuarios({ search: search || undefined, page, page_size: pageSize });
      setUsuarios(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== undefined) setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      if (deactivateTarget.activo) {
        await deactivateUsuario(deactivateTarget.id);
      } else {
        await reactivateUsuario(deactivateTarget.id);
      }
      setDeactivateTarget(null);
      fetchUsuarios();
    } catch (err: any) {
      setError(err.message || 'Error al cambiar el estado del usuario');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Usuarios</h2>
          <p className="text-sm text-slate-500 mt-1">Gestiona los usuarios del sistema</p>
        </div>
        {currentUser?.rol === 'administrador' && (
          <button
            onClick={() => navigate('/usuarios/nuevo')}
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo usuario
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre o email..."
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={fetchUsuarios}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
            <UserTable
              usuarios={usuarios?.items || []}
              onEdit={(user) => navigate(`/usuarios/${user.id}/editar`)}
              onDeactivate={setDeactivateTarget}
            />
            {usuarios && usuarios.total_pages > 1 && (
              <div className="p-4 border-t border-slate-200">
                <Pagination
                  currentPage={usuarios.page}
                  totalPages={usuarios.total_pages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {deactivateTarget && (
        <DeactivateConfirmModal
          userName={deactivateTarget.nombre_completo}
          isActive={deactivateTarget.activo}
          onConfirm={handleDeactivate}
          onCancel={() => setDeactivateTarget(null)}
        />
      )}
    </div>
  );
}
