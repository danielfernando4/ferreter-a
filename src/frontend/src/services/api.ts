import type {
  UserOut,
  LoginRequest,
  LoginResponse,
  SetupStatusResponse,
  SetupRequest,
  SetupResponse,
  PaginatedUsersResponse,
  UserCreateRequest,
  UserUpdateRequest,
  UserActionResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  VerifyTokenResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  PreferenciasOut,
  PreferenciasUpdateRequest,
  PerfilResponse,
  PerfilUpdateRequest,
  LogoutResponse,
} from '../types/auth';

const API_URL = '/api';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  skipAuth = false
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (!skipAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'Error en la solicitud';
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.detail || errorBody.mensaje || errorMessage;
    } catch {
      errorMessage = `Error ${response.status}`;
    }
    throw new ApiError(errorMessage, response.status);
  }

  return response.json();
}

// --- Auth endpoints (public) ---
export function checkSetup(): Promise<SetupStatusResponse> {
  return request<SetupStatusResponse>('/auth/check-setup', {}, true);
}

export function runSetup(data: SetupRequest): Promise<SetupResponse> {
  return request<SetupResponse>(
    '/auth/setup',
    { method: 'POST', body: JSON.stringify(data) },
    true
  );
}

export function login(data: LoginRequest): Promise<LoginResponse> {
  return request<LoginResponse>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify(data) },
    true
  );
}

export function forgotPassword(
  data: ForgotPasswordRequest
): Promise<ForgotPasswordResponse> {
  return request<ForgotPasswordResponse>(
    '/auth/forgot-password',
    { method: 'POST', body: JSON.stringify(data) },
    true
  );
}

export function verifyResetToken(
  token: string
): Promise<VerifyTokenResponse> {
  return request<VerifyTokenResponse>(
    `/auth/verify-reset-token/${token}`,
    {},
    true
  );
}

export function resetPassword(
  data: ResetPasswordRequest
): Promise<ResetPasswordResponse> {
  return request<ResetPasswordResponse>(
    '/auth/reset-password',
    { method: 'POST', body: JSON.stringify(data) },
    true
  );
}

// --- Protected auth endpoints ---
export function getMe(): Promise<UserOut> {
  return request<UserOut>('/auth/me');
}

export function logout(): Promise<LogoutResponse> {
  return request<LogoutResponse>('/auth/logout', { method: 'POST' });
}

// --- Usuarios endpoints (admin) ---
export function listUsuarios(
  search?: string,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedUsersResponse> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  params.set('page', String(page));
  params.set('page_size', String(pageSize));
  return request<PaginatedUsersResponse>(`/usuarios?${params.toString()}`);
}

export function getUsuario(id: number): Promise<UserOut> {
  return request<UserOut>(`/usuarios/${id}`);
}

export function createUsuario(
  data: UserCreateRequest
): Promise<UserOut> {
  return request<UserOut>('/usuarios', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateUsuario(
  id: number,
  data: UserUpdateRequest
): Promise<UserOut> {
  return request<UserOut>(`/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deactivateUsuario(id: number): Promise<UserActionResponse> {
  return request<UserActionResponse>(`/usuarios/${id}/deactivate`, {
    method: 'PATCH',
  });
}

export function reactivateUsuario(id: number): Promise<UserActionResponse> {
  return request<UserActionResponse>(`/usuarios/${id}/reactivate`, {
    method: 'PATCH',
  });
}

// --- Perfil endpoints ---
export function getPerfil(): Promise<PerfilResponse> {
  return request<PerfilResponse>('/perfil');
}

export function updatePerfil(
  data: PerfilUpdateRequest
): Promise<UserOut> {
  return request<UserOut>('/perfil', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function changePassword(
  data: ChangePasswordRequest
): Promise<ChangePasswordResponse> {
  return request<ChangePasswordResponse>('/perfil/cambiar-password', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function getPreferencias(): Promise<PreferenciasOut> {
  return request<PreferenciasOut>('/perfil/preferencias');
}

export function updatePreferencias(
  data: PreferenciasUpdateRequest
): Promise<PreferenciasOut> {
  return request<PreferenciasOut>('/perfil/preferencias', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export { ApiError };
