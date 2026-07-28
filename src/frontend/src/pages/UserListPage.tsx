import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Loader2 } from 'lucide-react';
import UserTable from '../components/users/UserTable';
import SearchInput from '../components/users/SearchInput';
import Pagination from '../components/users/Pagination';
import DeactivateConfirmModal from '../components/users/DeactivateConfirmModal';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';
import type { UserOut } from '../types/auth';

export default function UserListPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [usuarios, setUsuarios] = useState<UserOut[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalUser, setModalUser] = useState<UserOut | null>(null);
  const [modalAction, setModalAction] = useState<'deactivate' | 'reactivate'>('deactivate');
  const pageSize = 10;

  const loadUsuarios = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await api.listUsuarios(token, {
        search: search || undefined,
        page,
        page_size: pageSize,
      });
      setUsuarios(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar usuarios';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [token, search, page]);

  useEffect(() => {
    loadUsuarios();
  }, [loadUsuarios]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleDeactivate = (user: UserOut) => {
    setModalUser(user);
    setModalAction('deactivate');
  };

  const handleReactivate = (user: UserOut) => {
    setModalUser(user);
    setModalAction('reactivate');
  };

  const handleModalConfirm = () => {
    setModalUser(null);
    loadUsuarios();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
          <p className="text-sm text-slate-500 mt-1">
            {total > 0 ? `${total} usuario${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}` : 'Gestiona los usuarios del sistema'}
          </p>
        </div>
        <button
          onClick={() => navigate('/usuarios/nuevo')}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all"
        >
          <Plus size={18} />
          Nuevo usuario
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="max-w-sm">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar por nombre o email..."
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={28} className="animate-spin text-blue-600" />
              <p className="text-sm text-slate-500">Cargando usuarios...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl border border-red-200 mb-4 max-w-md">
              {error}
            </div>
            <button
              onClick={loadUsuarios}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all"
            >
              Reintentar
            </button>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Users className="text-slate-400" size={28} />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-1">
              {search ? 'Sin resultados' : 'No hay usuarios registrados'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {search ? 'Intenta con otro término de búsqueda' : 'Crea el primer usuario del sistema'}
            </p>
            {!search && (
              <button
                onClick={() => navigate('/usuarios/nuevo')}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all"
              >
                <Plus size={18} />
                Crear usuario
              </button>
            )}
          </div>
        ) : (
          <div className="p-4">
            <UserTable
              usuarios={usuarios}
              onEdit={user => navigate(`/usuarios/${user.id}/editar`)}
              onDeactivate={handleDeactivate}
              onReactivate={handleReactivate}
            />
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {modalUser && (
        <DeactivateConfirmModal
          userId={modalUser.id}
          userName={modalUser.nombre_completo}
          action={modalAction}
          onConfirm={handleModalConfirm}
          onCancel={() => setModalUser(null)}
        />
      )}
    </div>
  );
}
