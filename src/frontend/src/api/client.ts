const API_URL = '/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
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
    let detail = 'Error en la solicitud';
    try {
      const errorData = await response.json();
      detail = errorData.detail || detail;
    } catch {
      // ignore parse error
    }
    throw new ApiError(detail, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Setup endpoints
export function checkSetupStatus(): Promise<{ setup_required: boolean }> {
  return request<{ setup_required: boolean }>('/setup/status');
}

export function setupFirstAdmin(data: {
  full_name: string;
  username: string;
  email: string;
  password: string;
}): Promise<{ message: string }> {
  return request<{ message: string }>('/setup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Auth endpoints
export function login(data: {
  username: string;
  password: string;
}): Promise<{ token: string; user: { full_name: string; username: string; email: string; role: string } }> {
  return request<{ token: string; user: { full_name: string; username: string; email: string; role: string } }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function logout(): Promise<{ message: string }> {
  return request<{ message: string }>('/auth/logout', {
    method: 'POST',
  });
}

export function getMe(): Promise<{
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at?: string;
}> {
  return request('/auth/me');
}

export function changePassword(data: {
  current_password: string;
  new_password: string;
  confirm_password: string;
}): Promise<{ message: string }> {
  return request<{ message: string }>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function checkSession(): Promise<{ active: boolean; expires_at: string }> {
  return request<{ active: boolean; expires_at: string }>('/auth/session/check');
}

export function extendSession(): Promise<{ message: string; expires_at: string }> {
  return request<{ message: string; expires_at: string }>('/auth/session/extend', {
    method: 'POST',
  });
}

// Admin users endpoints
export function listUsers(): Promise<any[]> {
  return request<any[]>('/admin/users');
}

export function getUser(userId: string): Promise<any> {
  return request<any>(`/admin/users/${userId}`);
}

export function createUser(data: {
  full_name: string;
  username: string;
  email: string;
  password: string;
  role: string;
}): Promise<any> {
  return request<any>('/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateUser(
  userId: string,
  data: { full_name: string; email: string; role: string; is_active: boolean }
): Promise<any> {
  return request<any>(`/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteUser(userId: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/admin/users/${userId}`, {
    method: 'DELETE',
  });
}
