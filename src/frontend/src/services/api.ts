import type {
  UserOut,
  UserCreateRequest,
  UserUpdateRequest,
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
  LogoutResponse,
  PaginatedUsersResponse,
  UserActionResponse,
  PreferenciasOut,
  PreferenciasUpdateRequest,
  PerfilResponse,
  PerfilUpdateRequest,
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

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Error ${response.status}`;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.detail || errorBody.mensaje || errorMessage;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(errorMessage, response.status);
  }

  return response.json();
}

// --- Auth endpoints (public) ---

export function checkSetupStatus(): Promise<SetupStatusResponse> {
  return request<SetupStatusResponse>('/check-setup');
}

export function runSetup(data: SetupRequest): Promise<SetupResponse> {
  return request<SetupResponse>('/setup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function login(data: LoginRequest): Promise<LoginResponse> {
  return request<LoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function forgotPassword(
  data: ForgotPasswordRequest
): Promise<ForgotPasswordResponse> {
  return request<ForgotPasswordResponse>('/forgot-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function verifyResetToken(
  token: string
): Promise<VerifyTokenResponse> {
  return request<VerifyTokenResponse>(
    `/verify-reset-token/${token}`
  );
}

export function resetPassword(
  data: ResetPasswordRequest
): Promise<ResetPasswordResponse> {
  return request<ResetPasswordResponse>('/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// --- Auth endpoints (protected) ---

export function getMe(): Promise<UserOut> {
  return request<UserOut>('/me');
}

export function logout(): Promise<LogoutResponse> {
  return request<LogoutResponse>('/logout', {
    method: 'POST',
  });
}

// --- User management endpoints (protected, admin) ---

export function listUsuarios(
  search?: string,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedUsersResponse> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  params.set('page', String(page));
  params.set('page_size', String(pageSize));
  return request<PaginatedUsersResponse>(
    `/usuarios?${params.toString()}`
  );
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

export function deactivateUsuario(
  id: number
): Promise<UserActionResponse> {
  return request<UserActionResponse>(`/usuarios/${id}/deactivate`, {
    method: 'PATCH',
  });
}

export function reactivateUsuario(
  id: number
): Promise<UserActionResponse> {
  return request<UserActionResponse>(`/usuarios/${id}/reactivate`, {
    method: 'PATCH',
  });
}

// --- Profile endpoints (protected) ---

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
