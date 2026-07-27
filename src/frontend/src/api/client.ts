import type {
  SetupStatusResponse,
  SetupRequest,
  SetupResponse,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  UserMeResponse,
  ChangePasswordRequest,
  SessionCheckResponse,
  SessionExtendResponse,
  CreateUserRequest,
  UpdateUserRequest,
  UserResponse,
} from '../types';

const API_URL = '/api';

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function setToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('auth_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  queryParams?: Record<string, string>
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let url = `${API_URL}${path}`;
  if (queryParams) {
    const params = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      params.append(key, value);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'Error en la solicitud';
    try {
      const errorBody = await response.json();
      if (errorBody && errorBody.detail) {
        errorDetail = errorBody.detail;
      }
    } catch {
      errorDetail = `Error ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return <T>{};
}

// Setup endpoints
export async function checkSetupStatus(): Promise<SetupStatusResponse> {
  return request<SetupStatusResponse>('/setup/status');
}

export async function setupFirstAdmin(data: SetupRequest): Promise<SetupResponse> {
  return request<SetupResponse>('/setup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Auth endpoints
export async function login(data: LoginRequest): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function logout(): Promise<MessageResponse> {
  return request<MessageResponse>('/auth/logout', {
    method: 'POST',
  });
}

export async function getMe(): Promise<UserMeResponse> {
  return request<UserMeResponse>('/auth/me');
}

export async function changePassword(data: ChangePasswordRequest): Promise<MessageResponse> {
  return request<MessageResponse>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function checkSession(): Promise<SessionCheckResponse> {
  return request<SessionCheckResponse>('/auth/session/check');
}

export async function extendSession(): Promise<SessionExtendResponse> {
  return request<SessionExtendResponse>('/auth/session/extend', {
    method: 'POST',
  });
}

// Admin users endpoints
export async function listUsers(): Promise<UserResponse[]> {
  return request<UserResponse[]>('/admin/users');
}

export async function getUser(userId: string): Promise<UserResponse> {
  return request<UserResponse>(`/admin/users/${userId}`);
}

export async function createUser(data: CreateUserRequest): Promise<UserResponse> {
  return request<UserResponse>('/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUser(userId: string, data: UpdateUserRequest): Promise<UserResponse> {
  return request<UserResponse>(`/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteUser(userId: string): Promise<MessageResponse> {
  return request<MessageResponse>(`/admin/users/${userId}`, {
    method: 'DELETE',
  });
}
