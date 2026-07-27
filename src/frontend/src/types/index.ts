export interface User {
  id?: string;
  full_name: string;
  username: string;
  email: string;
  role: 'administrador' | 'bodega' | 'vendedor' | 'compras';
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface SetupStatusResponse {
  setup_required: boolean;
}

export interface SetupRequest {
  full_name: string;
  username: string;
  email: string;
  password: string;
}

export interface SetupResponse {
  message: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface MessageResponse {
  message: string;
}

export interface SessionCheckResponse {
  active: boolean;
  expires_at: string;
}

export interface SessionExtendResponse {
  message: string;
  expires_at: string;
}

export interface CreateUserRequest {
  full_name: string;
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface UpdateUserRequest {
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

export interface UserResponse {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at?: string;
}

export interface UserMeResponse {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at?: string;
}
