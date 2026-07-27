export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateRequired(value: string, fieldName: string): string | null {
  if (!value || value.trim() === '') {
    return `${fieldName} es requerido`;
  }
  return null;
}

export function validateEmail(email: string): string | null {
  if (!email || email.trim() === '') {
    return 'El correo electrónico es requerido';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'El correo electrónico no es válido';
  }
  return null;
}

export function validatePasswordPolicy(password: string): string | null {
  if (!password || password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres';
  }
  if (!/[A-Z]/.test(password)) {
    return 'La contraseña debe contener al menos una mayúscula';
  }
  if (!/[0-9]/.test(password)) {
    return 'La contraseña debe contener al menos un número';
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'La contraseña debe contener al menos un carácter especial';
  }
  return null;
}

export function validatePasswordMatch(password: string, confirmPassword: string): string | null {
  if (password !== confirmPassword) {
    return 'Las contraseñas no coinciden';
  }
  return null;
}

export function validateUsername(username: string): string | null {
  if (!username || username.trim() === '') {
    return 'El nombre de usuario es requerido';
  }
  if (username.length < 3) {
    return 'El nombre de usuario debe tener al menos 3 caracteres';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'El nombre de usuario solo puede contener letras, números y guión bajo';
  }
  return null;
}
