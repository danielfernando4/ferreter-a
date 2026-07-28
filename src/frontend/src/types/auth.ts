export interface UserOut {
  id: number;
  nombre_completo: string;
  email: string;
  rol: string;
  activo: boolean;
  fecha_registro: string;
  ultimo_acceso: string | null;
}

export interface LoginResponse {
  token: string;
  token_type: string;
  expires_in: number;
  usuario: UserOut;
}

export interface SetupStatusResponse {
  setup_completed: boolean;
  admin_exists: boolean;
}

export interface SetupResponse {
  mensaje: string;
  usuario: UserOut;
}

export interface ForgotPasswordResponse {
  mensaje: string;
}

export interface VerifyTokenResponse {
  valido: boolean;
  email: string;
}

export interface ResetPasswordResponse {
  mensaje: string;
}

export interface LogoutResponse {
  mensaje: string;
}

export interface PaginatedUsersResponse {
  items: UserOut[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface UserActionResponse {
  mensaje: string;
  usuario: UserOut;
}

export interface PreferenciasOut {
  idioma: string;
  tema_visual: string;
  zona_horaria: string;
}

export interface PerfilResponse {
  usuario: UserOut;
  preferencias: PreferenciasOut;
}

export interface ChangePasswordResponse {
  mensaje: string;
}

export interface AuthState {
  user: UserOut | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
