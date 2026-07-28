const API_URL = '/api';

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

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ============================================================
// Import types from the spec-specific types file
// ============================================================
// YOUR API FUNCTIONS GO HERE
// One function per endpoint. Import types, then export API objects.
// Example:
//   export const authApi = {
//     login: (data: LoginRequest) => request<LoginResponse>('POST', '/auth/login', data),
//   };

// ============================================================
// Import types
// ============================================================
import type {
  LoginRequest,
  LoginResponse,
  SetupStatusResponse,
  SetupRequest,
  SetupResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  VerifyTokenResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  PaginatedUsersResponse,
  UserOut,
  UserCreateRequest,
  UserUpdateRequest,
  UserActionResponse,
  PerfilResponse,
  PreferenciasOut,
  PreferenciasUpdateRequest,
  LogoutResponse,
} from '../types/auth';

// ============================================================
// Auth API (Public + Protected)
// ============================================================
export const authApi = {
  checkSetup: () => request<SetupStatusResponse>('GET', '/auth/check-setup'),
  setup: (data: SetupRequest) => request<SetupResponse>('POST', '/auth/setup', data),
  login: (data: LoginRequest) => request<LoginResponse>('POST', '/auth/login', data),
  forgotPassword: (data: ForgotPasswordRequest) => request<ForgotPasswordResponse>('POST', '/auth/forgot-password', data),
  verifyResetToken: (token: string) => request<VerifyTokenResponse>('GET', `/auth/verify-reset-token/${token}`),
  resetPassword: (data: ResetPasswordRequest) => request<ResetPasswordResponse>('POST', '/auth/reset-password', data),
  me: () => request<UserOut>('GET', '/auth/me'),
  logout: () => request<LogoutResponse>('POST', '/auth/logout'),
};

// ============================================================
// Usuarios API (Admin)
// ============================================================
export const usuariosApi = {
  list: (params?: { search?: string; page?: number; page_size?: number }) =>
    request<PaginatedUsersResponse>('GET', '/usuarios', undefined, params as Record<string, string | number | boolean | undefined | null>),
  getById: (id: number) => request<UserOut>('GET', `/usuarios/${id}`),
  create: (data: UserCreateRequest) => request<UserOut>('POST', '/usuarios', data),
  update: (id: number, data: UserUpdateRequest) => request<UserOut>('PUT', `/usuarios/${id}`, data),
  deactivate: (id: number) => request<UserActionResponse>('PATCH', `/usuarios/${id}/deactivate`),
  reactivate: (id: number) => request<UserActionResponse>('PATCH', `/usuarios/${id}/reactivate`),
};

// ============================================================
// Perfil API
// ============================================================
export const perfilApi = {
  get: () => request<PerfilResponse>('GET', '/perfil'),
  update: (data: { nombre_completo?: string; email?: string }) =>
    request<UserOut>('PUT', '/perfil', data),
  changePassword: (data: ChangePasswordRequest) =>
    request<ChangePasswordResponse>('PUT', '/perfil/cambiar-password', data),
  getPreferencias: () => request<PreferenciasOut>('GET', '/perfil/preferencias'),
  updatePreferencias: (data: PreferenciasUpdateRequest) =>
    request<PreferenciasOut>('PUT', '/perfil/preferencias', data),
};
