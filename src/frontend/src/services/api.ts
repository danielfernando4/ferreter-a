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
  LogoutResponse,
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
  authToken?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // Remove Content-Type if no body
  if (!options.body) {
    delete headers['Content-Type'];
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = 'Error en la solicitud';
    try {
      const err = await res.json();
      message = err.detail || err.message || message;
    } catch {
      message = res.statusText || message;
    }
    throw new ApiError(message, res.status);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as unknown as T;
  }

  return res.json();
}

function getToken(): string | null {
  const stored = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  return stored;
}

// ==============================
// Auth (Public)
// ==============================

export function checkSetup(): Promise<SetupStatusResponse> {
  return request<SetupStatusResponse>('/auth/check-setup');
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

// ==============================
// Auth (Protected)
// ==============================

export function getMe(): Promise<UserOut> {
  return request<UserOut>('/auth/me', {}, getToken());
}

export function logout(): Promise<LogoutResponse> {
  return request<LogoutResponse>(
    '/auth/logout',
    { method: 'POST' },
    getToken()
  );
}

// ==============================
// Users (Admin)
// ==============================

export function listUsuarios(params?: {
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedUsersResponse> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.page !== undefined) searchParams.set('page', String(params.page));
  if (params?.page_size !== undefined) searchParams.set('page_size', String(params.page_size));
  const qs = searchParams.toString();
  return request<PaginatedUsersResponse>(`/usuarios${qs ? `?${qs}` : ''}`, {}, getToken());
}

export function getUsuario(id: number): Promise<UserOut> {
  return request<UserOut>(`/usuarios/${id}`, {}, getToken());
}

export function createUsuario(data: UserCreateRequest): Promise<UserOut> {
  return request<UserOut>('/usuarios', {
    method: 'POST',
    body: JSON.stringify(data),
  }, getToken());
}

export function updateUsuario(id: number, data: UserUpdateRequest): Promise<UserOut> {
  return request<UserOut>(`/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, getToken());
}

export function deactivateUsuario(id: number): Promise<UserActionResponse> {
  return request<UserActionResponse>(`/usuarios/${id}/deactivate`, {
    method: 'PATCH',
  }, getToken());
}

export function reactivateUsuario(id: number): Promise<UserActionResponse> {
  return request<UserActionResponse>(`/usuarios/${id}/reactivate`, {
    method: 'PATCH',
  }, getToken());
}

// ==============================
// Perfil
// ==============================

export function getPerfil(): Promise<PerfilResponse> {
  return request<PerfilResponse>('/perfil', {}, getToken());
}

export function updatePerfil(data: PerfilUpdateRequest): Promise<UserOut> {
  return request<UserOut>('/perfil', {
    method: 'PUT',
    body: JSON.stringify(data),
  }, getToken());
}

export function changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
  return request<ChangePasswordResponse>('/perfil/cambiar-password', {
    method: 'PUT',
    body: JSON.stringify(data),
  }, getToken());
}

export function getPreferencias(): Promise<PreferenciasOut> {
  return request<PreferenciasOut>('/perfil/preferencias', {}, getToken());
}

export function updatePreferencias(data: PreferenciasUpdateRequest): Promise<PreferenciasOut> {
  return request<PreferenciasOut>('/perfil/preferencias', {
    method: 'PUT',
    body: JSON.stringify(data),
  }, getToken());
}
