export const AUTH_CONSTANTS = {
  // Session settings
  SESSION_EXPIRY: 60 * 60 * 24 * 7, // 7 days in seconds
  REFRESH_THRESHOLD: 60 * 5, // Refresh if less than 5 minutes left
  
  // Rate limiting
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 60 * 60, // 1 hour in seconds
  
  // Cookie settings
  AUTH_COOKIE_NAME: 'vt-auth-token',
  REFRESH_COOKIE_NAME: 'vt-refresh-token',
  
  // Redirect paths
  LOGIN_REDIRECT: '/dashboard',
  LOGOUT_REDIRECT: '/',
  AUTH_CALLBACK: '/auth/confirm',
  
  // Error messages
  ERRORS: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    EMAIL_NOT_CONFIRMED: 'Please confirm your email address',
    ACCOUNT_LOCKED: 'Account temporarily locked due to multiple failed attempts',
    SESSION_EXPIRED: 'Your session has expired. Please login again',
    NETWORK_ERROR: 'Network error. Please try again',
    GENERIC_ERROR: 'An error occurred. Please try again',
    UNAUTHORIZED: 'You must be logged in to access this page',
    EMAIL_ALREADY_EXISTS: 'An account with this email already exists',
    WEAK_PASSWORD: 'Password is too weak',
    INVALID_TOKEN: 'Invalid or expired token',
    // SEC-005: Enhanced token validation error messages
    TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
    TOKEN_INVALID: 'Invalid authentication token.',
    RATE_LIMIT_EXCEEDED: 'Too many attempts. Please try again later.',
  },
  
  // Success messages
  SUCCESS: {
    REGISTER: 'Registration successful! Please check your email to confirm your account',
    LOGIN: 'Login successful!',
    LOGOUT: 'Logged out successfully',
    PASSWORD_RESET_SENT: 'Password reset instructions sent to your email',
    PASSWORD_RESET_SUCCESS: 'Password reset successful!',
    EMAIL_CONFIRMED: 'Email confirmed successfully!',
    PROFILE_UPDATED: 'Profile updated successfully',
  }
} as const