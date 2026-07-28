// ============================================================
// API Client — Autenticación, Usuarios y Configuración Inicial
// ============================================================
import type {
  LoginRequest,
  LoginResponse,
  SetupRequest,
  SetupResponse,
  SetupStatusResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  VerifyTokenResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  PreferenciasOut,
  PreferenciasUpdateRequest,
  PaginatedUsersResponse,
  UserOut,
  UserCreateRequest,
  UserUpdateRequest,
  UserActionResponse,
  PerfilResponse,
  PerfilUpdateRequest,
} from '../types/auth';

const API_URL = '/api/autenticacin_usuarios_y_configuracin_inicial';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
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
    let msg = `Error ${res.status}`;
    try {
      const body = await res.json();
      msg = body.detail || body.mensaje || msg;
    } catch {
      // ignore
    }
    throw new ApiError(msg, res.status);
  }
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return (await res.json()) as T;
  }
  return undefined as unknown as T;
}

// --- Public Endpoints ---

export function checkSetup(token?: string | null): Promise<SetupStatusResponse> {
  return request<SetupStatusResponse>('/auth/check-setup', {}, token);
}

export function runSetup(data: SetupRequest): Promise<SetupResponse> {
  return request<SetupResponse>('/auth/setup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function login(data: LoginRequest): Promise<LoginResponse> {
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
  return request<VerifyTokenResponse>(`/auth/verify-reset-token/${token}`);
}

export function resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
  return request<ResetPasswordResponse>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// --- Protected Endpoints ---

export function getMe(token: string): Promise<UserOut> {
  return request<UserOut>('/auth/me', {}, token);
}

export function logout(token: string): Promise<{ mensaje: string }> {
  return request<{ mensaje: string }>('/auth/logout', { method: 'POST' }, token);
}

export function listUsuarios(
  token: string,
  params: { search?: string; page?: number; page_size?: number },
): Promise<PaginatedUsersResponse> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.page !== undefined) qs.set('page', String(params.page));
  if (params.page_size !== undefined) qs.set('page_size', String(params.page_size));
  const q = qs.toString();
  return request<PaginatedUsersResponse>(`/usuarios${q ? `?${q}` : ''}`, {}, token);
}

export function getUsuario(token: string, id: number): Promise<UserOut> {
  return request<UserOut>(`/usuarios/${id}`, {}, token);
}

export function createUsuario(token: string, data: UserCreateRequest): Promise<UserOut> {
  return request<UserOut>('/usuarios', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
}

export function updateUsuario(token: string, id: number, data: UserUpdateRequest): Promise<UserOut> {
  return request<UserOut>(`/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, token);
}

export function deactivateUsuario(token: string, id: number): Promise<UserActionResponse> {
  return request<UserActionResponse>(`/usuarios/${id}/deactivate`, { method: 'PATCH' }, token);
}

export function reactivateUsuario(token: string, id: number): Promise<UserActionResponse> {
  return request<UserActionResponse>(`/usuarios/${id}/reactivate`, { method: 'PATCH' }, token);
}

export function getPerfil(token: string): Promise<PerfilResponse> {
  return request<PerfilResponse>('/perfil', {}, token);
}

export function updatePerfil(token: string, data: PerfilUpdateRequest): Promise<UserOut> {
  return request<UserOut>('/perfil', {
    method: 'PUT',
    body: JSON.stringify(data),
  }, token);
}

export function changePassword(token: string, data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
  return request<ChangePasswordResponse>('/perfil/cambiar-password', {
    method: 'PUT',
    body: JSON.stringify(data),
  }, token);
}

export function getPreferencias(token: string): Promise<PreferenciasOut> {
  return request<PreferenciasOut>('/perfil/preferencias', {}, token);
}

export function updatePreferencias(token: string, data: PreferenciasUpdateRequest): Promise<PreferenciasOut> {
  return request<PreferenciasOut>('/perfil/preferencias', {
    method: 'PUT',
    body: JSON.stringify(data),
  }, token);
}

export { ApiError };
