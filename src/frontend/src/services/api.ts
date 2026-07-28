import type {
  UserOut,
  LoginResponse,
  SetupStatusResponse,
  SetupRequest,
  SetupResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  VerifyTokenResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  UserCreateRequest,
  UserUpdateRequest,
  PaginatedUsersResponse,
  UserActionResponse,
  PerfilResponse,
  PerfilUpdateRequest,
  ChangePasswordRequest,
  ChangePasswordResponse,
  PreferenciasOut,
  PreferenciasUpdateRequest,
  LogoutResponse,
} from '../types/auth';

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
  endpoint: string,
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
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    let message = `Error ${response.status}`;
    try {
      const body = await response.json();
      message = body.detail || body.mensaje || message;
    } catch {
      // ignore
    }
    throw new ApiError(message, response.status);
  }
  return response.json();
}

// ---- PÚBLICAS ----

export function checkSetup(): Promise<SetupStatusResponse> {
  return request<SetupStatusResponse>('/auth/check-setup');
}

export function runSetup(data: SetupRequest): Promise<SetupResponse> {
  return request<SetupResponse>('/auth/setup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function login(data: { email: string; password: string; remember?: boolean }): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
  return request<ForgotPasswordResponse>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function verifyResetToken(token: string): Promise<VerifyTokenResponse> {
  return request<VerifyTokenResponse>(`/auth/verify-reset-token/${encodeURIComponent(token)}`);
}

export function resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
  return request<ResetPasswordResponse>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ---- PROTEGIDAS ----

export function getMe(): Promise<UserOut> {
  return request<UserOut>('/auth/me');
}

export function logout(): Promise<LogoutResponse> {
  return request<LogoutResponse>('/auth/logout', {
    method: 'POST',
  });
}

export function listUsuarios(params: { search?: string; page?: number; page_size?: number }): Promise<PaginatedUsersResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.page_size !== undefined) query.set('page_size', String(params.page_size));
  const qs = query.toString();
  return request<PaginatedUsersResponse>(`/usuarios${qs ? `?${qs}` : ''}`);
}

export function getUsuario(id: number): Promise<UserOut> {
  return request<UserOut>(`/usuarios/${id}`);
}

export function createUsuario(data: UserCreateRequest): Promise<UserOut> {
  return request<UserOut>('/usuarios', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateUsuario(id: number, data: UserUpdateRequest): Promise<UserOut> {
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

export function getPerfil(): Promise<PerfilResponse> {
  return request<PerfilResponse>('/perfil');
}

export function updatePerfil(data: PerfilUpdateRequest): Promise<UserOut> {
  return request<UserOut>('/perfil', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
  return request<ChangePasswordResponse>('/perfil/cambiar-password', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function getPreferencias(): Promise<PreferenciasOut> {
  return request<PreferenciasOut>('/perfil/preferencias');
}

export function updatePreferencias(data: PreferenciasUpdateRequest): Promise<PreferenciasOut> {
  return request<PreferenciasOut>('/perfil/preferencias', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
