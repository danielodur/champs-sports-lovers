/**
 * Error Utils - Professional error message handling
 * Ensures users never see technical error codes or casual language
 */

export interface ErrorResponse {
  message: string;
  code?: string;
  shouldRetry?: boolean;
}

/**
 * Sanitizes error messages to ensure they are professional and user-friendly
 * Removes technical jargon and provides clear guidance
 */
export function sanitizeErrorMessage(error: any): string {
  if (!error) {
    return "An error occurred. Please try again.";
  }

  // Get the error message from various possible sources
  const errorMessage =
    error?.message ||
    error?.error?.message ||
    error?.data?.message ||
    error?.toString?.() ||
    "An error occurred";

  const lowerMessage = errorMessage.toLowerCase();

  // Network and connection errors
  if (
    lowerMessage.includes("authretryablefetcherror") ||
    lowerMessage.includes("network request failed") ||
    lowerMessage.includes("fetch failed") ||
    lowerMessage.includes("connection") ||
    lowerMessage.includes("timeout") ||
    lowerMessage.includes("network")
  ) {
    return "Network connection error. Please check your internet connection and try again.";
  }

  // Authentication errors - differentiate between wrong credentials and new user
  if (
    lowerMessage.includes("invalid login credentials") ||
    lowerMessage.includes("invalid email or password") ||
    lowerMessage.includes("authentication failed")
  ) {
    return "Invalid email or password. If you're new, please register first.";
  }

  // User not found - encourage new user registration
  if (
    lowerMessage.includes("user not found") ||
    lowerMessage.includes("email not found") ||
    lowerMessage.includes("no user found")
  ) {
    return "No account found with this email. Please register if you are new.";
  }

  // Email verification
  if (
    lowerMessage.includes("email not confirmed") ||
    lowerMessage.includes("email_not_confirmed") ||
    lowerMessage.includes("verify your email")
  ) {
    return "Please verify your email address. Check your inbox for a verification link.";
  }

  // Account already exists
  if (
    lowerMessage.includes("email already") ||
    lowerMessage.includes("user already registered") ||
    lowerMessage.includes("already exists")
  ) {
    return "An account with this email already exists. Please sign in instead.";
  }

  // Rate limiting
  if (
    lowerMessage.includes("rate limit") ||
    lowerMessage.includes("too many")
  ) {
    return "Too many attempts. Please wait a few minutes before trying again.";
  }

  // Password strength
  if (
    lowerMessage.includes("password") &&
    (lowerMessage.includes("weak") || lowerMessage.includes("short"))
  ) {
    return "Password must be at least 6 characters long.";
  }

  // OAuth specific errors
  if (lowerMessage.includes("google")) {
    return "Google sign-in failed. Please try again.";
  }

  if (lowerMessage.includes("facebook")) {
    return "Facebook sign-in failed. Please try again.";
  }

  // WhatsApp and SMS provider errors
  if (
    lowerMessage.includes("sms provider") ||
    lowerMessage.includes("whatsapp provider") ||
    lowerMessage.includes("provider not configured")
  ) {
    return "SMS/WhatsApp service is currently unavailable. Please try email sign-in instead.";
  }

  if (
    lowerMessage.includes("whatsapp channel") ||
    lowerMessage.includes("channel not supported")
  ) {
    return "WhatsApp authentication is not available. Please use email or phone SMS instead.";
  }

  if (
    lowerMessage.includes("invalid phone") ||
    lowerMessage.includes("phone format")
  ) {
    return "Please enter a valid phone number in international format (e.g., +1234567890).";
  }

  // Remove any technical error prefixes and codes
  let cleanMessage = errorMessage
    .replace(
      /^(Error:|AuthApiError:|AuthRetryableFetchError:|Auth\s+error:)/gi,
      "",
    )
    .replace(/\([0-9]+\)/g, "") // Remove error codes in parentheses
    .replace(/Error code:\s*\d+/gi, "")
    .replace(/Status:\s*\d+/gi, "")
    .replace(/NetworkError:/gi, "")
    .replace(/FetchError:/gi, "")
    .trim();

  // If message still contains technical terms, provide generic message
  const technicalTerms = [
    "authapi",
    "retryable",
    "fetch",
    "xhr",
    "http",
    "ssl",
    "tls",
    "api",
    "endpoint",
    "request",
    "response",
    "status",
    "code",
    "authretryablefetcherror",
    "networkerror",
    "fetcherror",
  ];

  const containsTechnicalTerms = technicalTerms.some((term) =>
    cleanMessage.toLowerCase().includes(term),
  );

  if (containsTechnicalTerms || cleanMessage.length < 5) {
    return "An error occurred. Please try again.";
  }

  // Ensure first letter is capitalized and ends with period
  cleanMessage = cleanMessage.charAt(0).toUpperCase() + cleanMessage.slice(1);
  if (!cleanMessage.endsWith(".")) {
    cleanMessage += ".";
  }

  return cleanMessage;
}

/**
 * Determines if an error is retryable based on its type
 */
export function isRetryableError(error: any): boolean {
  if (!error) return false;

  const message = (error?.message || "").toLowerCase();

  return (
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("connection") ||
    message.includes("fetch") ||
    message.includes("retryable")
  );
}

/**
 * Gets user-friendly error response with retry information
 */
export function getErrorResponse(error: any): ErrorResponse {
  const message = sanitizeErrorMessage(error);
  const shouldRetry = isRetryableError(error);
  const code = error?.code || error?.status || undefined;

  return {
    message,
    code: typeof code === "string" ? code : undefined,
    shouldRetry,
  };
}

/**
 * Common authentication error messages
 */
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS:
    "Invalid email or password. If you're new, please register first.",
  USER_NOT_FOUND:
    "No account found with this email. Please register if you are new.",
  EMAIL_NOT_VERIFIED:
    "Please verify your email address. Check your inbox for a verification link.",
  ACCOUNT_EXISTS:
    "An account with this email already exists. Please sign in instead.",
  NETWORK_ERROR:
    "Network connection error. Please check your internet connection and try again.",
  WEAK_PASSWORD: "Password must be at least 6 characters long.",
  RATE_LIMITED:
    "Too many attempts. Please wait a few minutes before trying again.",
  TERMS_NOT_AGREED: "Please agree to the terms and conditions to continue.",
  FIELDS_REQUIRED: "Please fill in all required fields.",
  INVALID_EMAIL: "Please enter a valid email address.",
  GENERIC_ERROR: "An error occurred. Please try again.",
} as const;

/**
 * Validation error messages
 */
export const VALIDATION_ERRORS = {
  EMAIL_REQUIRED: "Email address is required.",
  EMAIL_INVALID: "Please enter a valid email address.",
  PASSWORD_REQUIRED: "Password is required.",
  PASSWORD_TOO_SHORT: "Password must be at least 6 characters long.",
  TERMS_REQUIRED: "Please agree to the terms and conditions to continue.",
} as const;
