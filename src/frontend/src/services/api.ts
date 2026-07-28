// ============================================================
// API Client — Autenticación, Usuarios y Configuración Inicial
// ============================================================
import type {
  SetupStatusResponse,
  SetupRequest,
  SetupResponse,
  LoginRequest,
  LoginResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  VerifyTokenResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  UserOut,
  UserCreateRequest,
  UserUpdateRequest,
  PaginatedUsersResponse,
  UserActionResponse,
  PerfilResponse,
  PerfilUpdateRequest,
  PreferenciasOut,
  PreferenciasUpdateRequest,
} from '../types/auth';

const API_URL = '/api/autenticacin_usuarios_y_configuracin_inicial';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  params?: Record<string, string | number | boolean | undefined | null>,
): Promise<T> {
  let url = `${API_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const options: RequestInit = {
    method,
    headers: getAuthHeaders(),
  };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    let errorData: { detail?: string; message?: string } | null = null;
    try {
      errorData = await response.json();
    } catch {
      // ignore parse error
    }
    const errorMessage = errorData?.detail || errorData?.message || `Error ${response.status}`;
    const error = new Error(errorMessage) as Error & { status: number };
    error.status = response.status;
    throw error;
  }

  // Si el status es 204 No Content, retornar undefined
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ============================================================
// Endpoints Públicos (Sin autenticación)
// ============================================================

export const authApi = {
  /** GET /api/auth/check-setup */
  checkSetup: () =>
    request<SetupStatusResponse>('GET', '/auth/check-setup'),

  /** POST /api/auth/setup */
  setup: (data: SetupRequest) =>
    request<SetupResponse>('POST', '/auth/setup', data),

  /** POST /api/auth/login */
  login: (data: LoginRequest) =>
    request<LoginResponse>('POST', '/auth/login', data),

  /** POST /api/auth/forgot-password */
  forgotPassword: (data: ForgotPasswordRequest) =>
    request<ForgotPasswordResponse>('POST', '/auth/forgot-password', data),

  /** GET /api/auth/verify-reset-token/{token} */
  verifyResetToken: (token: string) =>
    request<VerifyTokenResponse>('GET', `/auth/verify-reset-token/${token}`),

  /** POST /api/auth/reset-password */
  resetPassword: (data: ResetPasswordRequest) =>
    request<ResetPasswordResponse>('POST', '/auth/reset-password', data),
};

// ============================================================
// Endpoints Protegidos (Requiere token Bearer)
// ============================================================

export const authProtectedApi = {
  /** GET /api/auth/me */
  me: () =>
    request<UserOut>('GET', '/auth/me'),

  /** POST /api/auth/logout */
  logout: () =>
    request<{ mensaje: string }>('POST', '/auth/logout'),
};

export const usuariosApi = {
  /** GET /api/usuarios?search=&page=&page_size= */
  list: (params: { search?: string; page?: number; page_size?: number }) =>
    request<PaginatedUsersResponse>('GET', '/usuarios', undefined, params as Record<string, string | number | boolean | undefined | null>),

  /** GET /api/usuarios/{id} */
  get: (id: number) =>
    request<UserOut>('GET', `/usuarios/${id}`),

  /** POST /api/usuarios */
  create: (data: UserCreateRequest) =>
    request<UserOut>('POST', '/usuarios', data),

  /** PUT /api/usuarios/{id} */
  update: (id: number, data: UserUpdateRequest) =>
    request<UserOut>('PUT', `/usuarios/${id}`, data),

  /** PATCH /api/usuarios/{id}/deactivate */
  deactivate: (id: number) =>
    request<UserActionResponse>('PATCH', `/usuarios/${id}/deactivate`),

  /** PATCH /api/usuarios/{id}/reactivate */
  reactivate: (id: number) =>
    request<UserActionResponse>('PATCH', `/usuarios/${id}/reactivate`),
};

export const perfilApi = {
  /** GET /api/perfil */
  get: () =>
    request<PerfilResponse>('GET', '/perfil'),

  /** PUT /api/perfil */
  update: (data: PerfilUpdateRequest) =>
    request<UserOut>('PUT', '/perfil', data),

  /** PUT /api/perfil/cambiar-password */
  changePassword: (data: ChangePasswordRequest) =>
    request<ChangePasswordResponse>('PUT', '/perfil/cambiar-password', data),

  /** GET /api/perfil/preferencias */
  getPreferencias: () =>
    request<PreferenciasOut>('GET', '/perfil/preferencias'),

  /** PUT /api/perfil/preferencias */
  updatePreferencias: (data: PreferenciasUpdateRequest) =>
    request<PreferenciasOut>('PUT', '/perfil/preferencias', data),
};
