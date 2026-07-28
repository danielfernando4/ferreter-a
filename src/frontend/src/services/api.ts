const API_URL = '/api/autenticacin_usuarios_y_configuracin_inicial';

class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');
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
    let detail = 'Error de conexión';
    try {
      const body = await res.json();
      detail = body.detail || `Error ${res.status}`;
    } catch {
      detail = `Error ${res.status}: ${res.statusText}`;
    }
    throw new ApiError(res.status, detail);
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  return undefined as T;
}

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface UserOut {
  id: number;
  nombre_completo: string;
  email: string;
  rol: string;
  activo: boolean;
  fecha_registro: string;
  ultimo_acceso: string | null;
}

export interface UserCreateRequest {
  nombre_completo: string;
  email: string;
  password: string;
  rol: string;
}

export interface UserUpdateRequest {
  nombre_completo?: string;
  email?: string;
  rol?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface LoginResponse {
  token: string;
  token_type: string;
  expires_in: number;
  usuario: UserOut;
}

export interface SetupRequest {
  nombre_completo: string;
  email: string;
  password: string;
  negocio_nombre: string;
  negocio_direccion: string;
  negocio_rfc: string;
  negocio_telefono?: string;
}

export interface SetupResponse {
  mensaje: string;
  usuario: UserOut;
}

export interface SetupStatusResponse {
  setup_completed: boolean;
  admin_exists: boolean;
}

export interface PreferenciasOut {
  idioma: string;
  tema_visual: string;
  zona_horaria: string;
}

export interface PreferenciasUpdateRequest {
  idioma?: string;
  tema_visual?: string;
  zona_horaria?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  mensaje: string;
}

export interface VerifyTokenResponse {
  valido: boolean;
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface ResetPasswordResponse {
  mensaje: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ChangePasswordResponse {
  mensaje: string;
}

export interface PaginatedUsersResponse {
  items: UserOut[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface UserActionResponse {
  mensaje: string;
  usuario: UserOut;
}

export interface PerfilResponse {
  usuario: UserOut;
  preferencias: PreferenciasOut;
}

export interface LogoutResponse {
  mensaje: string;
}

// ─── Endpoints Públicos (Setup) ──────────────────────────────────────────────

export async function checkSetupStatus(): Promise<SetupStatusResponse> {
  return request<SetupStatusResponse>('/auth/check-setup');
}

export async function runSetup(data: SetupRequest): Promise<SetupResponse> {
  return request<SetupResponse>('/auth/setup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Endpoints Públicos (Auth) ───────────────────────────────────────────────

export async function loginApi(data: LoginRequest): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function forgotPasswordApi(
  data: ForgotPasswordRequest
): Promise<ForgotPasswordResponse> {
  return request<ForgotPasswordResponse>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function verifyResetToken(
  token: string
): Promise<VerifyTokenResponse> {
  return request<VerifyTokenResponse>(
    `/auth/verify-reset-token/${encodeURIComponent(token)}`
  );
}

export async function resetPasswordApi(
  data: ResetPasswordRequest
): Promise<ResetPasswordResponse> {
  return request<ResetPasswordResponse>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Endpoints Protegidos (Auth) ─────────────────────────────────────────────

export async function getMe(): Promise<UserOut> {
  return request<UserOut>('/auth/me');
}

export async function logoutApi(): Promise<LogoutResponse> {
  return request<LogoutResponse>('/auth/logout', {
    method: 'POST',
  });
}

// ─── Endpoints Protegidos (Admin - Usuarios) ─────────────────────────────────

export async function listUsuarios(
  search?: string,
  page: number = 1,
  page_size: number = 10
): Promise<PaginatedUsersResponse> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  params.set('page', String(page));
  params.set('page_size', String(page_size));
  return request<PaginatedUsersResponse>(
    `/usuarios?${params.toString()}`
  );
}

export async function getUsuario(id: number): Promise<UserOut> {
  return request<UserOut>(`/usuarios/${id}`);
}

export async function createUsuario(
  data: UserCreateRequest
): Promise<UserOut> {
  return request<UserOut>('/usuarios', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUsuario(
  id: number,
  data: UserUpdateRequest
): Promise<UserOut> {
  return request<UserOut>(`/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deactivateUsuario(
  id: number
): Promise<UserActionResponse> {
  return request<UserActionResponse>(
    `/usuarios/${id}/deactivate`,
    { method: 'PATCH' }
  );
}

export async function reactivateUsuario(
  id: number
): Promise<UserActionResponse> {
  return request<UserActionResponse>(
    `/usuarios/${id}/reactivate`,
    { method: 'PATCH' }
  );
}

// ─── Endpoints Protegidos (Perfil) ───────────────────────────────────────────

export async function getPerfil(): Promise<PerfilResponse> {
  return request<PerfilResponse>('/perfil');
}

export async function updatePerfil(
  data: UserUpdateRequest
): Promise<UserOut> {
  return request<UserOut>('/perfil', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function changePasswordApi(
  data: ChangePasswordRequest
): Promise<ChangePasswordResponse> {
  return request<ChangePasswordResponse>(
    '/perfil/cambiar-password',
    { method: 'PUT', body: JSON.stringify(data) }
  );
}

export async function getPreferencias(): Promise<PreferenciasOut> {
  return request<PreferenciasOut>('/perfil/preferencias');
}

export async function updatePreferencias(
  data: PreferenciasUpdateRequest
): Promise<PreferenciasOut> {
  return request<PreferenciasOut>('/perfil/preferencias', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export { ApiError };
