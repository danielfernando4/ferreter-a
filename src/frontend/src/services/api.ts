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
  UserOut,
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
    this.name = 'ApiError';
    this.status = status;
  }
}

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = 'Error en la solicitud';
    try {
      const errorData = await response.json();
      message = errorData.detail || errorData.mensaje || message;
    } catch {
      // ignore
    }
    throw new ApiError(message, response.status);
  }

  return response.json();
}

// --- Public Endpoints ---

export async function checkSetup(): Promise<SetupStatusResponse> {
  return request<SetupStatusResponse>('/auth/check-setup');
}

export async function runSetup(data: SetupRequest): Promise<SetupResponse> {
  return request<SetupResponse>('/auth/setup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
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

// --- Protected Endpoints ---

export async function getMe(): Promise<UserOut> {
  return request<UserOut>('/auth/me');
}

export async function logout(): Promise<LogoutResponse> {
  return request<LogoutResponse>('/auth/logout', {
    method: 'POST',
  });
}

export async function listUsuarios(
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

export async function deactivateUsuario(id: number): Promise<UserActionResponse> {
  return request<UserActionResponse>(`/usuarios/${id}/deactivate`, {
    method: 'PATCH',
  });
}

export async function reactivateUsuario(id: number): Promise<UserActionResponse> {
  return request<UserActionResponse>(`/usuarios/${id}/reactivate`, {
    method: 'PATCH',
  });
}

export async function getPerfil(): Promise<PerfilResponse> {
  return request<PerfilResponse>('/perfil');
}

export async function updatePerfil(
  data: PerfilUpdateRequest
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
