export interface UserOut {
  id: number;
  nombre_completo: string;
  email: string;
  rol: string;
  activo: boolean;
  fecha_registro: string;
  ultimo_acceso: string | null;
}

export interface UserCreateRequest {
  nombre_completo: string;
  email: string;
  password: string;
  rol: string;
}

export interface UserUpdateRequest {
  nombre_completo?: string;
  email?: string;
  rol?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface LoginResponse {
  token: string;
  token_type: string;
  expires_in: number;
  usuario: UserOut;
}

export interface SetupRequest {
  nombre_completo: string;
  email: string;
  password: string;
  negocio_nombre: string;
  negocio_direccion: string;
  negocio_rfc: string;
  negocio_telefono?: string;
}

export interface SetupResponse {
  mensaje: string;
  usuario: UserOut;
}

export interface SetupStatusResponse {
  setup_completed: boolean;
  admin_exists: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  mensaje: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface ResetPasswordResponse {
  mensaje: string;
}

export interface VerifyTokenResponse {
  valido: boolean;
  email: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ChangePasswordResponse {
  mensaje: string;
}

export interface PreferenciasOut {
  idioma: string;
  tema_visual: string;
  zona_horaria: string;
}

export interface PreferenciasUpdateRequest {
  idioma?: string;
  tema_visual?: string;
  zona_horaria?: string;
}

export interface PerfilUpdateRequest {
  nombre_completo?: string;
  email?: string;
}

export interface PerfilResponse {
  usuario: UserOut;
  preferencias: PreferenciasOut;
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

export interface LogoutResponse {
  mensaje: string;
}
