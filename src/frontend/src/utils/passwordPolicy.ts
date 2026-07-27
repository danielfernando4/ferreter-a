export interface PasswordPolicyResult {
  valid: boolean;
  errors: string[];
}

export function checkPasswordPolicy(password: string): PasswordPolicyResult {
  const errors: string[] = [];

  if (!password || password.length < 8) {
    errors.push('Mínimo 8 caracteres');
  }
  if (password && !/[A-Z]/.test(password)) {
    errors.push('Al menos una mayúscula');
  }
  if (password && !/[0-9]/.test(password)) {
    errors.push('Al menos un número');
  }
  if (password && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Al menos un carácter especial');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getPasswordRequirements(): string[] {
  return [
    'Mínimo 8 caracteres',
    'Al menos una letra mayúscula',
    'Al menos un número',
    'Al menos un carácter especial',
  ];
}
