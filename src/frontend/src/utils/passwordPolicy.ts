export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: 'La contraseña debe tener al menos 8 caracteres' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'La contraseña debe contener al menos una mayúscula' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'La contraseña debe contener al menos un número' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(password)) {
    return { valid: false, message: 'La contraseña debe contener al menos un carácter especial' };
  }
  return { valid: true, message: '' };
}
