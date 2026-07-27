export interface ValidationErrors {
  [key: string]: string;
}

export function validateRequired(value: string, fieldName: string): string {
  if (!value || value.trim() === '') {
    return `${fieldName} es obligatorio`;
  }
  return '';
}

export function validateEmail(email: string): string {
  if (!email || email.trim() === '') {
    return 'El correo electrónico es obligatorio';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'El correo electrónico no es válido';
  }
  return '';
}

export function validatePasswordMatch(password: string, confirmPassword: string): string {
  if (password !== confirmPassword) {
    return 'Las contraseñas no coinciden';
  }
  return '';
}
