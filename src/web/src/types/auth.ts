export type UserRole = 'Admin' | 'Moderator' | 'User';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  role: UserRole;
  dateCreated: string;
}

export interface AuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  user?: User;
  error?: string;
  sessionId?: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  // Optional analytics fields
  screenWidth?: number;
  screenHeight?: number;
  supportsWebP?: boolean;
  supportsAvif?: boolean;
  timezone?: string;
  language?: string;
  referrerDomain?: string | null;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}
