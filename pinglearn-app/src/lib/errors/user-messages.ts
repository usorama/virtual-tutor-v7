/**
 * User-Friendly Error Messages
 * ERR-008: Enhanced age-appropriate error messages for students (ages 10-16)
 *
 * This module provides enhanced, encouraging, actionable error messages
 * that help young learners understand what happened and how to fix it.
 */

import { ErrorCode } from './error-types';

/**
 * Icon types for visual error display
 */
export type MessageIcon =
  | 'alert-circle'
  | 'wifi-off'
  | 'lock'
  | 'file-x'
  | 'clock'
  | 'info'
  | 'shield-alert';

/**
 * Enhanced error message structure
 */
export interface EnhancedErrorMessage {
  /** Short, friendly heading */
  readonly title: string;
  /** Main explanation (what happened + why) */
  readonly message: string;
  /** Clear action guidance (what to do) */
  readonly action: string;
  /** Visual icon type */
  readonly icon: MessageIcon;
  /** Severity level */
  readonly severity: 'info' | 'warning' | 'error' | 'critical';
}

/**
 * Context for personalizing error messages
 */
export interface MessageContext {
  /** User's name for personalization */
  readonly userName?: string;
  /** Current retry attempt number */
  readonly attemptCount?: number;
  /** Specific resource name involved */
  readonly resourceName?: string;
  /** Maximum retry attempts allowed */
  readonly maxRetries?: number;
  /** Seconds to wait before retry */
  readonly retryAfter?: number;
}

/**
 * Age-appropriate error messages for all error codes
 * Structure: title + message (what+why) + action (how)
 * Tone: Friendly, encouraging, educational
 */
const ERROR_MESSAGE_TEMPLATES: Record<ErrorCode, EnhancedErrorMessage> = {
  // ===== NETWORK ERRORS =====
  [ErrorCode.NETWORK_ERROR]: {
    title: 'Connection Lost',
    message:
      "Oops! We lost connection to the internet. This happens sometimes when your WiFi is unstable or you're in a low-signal area.",
    action: "Check your internet connection and tap 'Try Again' when you're back online!",
    icon: 'wifi-off',
    severity: 'warning',
  },

  [ErrorCode.API_TIMEOUT]: {
    title: 'Taking Too Long',
    message:
      "Hmm, things are taking longer than usual to load. This might be because the internet is slow right now or we're handling lots of requests.",
    action:
      "Wait a moment and try again. If it keeps happening, check your internet speed!",
    icon: 'clock',
    severity: 'warning',
  },

  [ErrorCode.DATABASE_CONNECTION_ERROR]: {
    title: 'Connection Issue',
    message:
      "We're having trouble connecting to our database right now. This is temporary and not your fault!",
    action:
      "Give it a minute and try refreshing the page. We're working to fix it!",
    icon: 'wifi-off',
    severity: 'error',
  },

  [ErrorCode.EXTERNAL_SERVICE_ERROR]: {
    title: 'Service Temporarily Down',
    message:
      "One of the services we use isn't responding right now. These things happen sometimes with internet services!",
    action:
      "Try again in a few minutes. If it still doesn't work, let us know!",
    icon: 'alert-circle',
    severity: 'warning',
  },

  [ErrorCode.SERVICE_UNAVAILABLE]: {
    title: 'Taking a Break',
    message:
      "Our service is temporarily unavailable, probably because we're doing maintenance or there's too much traffic right now.",
    action:
      "Please wait a few minutes and try again. We'll be back up soon!",
    icon: 'alert-circle',
    severity: 'error',
  },

  // ===== AUTHENTICATION ERRORS =====
  [ErrorCode.AUTHENTICATION_ERROR]: {
    title: 'Sign In Required',
    message:
      "We need to know who you are to continue. Don't worry, this just means you need to sign in!",
    action: "Click the 'Sign In' button to access your account.",
    icon: 'lock',
    severity: 'info',
  },

  [ErrorCode.INVALID_CREDENTIALS]: {
    title: 'Incorrect Login',
    message:
      "The email or password you entered doesn't match our records. This happens to everyone sometimes!",
    action:
      "Double-check your email and password, or use 'Forgot Password' if you can't remember.",
    icon: 'lock',
    severity: 'warning',
  },

  [ErrorCode.SESSION_EXPIRED]: {
    title: 'Session Timed Out',
    message:
      "You've been away for a while, so we logged you out to keep your account safe. This is normal!",
    action: "Just sign in again to continue learning where you left off!",
    icon: 'lock',
    severity: 'info',
  },

  [ErrorCode.AUTHORIZATION_ERROR]: {
    title: "Can't Access This",
    message:
      "You don't have permission to access this content. It might be restricted to certain users or age groups.",
    action:
      "Go back to your dashboard or contact us if you think this is a mistake.",
    icon: 'shield-alert',
    severity: 'warning',
  },

  // ===== VALIDATION ERRORS =====
  [ErrorCode.VALIDATION_ERROR]: {
    title: 'Something Needs Fixing',
    message:
      "We found some issues with what you entered. Don't worry, we'll help you fix them!",
    action:
      "Check the highlighted fields and make sure everything is filled in correctly.",
    icon: 'alert-circle',
    severity: 'warning',
  },

  [ErrorCode.INVALID_INPUT]: {
    title: 'Invalid Information',
    message:
      "The information you entered isn't in the right format. For example, an email should look like 'name@example.com'.",
    action: "Review your input and make sure it matches the format we're asking for.",
    icon: 'alert-circle',
    severity: 'warning',
  },

  [ErrorCode.MISSING_REQUIRED_FIELD]: {
    title: 'Missing Information',
    message:
      "Some required fields are empty. We need all this information to continue.",
    action: "Please fill in the highlighted fields - they all need something!",
    icon: 'alert-circle',
    severity: 'warning',
  },

  // ===== FILE ERRORS =====
  [ErrorCode.FILE_TOO_LARGE]: {
    title: 'File Too Big',
    message:
      "The file you selected is too large. We can only handle files up to 10MB to keep things running smoothly.",
    action:
      "Try choosing a smaller file or compressing this one before uploading.",
    icon: 'file-x',
    severity: 'warning',
  },

  [ErrorCode.INVALID_FILE_TYPE]: {
    title: 'Wrong File Type',
    message:
      "This file type isn't supported. We only accept certain types of files to keep everything secure.",
    action:
      "Check which file types are allowed and try uploading a different file.",
    icon: 'file-x',
    severity: 'warning',
  },

  [ErrorCode.FILE_UPLOAD_FAILED]: {
    title: 'Upload Failed',
    message:
      "We couldn't upload your file. This might be because of a connection problem or the file got corrupted.",
    action:
      "Check your internet connection and try uploading the file again.",
    icon: 'file-x',
    severity: 'error',
  },

  [ErrorCode.FILE_PROCESSING_ERROR]: {
    title: "Can't Process File",
    message:
      "We had trouble processing your file. It might be damaged or in an unexpected format.",
    action:
      "Try opening the file on your computer first to make sure it works, then upload it again.",
    icon: 'file-x',
    severity: 'error',
  },

  // ===== RESOURCE ERRORS =====
  [ErrorCode.NOT_FOUND]: {
    title: "Can't Find That",
    message:
      "We couldn't find what you're looking for. It might have been moved, deleted, or the link could be broken.",
    action:
      "Try going back to the previous page or searching for what you need.",
    icon: 'alert-circle',
    severity: 'info',
  },

  [ErrorCode.RESOURCE_CONFLICT]: {
    title: 'Conflict Detected',
    message:
      "What you're trying to do conflicts with something that already exists. For example, you might be trying to create something that's already there.",
    action:
      "Check your existing content or try a different name/approach.",
    icon: 'alert-circle',
    severity: 'warning',
  },

  [ErrorCode.RESOURCE_ALREADY_EXISTS]: {
    title: 'Already Exists',
    message:
      "This already exists! You might be trying to create something that you've already made before.",
    action:
      "Try using a different name or find the existing one to update it instead.",
    icon: 'alert-circle',
    severity: 'info',
  },

  // ===== RATE/QUOTA ERRORS =====
  [ErrorCode.RATE_LIMIT_EXCEEDED]: {
    title: 'Slow Down a Bit!',
    message:
      "You're clicking too fast! We need a moment to catch up. This helps keep the service running smoothly for everyone.",
    action:
      "Wait ${retryAfter} seconds before trying again. Take a quick break!",
    icon: 'clock',
    severity: 'warning',
  },

  [ErrorCode.QUOTA_EXCEEDED]: {
    title: 'Usage Limit Reached',
    message:
      "You've reached your usage limit for today. Everyone gets a daily limit to keep things fair for all users.",
    action:
      "Come back tomorrow to continue, or upgrade your account for higher limits!",
    icon: 'alert-circle',
    severity: 'warning',
  },

  // ===== SYSTEM ERRORS =====
  [ErrorCode.DATABASE_ERROR]: {
    title: 'Data Problem',
    message:
      "We ran into an issue with our database. This is a technical problem on our end, not something you did!",
    action:
      "Try refreshing the page. If that doesn't help, wait a few minutes and try again.",
    icon: 'alert-circle',
    severity: 'error',
  },

  [ErrorCode.DATA_INTEGRITY_ERROR]: {
    title: 'Data Validation Failed',
    message:
      "Something about the data doesn't look right to our system. This could be because of conflicting information.",
    action:
      "Check what you entered and make sure everything makes sense together.",
    icon: 'alert-circle',
    severity: 'error',
  },

  [ErrorCode.INTERNAL_SERVER_ERROR]: {
    title: 'Something Went Wrong',
    message:
      "We ran into an unexpected technical problem on our end. Don't worry, it's not your fault and we're working to fix it!",
    action:
      "Try refreshing the page. If this keeps happening, please let us know so we can investigate!",
    icon: 'alert-circle',
    severity: 'error',
  },

  [ErrorCode.UNKNOWN_ERROR]: {
    title: 'Unexpected Issue',
    message:
      "Something unexpected happened that we didn't plan for. These mystery issues are the hardest to predict!",
    action:
      "Try refreshing the page or going back. If it happens again, please report it with details about what you were doing!",
    icon: 'alert-circle',
    severity: 'error',
  },
};

/**
 * Get enhanced, age-appropriate error message for any error code
 *
 * @param code - The error code to get message for
 * @param context - Optional context for personalization
 * @returns Enhanced error message with title, message, action, icon, and severity
 *
 * @example
 * ```typescript
 * const message = getEnhancedUserMessage(
 *   ErrorCode.NETWORK_ERROR,
 *   { userName: 'Alex', attemptCount: 2 }
 * );
 * console.log(message.title); // "Connection Lost"
 * console.log(message.message); // "Hey Alex! We lost connection..."
 * ```
 */
export function getEnhancedUserMessage(
  code: ErrorCode,
  context?: MessageContext
): EnhancedErrorMessage {
  const baseMessage = ERROR_MESSAGE_TEMPLATES[code];

  if (!baseMessage) {
    // Fallback for any missing error code
    return ERROR_MESSAGE_TEMPLATES[ErrorCode.UNKNOWN_ERROR];
  }

  // Create a mutable copy for personalization
  let personalizedMessage = { ...baseMessage };

  // Apply personalization if context provided
  if (context) {
    personalizedMessage = personalizeMessage(personalizedMessage, context);
  }

  return personalizedMessage;
}

/**
 * Personalize error message based on context
 */
function personalizeMessage(
  message: EnhancedErrorMessage,
  context: MessageContext
): EnhancedErrorMessage {
  let personalizedMessage = message.message;
  let personalizedAction = message.action;

  // Add user name for friendlier tone
  if (context.userName) {
    personalizedMessage = `Hey ${context.userName}! ${personalizedMessage}`;
  }

  // Add retry attempt information
  if (context.attemptCount && context.attemptCount > 1) {
    personalizedMessage += ` This is attempt ${context.attemptCount}.`;
  }

  // Interpolate variables in action message
  personalizedAction = interpolateVariables(personalizedAction, context);

  return {
    ...message,
    message: personalizedMessage,
    action: personalizedAction,
  };
}

/**
 * Interpolate variables in message templates
 */
function interpolateVariables(
  template: string,
  context: MessageContext
): string {
  let result = template;

  // Replace ${retryAfter} with actual seconds
  if (context.retryAfter !== undefined) {
    result = result.replace('${retryAfter}', String(context.retryAfter));
  }

  // Replace ${maxRetries} with actual number
  if (context.maxRetries !== undefined) {
    result = result.replace('${maxRetries}', String(context.maxRetries));
  }

  // Replace ${resourceName} with actual resource
  if (context.resourceName) {
    result = result.replace('${resourceName}', context.resourceName);
  }

  return result;
}

/**
 * Get all available error codes with messages
 * Useful for documentation and testing
 */
export function getAllErrorMessages(): Array<{
  code: ErrorCode;
  message: EnhancedErrorMessage;
}> {
  return Object.values(ErrorCode).map((code) => ({
    code,
    message: ERROR_MESSAGE_TEMPLATES[code],
  }));
}

/**
 * Check if an error code has an enhanced message
 */
export function hasEnhancedMessage(code: ErrorCode): boolean {
  return code in ERROR_MESSAGE_TEMPLATES;
}

/**
 * Validate that all error codes have messages
 * Used for testing and quality assurance
 */
export function validateMessageCoverage(): {
  complete: boolean;
  missing: ErrorCode[];
} {
  const allCodes = Object.values(ErrorCode);
  const missing = allCodes.filter((code) => !hasEnhancedMessage(code));

  return {
    complete: missing.length === 0,
    missing,
  };
}