// Comment Report types
export interface CommentReportDto {
  commentReportId: string;
  commentId: string;
  commentContent: string;
  commentAuthorUsername: string;
  postId: string;
  postTitle: string;
  reportedByUsername: string;
  reason: string;
  details: string | null;
  status: string;
  resolvedByUsername: string | null;
  resolvedDate: string | null;
  resolutionNotes: string | null;
  dateCreated: string;
}

export interface CommentReportListDto {
  commentReportId: string;
  commentExcerpt: string;
  commentAuthorUsername: string;
  reportedByUsername: string;
  reason: string;
  status: string;
  dateCreated: string;
}

export interface ResolveReportRequest {
  status: string;
  resolutionNotes?: string;
  deleteComment?: boolean;
}

// User Management types
export interface AdminUserDto {
  userId: string;
  username: string;
  email: string;
  displayName: string | null;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  dateCreated: string;
  dateLastLogin: string | null;
  totalCycles: number;
  totalPosts: number;
  totalComments: number;
}

export interface AdminUserListDto {
  userId: string;
  username: string;
  email: string;
  displayName: string | null;
  role: string;
  isActive: boolean;
  dateCreated: string;
  dateLastLogin: string | null;
}

export interface ChangeUserRoleRequest {
  role: string;
}

export interface BanUserRequest {
  reason?: string;
  deleteContent?: boolean;
}

// Admin Statistics
export interface AdminStatsDto {
  totalUsers: number;
  activeUsers: number;
  totalCycles: number;
  totalPosts: number;
  totalComments: number;
  pendingReports: number;
  usersRegisteredToday: number;
  postsCreatedToday: number;
}

// Paginated response
export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Re-export shared types from reference to avoid duplicates
export type {
  SpecimenDetailDto,
  SpecimenListDto,
  MaterialDetailDto,
  MaterialListDto,
} from './reference';

// Specimen Management request types
export interface CreateSpecimenRequest {
  commonName: string;
  scientificName?: string;
  alias?: string;
  rockFamily?: string;
  species?: string;
  variety?: string;
  materialType?: string;
  mohsHardnessMin?: number;
  mohsHardnessMax?: number;
  tumblingDifficulty?: string;
  recommendedGritSequence?: string;
  specialConsiderations?: string;
  notes?: string;
}

export interface UpdateSpecimenRequest extends CreateSpecimenRequest {
  isActive?: boolean;
}

// Material Management request types
export interface CreateMaterialRequest {
  commonName: string;
  category?: string;
  materialType?: string;
  materialSize?: string;
  usageType?: string;
  meshSize?: number;
  sortOrder?: number;
  isCleaning?: boolean;
  notes?: string;
}

export interface UpdateMaterialRequest extends CreateMaterialRequest {
  isActive?: boolean;
}

// Browser/Session Analytics types
export interface BrowserStatsDto {
  totalSessions: number;
  uniqueUsers: number;
  browserBreakdown: Record<string, number>;
  deviceTypeBreakdown: Record<string, number>;
  osBreakdown: Record<string, number>;
  webPSupportPercentage: number;
  avifSupportPercentage: number;
  usersOnOldBrowsers: number;
  countryBreakdown: Record<string, number>;
  timezoneBreakdown: Record<string, number>;
  avgSessionDurationMinutes: number;
  avgPageViewsPerSession: number;
  sessionTrend: SessionTrendDto[];
}

export interface SessionTrendDto {
  date: string;
  sessionCount: number;
  uniqueUsers: number;
}

// Database Backup types
export interface BackupInfo {
  r2Key: string;
  fileName: string;
  backupType: string;
  createdAt: string;
  size: number;
}

export interface CreateBackupResponse {
  success: boolean;
  sizeBytes?: number;
  errorMessage?: string;
  message?: string;
}

export interface TestFileResult {
  success: boolean;
  key?: string;
  /** File size in bytes (integer) */
  size: number;
  message?: string;
}
