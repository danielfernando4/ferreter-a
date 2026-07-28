const API_URL = '/api/autenticacin_usuarios_y_configuracin_inicial';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = 'Error de solicitud';
    try {
      const body = await res.json();
      message = body.detail || body.mensaje || `Error ${res.status}`;
    } catch {
      message = `Error ${res.status}`;
    }
    throw new ApiError(message, res.status);
  }

  return res.json();
}

// --- Auth endpoints (public) ---

export function checkSetup(): Promise<{ setup_completed: boolean; admin_exists: boolean }> {
  return request('/auth/check-setup');
}

export function runSetup(data: {
  nombre_completo: string;
  email: string;
  password: string;
  negocio_nombre: string;
  negocio_direccion: string;
  negocio_rfc: string;
  negocio_telefono?: string | null;
}): Promise<{ mensaje: string; usuario: { id: number; nombre_completo: string; email: string; rol: string; activo: boolean; fecha_registro: string; ultimo_acceso: string | null } }> {
  return request('/auth/setup', { method: 'POST', body: JSON.stringify(data) });
}

export function login(data: { email: string; password: string; remember?: boolean }): Promise<{
  token: string;
  token_type: string;
  expires_in: number;
  usuario: { id: number; nombre_completo: string; email: string; rol: string; activo: boolean; fecha_registro: string; ultimo_acceso: string | null };
}> {
  return request('/auth/login', { method: 'POST', body: JSON.stringify(data) });
}

export function forgotPassword(data: { email: string }): Promise<{ mensaje: string }> {
  return request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) });
}

export function verifyResetToken(token: string): Promise<{ valido: boolean; email: string }> {
  return request(`/auth/verify-reset-token/${token}`);
}

export function resetPassword(data: { token: string; new_password: string; confirm_password: string }): Promise<{ mensaje: string }> {
  return request('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) });
}

// --- Auth endpoints (protected) ---

export function getMe(): Promise<{
  id: number;
  nombre_completo: string;
  email: string;
  rol: string;
  activo: boolean;
  fecha_registro: string;
  ultimo_acceso: string | null;
}> {
  return request('/auth/me');
}

export function logout(): Promise<{ mensaje: string }> {
  return request('/auth/logout', { method: 'POST' });
}

// --- Usuarios endpoints (protected, admin) ---

export function listUsuarios(params?: { search?: string; page?: number; page_size?: number }): Promise<{
  items: {
    id: number;
    nombre_completo: string;
    email: string;
    rol: string;
    activo: boolean;
    fecha_registro: string;
    ultimo_acceso: string | null;
  }[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.page !== undefined) query.set('page', String(params.page));
  if (params?.page_size !== undefined) query.set('page_size', String(params.page_size));
  const qs = query.toString();
  return request(`/usuarios${qs ? `?${qs}` : ''}`);
}

export function getUsuario(id: number): Promise<{
  id: number;
  nombre_completo: string;
  email: string;
  rol: string;
  activo: boolean;
  fecha_registro: string;
  ultimo_acceso: string | null;
}> {
  return request(`/usuarios/${id}`);
}

export function createUsuario(data: {
  nombre_completo: string;
  email: string;
  password: string;
  rol: string;
}): Promise<{
  id: number;
  nombre_completo: string;
  email: string;
  rol: string;
  activo: boolean;
  fecha_registro: string;
  ultimo_acceso: string | null;
}> {
  return request('/usuarios', { method: 'POST', body: JSON.stringify(data) });
}

export function updateUsuario(
  id: number,
  data: { nombre_completo?: string; email?: string; rol?: string }
): Promise<{
  id: number;
  nombre_completo: string;
  email: string;
  rol: string;
  activo: boolean;
  fecha_registro: string;
  ultimo_acceso: string | null;
}> {
  return request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deactivateUsuario(id: number): Promise<{ mensaje: string; usuario: {
  id: number;
  nombre_completo: string;
  email: string;
  rol: string;
  activo: boolean;
  fecha_registro: string;
  ultimo_acceso: string | null;
} }> {
  return request(`/usuarios/${id}/deactivate`, { method: 'PATCH' });
}

export function reactivateUsuario(id: number): Promise<{ mensaje: string; usuario: {
  id: number;
  nombre_completo: string;
  email: string;
  rol: string;
  activo: boolean;
  fecha_registro: string;
  ultimo_acceso: string | null;
} }> {
  return request(`/usuarios/${id}/reactivate`, { method: 'PATCH' });
}

// --- Perfil endpoints (protected) ---

export function getPerfil(): Promise<{
  usuario: {
    id: number;
    nombre_completo: string;
    email: string;
    rol: string;
    activo: boolean;
    fecha_registro: string;
    ultimo_acceso: string | null;
  };
  preferencias: {
    idioma: string;
    tema_visual: string;
    zona_horaria: string;
  };
}> {
  return request('/perfil');
}

export function updatePerfil(data: { nombre_completo?: string; email?: string }): Promise<{
  id: number;
  nombre_completo: string;
  email: string;
  rol: string;
  activo: boolean;
  fecha_registro: string;
  ultimo_acceso: string | null;
}> {
  return request('/perfil', { method: 'PUT', body: JSON.stringify(data) });
}

export function changePassword(data: { current_password: string; new_password: string; confirm_password: string }): Promise<{ mensaje: string }> {
  return request('/perfil/cambiar-password', { method: 'PUT', body: JSON.stringify(data) });
}

export function getPreferencias(): Promise<{
  idioma: string;
  tema_visual: string;
  zona_horaria: string;
}> {
  return request('/perfil/preferencias');
}

export function updatePreferencias(data: { idioma?: string; tema_visual?: string; zona_horaria?: string }): Promise<{
  idioma: string;
  tema_visual: string;
  zona_horaria: string;
}> {
  return request('/perfil/preferencias', { method: 'PUT', body: JSON.stringify(data) });
}
