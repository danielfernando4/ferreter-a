import type {
  LoginResponse,
  SetupStatusResponse,
  SetupResponse,
  ForgotPasswordResponse,
  VerifyTokenResponse,
  ResetPasswordResponse,
  LogoutResponse,
  PaginatedUsersResponse,
  UserOut,
  UserActionResponse,
  PerfilResponse,
  PreferenciasOut,
  ChangePasswordResponse,
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

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = 'Error en la solicitud';
    try {
      const body = await res.json();
      message = body.detail || body.mensaje || message;
    } catch {
      // ignore
    }
    throw new ApiError(message, res.status);
  }

  return res.json();
}

// --- Public endpoints ---

export function checkSetup(): Promise<SetupStatusResponse> {
  return request<SetupStatusResponse>('/auth/check-setup');
}

export function runSetup(data: {
  nombre_completo: string;
  email: string;
  password: string;
  negocio_nombre: string;
  negocio_direccion: string;
  negocio_rfc: string;
  negocio_telefono?: string | null;
}): Promise<SetupResponse> {
  return request<SetupResponse>('/auth/setup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function login(data: {
  email: string;
  password: string;
  remember?: boolean;
}): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function forgotPassword(data: { email: string }): Promise<ForgotPasswordResponse> {
  return request<ForgotPasswordResponse>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function verifyResetToken(token: string): Promise<VerifyTokenResponse> {
  return request<VerifyTokenResponse>(`/auth/verify-reset-token/${token}`);
}

export function resetPassword(data: {
  token: string;
  new_password: string;
  confirm_password: string;
}): Promise<ResetPasswordResponse> {
  return request<ResetPasswordResponse>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// --- Protected endpoints ---

export function getMe(): Promise<UserOut> {
  return request<UserOut>('/auth/me');
}

export function logout(): Promise<LogoutResponse> {
  return request<LogoutResponse>('/auth/logout', {
    method: 'POST',
  });
}

export function listUsuarios(params: {
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedUsersResponse> {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set('search', params.search);
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  if (params.page_size !== undefined) searchParams.set('page_size', String(params.page_size));
  const qs = searchParams.toString();
  return request<PaginatedUsersResponse>(`/usuarios${qs ? `?${qs}` : ''}`);
}

export function getUsuario(id: number): Promise<UserOut> {
  return request<UserOut>(`/usuarios/${id}`);
}

export function createUsuario(data: {
  nombre_completo: string;
  email: string;
  password: string;
  rol: string;
}): Promise<UserOut> {
  return request<UserOut>('/usuarios', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateUsuario(
  id: number,
  data: {
    nombre_completo?: string;
    email?: string;
    rol?: string;
  }
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

export function getPerfil(): Promise<PerfilResponse> {
  return request<PerfilResponse>('/perfil');
}

export function updatePerfil(data: {
  nombre_completo?: string;
  email?: string;
}): Promise<UserOut> {
  return request<UserOut>('/perfil', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function changePassword(data: {
  current_password: string;
  new_password: string;
  confirm_password: string;
}): Promise<ChangePasswordResponse> {
  return request<ChangePasswordResponse>('/perfil/cambiar-password', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function getPreferencias(): Promise<PreferenciasOut> {
  return request<PreferenciasOut>('/perfil/preferencias');
}

export function updatePreferencias(data: {
  idioma?: string;
  tema_visual?: string;
  zona_horaria?: string;
}): Promise<PreferenciasOut> {
  return request<PreferenciasOut>('/perfil/preferencias', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
