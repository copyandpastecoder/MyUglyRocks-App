export type UserRole = 'Admin' | 'Moderator' | 'User';

export interface User {
  userId: string;
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

// Invitation code types
export interface RegisterWithInvitationCodeRequest {
  email: string;
  username: string;
  password: string;
  displayName?: string;
  invitationCode: string;
}

export interface ValidateInvitationCodeRequest {
  code: string;
}

export interface InvitationCodeValidationResult {
  isValid: boolean;
  error?: string;
  invitationCodeId?: string;
}

export interface InvitationCodeDto {
  invitationCodeId: string;
  code: string;
  dateCreated: string;
  dateUsed?: string;
  usedByUserId?: string;
  usedByUsername?: string;
  dateExpires?: string;
  isRevoked: boolean;
  dateRevoked?: string;
  description?: string;
  status: 'Unused' | 'Used' | 'Expired' | 'Revoked';
}

export interface CreateInvitationCodeRequest {
  quantity: number;
  description?: string;
  expiresAt?: string;
}

export interface PaginatedInvitationCodesResponse {
  codes: InvitationCodeDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RevokeInvitationCodeRequest {
  reason: string;
}

export interface InvitationStatsDto {
  totalCodesGenerated: number;
  codesUsed: number;
  codesExpired: number;
  codesRevoked: number;
  codesAvailable: number;
}
