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
  UserOut,
  LogoutResponse,
  PaginatedUsersResponse,
  UserCreateRequest,
  UserUpdateRequest,
  UserActionResponse,
  PerfilResponse,
  PreferenciasOut,
  PreferenciasUpdateRequest,
  ChangePasswordRequest,
  ChangePasswordResponse,
} from '../types/auth';

const API_URL = '/api/autenticacin_usuarios_y_configuracin_inicial';

// ============================================================
// Helper: generic request function
// ============================================================
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
    let errorMsg = `Error ${res.status}`;
    try {
      const errorBody = await res.json();
      errorMsg = errorBody.detail || errorBody.mensaje || errorMsg;
    } catch {
      // ignore parse error
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

// ============================================================
// Auth Endpoints (Públicos)
// ============================================================

export async function checkSetupStatus(): Promise<SetupStatusResponse> {
  return request<SetupStatusResponse>('/auth/check-setup');
}

export async function runSetup(data: SetupRequest): Promise<SetupResponse> {
  return request<SetupResponse>('/auth/setup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function forgotPassword(
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
  return request<VerifyTokenResponse>(`/auth/verify-reset-token/${token}`);
}

export async function resetPassword(
  data: ResetPasswordRequest
): Promise<ResetPasswordResponse> {
  return request<ResetPasswordResponse>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================================
// Auth Endpoints (Protegidos)
// ============================================================

export async function getMe(): Promise<UserOut> {
  return request<UserOut>('/auth/me');
}

export async function logoutUser(): Promise<LogoutResponse> {
  return request<LogoutResponse>('/auth/logout', {
    method: 'POST',
  });
}

// ============================================================
// Usuarios Endpoints (Protegidos - Admin)
// ============================================================

export async function listUsuarios(
  search?: string,
  page: number = 1,
  page_size: number = 10
): Promise<PaginatedUsersResponse> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('page_size', String(page_size));
  if (search) params.set('search', search);
  return request<PaginatedUsersResponse>(`/usuarios?${params.toString()}`);
}

export async function getUsuario(userId: number): Promise<UserOut> {
  return request<UserOut>(`/usuarios/${userId}`);
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
  userId: number,
  data: UserUpdateRequest
): Promise<UserOut> {
  return request<UserOut>(`/usuarios/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deactivateUsuario(
  userId: number
): Promise<UserActionResponse> {
  return request<UserActionResponse>(`/usuarios/${userId}/deactivate`, {
    method: 'PATCH',
  });
}

export async function reactivateUsuario(
  userId: number
): Promise<UserActionResponse> {
  return request<UserActionResponse>(`/usuarios/${userId}/reactivate`, {
    method: 'PATCH',
  });
}

// ============================================================
// Perfil Endpoints (Protegidos)
// ============================================================

export async function getPerfil(): Promise<PerfilResponse> {
  return request<PerfilResponse>('/perfil');
}

export async function updatePerfil(
  data: { nombre_completo?: string; email?: string }
): Promise<UserOut> {
  return request<UserOut>('/perfil', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function changePassword(
  data: ChangePasswordRequest
): Promise<ChangePasswordResponse> {
  return request<ChangePasswordResponse>('/perfil/cambiar-password', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
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
