// User profile types
export interface UserProfileDto {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  dateCreated: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// User settings types
export interface UserSettingsDto {
  measurementSystem: string;
  dateFormat: string;
  timeFormat: string;
  timezone: string;
  firstDayOfWeek: string;
  showRelativeTimes: boolean;
  fontSize: string;
  density: string;
  defaultHomeSection: string;
  notifyStageReminders: boolean;
  notifyComments: boolean;
  notifyReplies: boolean;
  notifyUglyRocks: boolean;
  notifyRecipeCloned: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  digestFrequency: string;
  photoUploadQuality: string;
  addWatermark: boolean;
  autoFillFromLastRun: boolean;
  defaultPostVisibility: string;
  theme: string;
}

export interface UpdateSettingsRequest {
  measurementSystem?: string;
  dateFormat?: string;
  timeFormat?: string;
  timezone?: string;
  firstDayOfWeek?: string;
  showRelativeTimes?: boolean;
  fontSize?: string;
  density?: string;
  defaultHomeSection?: string;
  notifyStageReminders?: boolean;
  notifyComments?: boolean;
  notifyReplies?: boolean;
  notifyUglyRocks?: boolean;
  notifyRecipeCloned?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  digestFrequency?: string;
  photoUploadQuality?: string;
  addWatermark?: boolean;
  autoFillFromLastRun?: boolean;
  defaultPostVisibility?: string;
  theme?: string;
}

// Account types
export interface DeactivateAccountRequest {
  password: string;
  reason?: string;
}

// Stats types
export interface UserStatsDto {
  totalCycles: number;
  completedCycles: number;
  totalPosts: number;
  totalVotesReceived: number;
  totalCommentsReceived: number;
  memberSince: string;
}

// Export types
export interface ExportCyclesRequest {
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface FullExportRequest {
  password: string;
}
