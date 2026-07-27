export interface UserBrief {
  full_name: string;
  username: string;
  email: string;
  role: string;
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

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserBrief;
}

export interface SetupStatusResponse {
  setup_required: boolean;
}

export interface SetupResponse {
  message: string;
}

export interface LogoutResponse {
  message: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ChangePasswordResponse {
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

export interface DeleteUserResponse {
  message: string;
}

export type UserRole = 'administrador' | 'bodega' | 'vendedor' | 'compras';
