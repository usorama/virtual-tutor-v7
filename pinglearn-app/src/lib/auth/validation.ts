export const AUTH_VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 100,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export function validateEmail(email: string): string | null {
  if (!email || email.trim() === '') {
    return 'Email is required'
  }
  
  if (!AUTH_VALIDATION.EMAIL_REGEX.test(email)) {
    return 'Please enter a valid email address'
  }
  
  return null
}

export function validatePassword(password: string): string | null {
  if (!password || password.trim() === '') {
    return 'Password is required'
  }
  
  if (password.length < AUTH_VALIDATION.PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${AUTH_VALIDATION.PASSWORD_MIN_LENGTH} characters`
  }
  
  if (password.length > AUTH_VALIDATION.PASSWORD_MAX_LENGTH) {
    return `Password must be less than ${AUTH_VALIDATION.PASSWORD_MAX_LENGTH} characters`
  }
  
  return null
}

export function validatePasswordMatch(password: string, confirmPassword: string): string | null {
  if (password !== confirmPassword) {
    return 'Passwords do not match'
  }
  
  return null
}

export function validateLoginForm(email: string, password: string): ValidationResult {
  const errors: Record<string, string> = {}
  
  const emailError = validateEmail(email)
  if (emailError) errors.email = emailError
  
  const passwordError = validatePassword(password)
  if (passwordError) errors.password = passwordError
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export function validateRegisterForm(
  email: string, 
  password: string, 
  confirmPassword: string
): ValidationResult {
  const errors: Record<string, string> = {}
  
  const emailError = validateEmail(email)
  if (emailError) errors.email = emailError
  
  const passwordError = validatePassword(password)
  if (passwordError) errors.password = passwordError
  
  const matchError = validatePasswordMatch(password, confirmPassword)
  if (matchError) errors.confirmPassword = matchError
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export function validateResetPasswordForm(email: string): ValidationResult {
  const errors: Record<string, string> = {}
  
  const emailError = validateEmail(email)
  if (emailError) errors.email = emailError
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export function validateUpdatePasswordForm(
  password: string, 
  confirmPassword: string
): ValidationResult {
  const errors: Record<string, string> = {}
  
  const passwordError = validatePassword(password)
  if (passwordError) errors.password = passwordError
  
  const matchError = validatePasswordMatch(password, confirmPassword)
  if (matchError) errors.confirmPassword = matchError
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}