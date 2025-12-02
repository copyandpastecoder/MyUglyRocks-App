import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { AuthResult, LoginRequest, RegisterRequest, ForgotPasswordRequest, ResetPasswordRequest } from '@/types/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

// Request interceptor to add auth header
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
let isRefreshing = false;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Don't retry refresh requests or if already retrying
    const isRefreshRequest = originalRequest.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshRequest && !isRefreshing) {
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await api.post<AuthResult>('/auth/refresh');
        if (response.data.success && response.data.accessToken) {
          setAccessToken(response.data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
          isRefreshing = false;
          return api(originalRequest);
        }
      } catch {
        setAccessToken(null);
        isRefreshing = false;
        // Only redirect if not already on login/register/public pages
        if (typeof window !== 'undefined' && !window.location.pathname.match(/^\/(login|register|forgot-password|reset-password|gallery|learn)?$/)) {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// Auth API functions
export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResult> => {
    const response = await api.post<AuthResult>('/auth/register', data);
    if (response.data.success && response.data.accessToken) {
      setAccessToken(response.data.accessToken);
    }
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthResult> => {
    const response = await api.post<AuthResult>('/auth/login', data);
    if (response.data.success && response.data.accessToken) {
      setAccessToken(response.data.accessToken);
    }
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
    }
  },

  refresh: async (): Promise<AuthResult> => {
    const response = await api.post<AuthResult>('/auth/refresh');
    if (response.data.success && response.data.accessToken) {
      setAccessToken(response.data.accessToken);
    }
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordRequest): Promise<void> => {
    await api.post('/auth/forgot-password', data);
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<void> => {
    await api.post('/auth/reset-password', data);
  },

  verifyEmail: async (token: string): Promise<void> => {
    await api.post('/auth/verify-email', { token });
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Tumbler API functions
import type { TumblerDto, TumblerListDto, CreateTumblerRequest, UpdateTumblerRequest, BarrelDto, CreateBarrelRequest, UpdateBarrelRequest, TumblerModelDto } from '@/types/tumbler';

export const tumblerApi = {
  getAll: async (): Promise<TumblerListDto[]> => {
    const response = await api.get<TumblerListDto[]>('/tumblers');
    return response.data;
  },

  getById: async (id: string): Promise<TumblerDto> => {
    const response = await api.get<TumblerDto>(`/tumblers/${id}`);
    return response.data;
  },

  getAllWithBarrels: async (): Promise<TumblerDto[]> => {
    // First get the list, then fetch full details for each
    const listResponse = await api.get<TumblerListDto[]>('/tumblers');
    const fullTumblers = await Promise.all(
      listResponse.data.map(t => api.get<TumblerDto>(`/tumblers/${t.id}`))
    );
    return fullTumblers.map(r => r.data);
  },

  create: async (data: CreateTumblerRequest): Promise<TumblerDto> => {
    const response = await api.post<TumblerDto>('/tumblers', data);
    return response.data;
  },

  update: async (id: string, data: UpdateTumblerRequest): Promise<TumblerDto> => {
    const response = await api.put<TumblerDto>(`/tumblers/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tumblers/${id}`);
  },

  getModels: async (): Promise<TumblerModelDto[]> => {
    const response = await api.get<TumblerModelDto[]>('/tumblers/models');
    return response.data;
  },

  addBarrel: async (tumblerId: string, data: CreateBarrelRequest): Promise<BarrelDto> => {
    const response = await api.post<BarrelDto>(`/tumblers/${tumblerId}/barrels`, data);
    return response.data;
  },

  updateBarrel: async (barrelId: string, data: UpdateBarrelRequest): Promise<BarrelDto> => {
    const response = await api.put<BarrelDto>(`/tumblers/barrels/${barrelId}`, data);
    return response.data;
  },

  deleteBarrel: async (barrelId: string): Promise<void> => {
    await api.delete(`/tumblers/barrels/${barrelId}`);
  },
};

// Cycle API functions
import type { CycleDto, CycleListDto, CreateCycleRequest, UpdateCycleRequest, CompleteCycleRequest, StageRunDto, CreateStageRunRequest } from '@/types/cycle';

export const cycleApi = {
  getAll: async (status?: string): Promise<CycleListDto[]> => {
    const params = status ? { status } : {};
    const response = await api.get<CycleListDto[]>('/cycles', { params });
    return response.data;
  },

  getById: async (id: string): Promise<CycleDto> => {
    const response = await api.get<CycleDto>(`/cycles/${id}`);
    return response.data;
  },

  create: async (data: CreateCycleRequest): Promise<CycleDto> => {
    const response = await api.post<CycleDto>('/cycles', data);
    return response.data;
  },

  update: async (id: string, data: UpdateCycleRequest): Promise<CycleDto> => {
    const response = await api.put<CycleDto>(`/cycles/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/cycles/${id}`);
  },

  complete: async (id: string, data: CompleteCycleRequest): Promise<CycleDto> => {
    const response = await api.post<CycleDto>(`/cycles/${id}/complete`, data);
    return response.data;
  },

  archive: async (id: string): Promise<CycleDto> => {
    const response = await api.post<CycleDto>(`/cycles/${id}/archive`);
    return response.data;
  },

  // Stage Run operations
  getStageRun: async (id: string): Promise<StageRunDto> => {
    const response = await api.get<StageRunDto>(`/cycles/stages/${id}`);
    return response.data;
  },

  addStageRun: async (cycleId: string, data: CreateStageRunRequest): Promise<StageRunDto> => {
    const response = await api.post<StageRunDto>(`/cycles/${cycleId}/stages`, data);
    return response.data;
  },

  completeStageRun: async (id: string, data: object): Promise<StageRunDto> => {
    const response = await api.post<StageRunDto>(`/cycles/stages/${id}/complete`, data);
    return response.data;
  },

  deleteStageRun: async (id: string): Promise<void> => {
    await api.delete(`/cycles/stages/${id}`);
  },
};

// Reference Data API functions (public endpoints)
import type {
  SpecimenListDto,
  SpecimenDetailDto,
  SpecimenSearchRequest,
  MaterialListDto,
  MaterialDetailDto,
  MaterialSearchRequest,
} from '@/types/reference';

export const specimenApi = {
  getAll: async (search?: SpecimenSearchRequest): Promise<SpecimenListDto[]> => {
    const response = await api.get<SpecimenListDto[]>('/specimens', { params: search });
    return response.data;
  },

  getById: async (id: string): Promise<SpecimenDetailDto> => {
    const response = await api.get<SpecimenDetailDto>(`/specimens/${id}`);
    return response.data;
  },
};

export const materialApi = {
  getAll: async (search?: MaterialSearchRequest): Promise<MaterialListDto[]> => {
    const response = await api.get<MaterialListDto[]>('/materials', { params: search });
    return response.data;
  },

  getById: async (id: string): Promise<MaterialDetailDto> => {
    const response = await api.get<MaterialDetailDto>(`/materials/${id}`);
    return response.data;
  },
};

// Post API functions (Gallery/Social)
import type {
  PostDto,
  PostListDto,
  CreatePostRequest,
  UpdatePostRequest,
  VoteDto,
  VoteCountDto,
  CommentDto,
  CreateCommentRequest,
  UpdateCommentRequest,
  ReportCommentRequest,
} from '@/types/post';

export const postApi = {
  // Posts
  getAll: async (sort?: string, skip = 0, take = 20): Promise<PostListDto[]> => {
    const response = await api.get<PostListDto[]>('/posts', { params: { sort, skip, take } });
    return response.data;
  },

  getById: async (id: string): Promise<PostDto> => {
    const response = await api.get<PostDto>(`/posts/${id}`);
    return response.data;
  },

  getUserPosts: async (username: string, skip = 0, take = 20): Promise<PostListDto[]> => {
    const response = await api.get<PostListDto[]>(`/posts/user/${username}`, { params: { skip, take } });
    return response.data;
  },

  create: async (data: CreatePostRequest): Promise<PostDto> => {
    const response = await api.post<PostDto>('/posts', data);
    return response.data;
  },

  update: async (id: string, data: UpdatePostRequest): Promise<PostDto> => {
    const response = await api.put<PostDto>(`/posts/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/posts/${id}`);
  },

  // Votes
  getVotes: async (postId: string): Promise<VoteCountDto> => {
    const response = await api.get<VoteCountDto>(`/posts/${postId}/votes`);
    return response.data;
  },

  addVote: async (postId: string): Promise<VoteDto> => {
    const response = await api.post<VoteDto>(`/posts/${postId}/vote`);
    return response.data;
  },

  removeVote: async (postId: string): Promise<void> => {
    await api.delete(`/posts/${postId}/vote`);
  },

  // Comments
  getComments: async (postId: string): Promise<CommentDto[]> => {
    const response = await api.get<CommentDto[]>(`/posts/${postId}/comments`);
    return response.data;
  },

  addComment: async (postId: string, data: CreateCommentRequest): Promise<CommentDto> => {
    const response = await api.post<CommentDto>(`/posts/${postId}/comments`, data);
    return response.data;
  },

  updateComment: async (commentId: string, data: UpdateCommentRequest): Promise<CommentDto> => {
    const response = await api.put<CommentDto>(`/posts/comments/${commentId}`, data);
    return response.data;
  },

  deleteComment: async (commentId: string): Promise<void> => {
    await api.delete(`/posts/comments/${commentId}`);
  },

  reportComment: async (commentId: string, data: ReportCommentRequest): Promise<void> => {
    await api.post(`/posts/comments/${commentId}/report`, data);
  },
};

// User API functions (Profile, Settings, Account)
import type {
  UserProfileDto,
  UpdateProfileRequest,
  ChangePasswordRequest,
  UserSettingsDto,
  UpdateSettingsRequest,
  DeactivateAccountRequest,
  UserStatsDto,
  ExportCyclesRequest,
  FullExportRequest,
} from '@/types/user';

export const userApi = {
  // Profile
  getProfile: async (): Promise<UserProfileDto> => {
    const response = await api.get<UserProfileDto>('/users/me');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfileDto> => {
    const response = await api.put<UserProfileDto>('/users/me/profile', data);
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ avatarUrl: string }>('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Settings
  getSettings: async (): Promise<UserSettingsDto> => {
    const response = await api.get<UserSettingsDto>('/users/me/settings');
    return response.data;
  },

  updateSettings: async (data: UpdateSettingsRequest): Promise<UserSettingsDto> => {
    const response = await api.put<UserSettingsDto>('/users/me/settings', data);
    return response.data;
  },

  // Account
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await api.put('/users/me/password', data);
  },

  deactivateAccount: async (data: DeactivateAccountRequest): Promise<void> => {
    await api.delete('/users/me', { data });
  },

  // Stats
  getStats: async (): Promise<UserStatsDto> => {
    const response = await api.get<UserStatsDto>('/users/me/stats');
    return response.data;
  },
};

// Export API functions
export const exportApi = {
  exportCycles: async (request?: ExportCyclesRequest): Promise<Blob> => {
    const response = await api.get('/export/cycles', {
      params: request,
      responseType: 'blob',
    });
    return response.data;
  },

  exportCycle: async (cycleId: string): Promise<Blob> => {
    const response = await api.get(`/export/cycles/${cycleId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportStages: async (request?: ExportCyclesRequest): Promise<Blob> => {
    const response = await api.get('/export/stages', {
      params: request,
      responseType: 'blob',
    });
    return response.data;
  },

  exportTumblers: async (): Promise<Blob> => {
    const response = await api.get('/export/tumblers', {
      responseType: 'blob',
    });
    return response.data;
  },

  exportPosts: async (): Promise<Blob> => {
    const response = await api.get('/export/posts', {
      responseType: 'blob',
    });
    return response.data;
  },

  exportFullData: async (request: FullExportRequest): Promise<Blob> => {
    const response = await api.post('/export/full', request, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// Admin API functions
import type {
  AdminStatsDto,
  CommentReportDto,
  CommentReportListDto,
  ResolveReportRequest,
  AdminUserDto,
  AdminUserListDto,
  ChangeUserRoleRequest,
  BanUserRequest,
  PaginatedResult,
  CreateSpecimenRequest,
  UpdateSpecimenRequest,
  CreateMaterialRequest,
  UpdateMaterialRequest,
} from '@/types/admin';

export const adminApi = {
  // Dashboard
  getStats: async (): Promise<AdminStatsDto> => {
    const response = await api.get<AdminStatsDto>('/admin/stats');
    return response.data;
  },

  // Reports
  getReports: async (
    status?: string,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResult<CommentReportListDto>> => {
    const response = await api.get<PaginatedResult<CommentReportListDto>>('/admin/reports', {
      params: { status, page, pageSize },
    });
    return response.data;
  },

  getReport: async (reportId: string): Promise<CommentReportDto> => {
    const response = await api.get<CommentReportDto>(`/admin/reports/${reportId}`);
    return response.data;
  },

  resolveReport: async (reportId: string, request: ResolveReportRequest): Promise<CommentReportDto> => {
    const response = await api.put<CommentReportDto>(`/admin/reports/${reportId}`, request);
    return response.data;
  },

  deleteComment: async (commentId: string): Promise<void> => {
    await api.delete(`/admin/comments/${commentId}`);
  },

  // Users
  getUsers: async (
    search?: string,
    role?: string,
    isActive?: boolean,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResult<AdminUserListDto>> => {
    const response = await api.get<PaginatedResult<AdminUserListDto>>('/admin/users', {
      params: { search, role, isActive, page, pageSize },
    });
    return response.data;
  },

  getUser: async (userId: string): Promise<AdminUserDto> => {
    const response = await api.get<AdminUserDto>(`/admin/users/${userId}`);
    return response.data;
  },

  changeUserRole: async (userId: string, request: ChangeUserRoleRequest): Promise<AdminUserDto> => {
    const response = await api.put<AdminUserDto>(`/admin/users/${userId}/role`, request);
    return response.data;
  },

  banUser: async (userId: string, request: BanUserRequest): Promise<void> => {
    await api.put(`/admin/users/${userId}/ban`, request);
  },

  unbanUser: async (userId: string): Promise<void> => {
    await api.put(`/admin/users/${userId}/unban`);
  },

  // Specimens
  getSpecimens: async (
    search?: string,
    materialType?: string,
    isActive?: boolean,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResult<SpecimenListDto>> => {
    const response = await api.get<PaginatedResult<SpecimenListDto>>('/admin/specimens', {
      params: { search, materialType, isActive, page, pageSize },
    });
    return response.data;
  },

  getSpecimen: async (id: string): Promise<SpecimenDetailDto> => {
    const response = await api.get<SpecimenDetailDto>(`/admin/specimens/${id}`);
    return response.data;
  },

  createSpecimen: async (request: CreateSpecimenRequest): Promise<SpecimenDetailDto> => {
    const response = await api.post<SpecimenDetailDto>('/admin/specimens', request);
    return response.data;
  },

  updateSpecimen: async (id: string, request: UpdateSpecimenRequest): Promise<SpecimenDetailDto> => {
    const response = await api.put<SpecimenDetailDto>(`/admin/specimens/${id}`, request);
    return response.data;
  },

  deleteSpecimen: async (id: string): Promise<void> => {
    await api.delete(`/admin/specimens/${id}`);
  },

  // Materials
  getMaterials: async (
    search?: string,
    category?: string,
    isActive?: boolean,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResult<MaterialListDto>> => {
    const response = await api.get<PaginatedResult<MaterialListDto>>('/admin/materials', {
      params: { search, category, isActive, page, pageSize },
    });
    return response.data;
  },

  getMaterial: async (id: string): Promise<MaterialDetailDto> => {
    const response = await api.get<MaterialDetailDto>(`/admin/materials/${id}`);
    return response.data;
  },

  createMaterial: async (request: CreateMaterialRequest): Promise<MaterialDetailDto> => {
    const response = await api.post<MaterialDetailDto>('/admin/materials', request);
    return response.data;
  },

  updateMaterial: async (id: string, request: UpdateMaterialRequest): Promise<MaterialDetailDto> => {
    const response = await api.put<MaterialDetailDto>(`/admin/materials/${id}`, request);
    return response.data;
  },

  deleteMaterial: async (id: string): Promise<void> => {
    await api.delete(`/admin/materials/${id}`);
  },
};
