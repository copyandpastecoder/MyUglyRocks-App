/**
 * Query Key Factory
 * Centralized query key management for React Query cache invalidation
 */

export const queryKeys = {
  // Auth/User
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },

  // User Profile & Settings
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    settings: () => [...queryKeys.user.all, 'settings'] as const,
    stats: () => [...queryKeys.user.all, 'stats'] as const,
  },

  // Tumblers
  tumblers: {
    all: ['tumblers'] as const,
    lists: () => [...queryKeys.tumblers.all, 'list'] as const,
    list: () => [...queryKeys.tumblers.lists()] as const,
    details: () => [...queryKeys.tumblers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tumblers.details(), id] as const,
    models: () => [...queryKeys.tumblers.all, 'models'] as const,
  },

  // Cycles
  cycles: {
    all: ['cycles'] as const,
    lists: () => [...queryKeys.cycles.all, 'list'] as const,
    list: (filters?: { status?: string; sortOrder?: 'asc' | 'desc' }) =>
      [...queryKeys.cycles.lists(), filters] as const,
    details: () => [...queryKeys.cycles.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.cycles.details(), id] as const,
    stageRun: (id: string) => [...queryKeys.cycles.all, 'stageRun', id] as const,
    statistics: () => [...queryKeys.cycles.all, 'statistics'] as const,
  },

  // Reference Data (long-lived cache)
  specimens: {
    all: ['specimens'] as const,
    lists: () => [...queryKeys.specimens.all, 'list'] as const,
    list: (filters?: { query?: string; materialType?: string; difficulty?: string }) =>
      [...queryKeys.specimens.lists(), filters] as const,
    details: () => [...queryKeys.specimens.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.specimens.details(), id] as const,
  },

  materials: {
    all: ['materials'] as const,
    lists: () => [...queryKeys.materials.all, 'list'] as const,
    list: (filters?: { query?: string; category?: string }) =>
      [...queryKeys.materials.lists(), filters] as const,
    details: () => [...queryKeys.materials.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.materials.details(), id] as const,
  },

  barrelNicknames: {
    all: ['barrelNicknames'] as const,
    list: () => [...queryKeys.barrelNicknames.all, 'list'] as const,
  },

  // Posts/Gallery (medium cache, matches backend Redis cache)
  posts: {
    all: ['posts'] as const,
    lists: () => [...queryKeys.posts.all, 'list'] as const,
    list: (sortBy?: string) => [...queryKeys.posts.lists(), { sortBy }] as const,
    userPosts: (username: string) =>
      [...queryKeys.posts.all, 'user', username] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.posts.details(), id] as const,
    votes: (postId: string) => [...queryKeys.posts.all, 'votes', postId] as const,
    comments: (postId: string) =>
      [...queryKeys.posts.all, 'comments', postId] as const,
  },

  // Inventory
  inventory: {
    all: ['inventory'] as const,
    lists: () => [...queryKeys.inventory.all, 'list'] as const,
    list: (filters?: {
      status?: string;
      sourceType?: string;
      specimenId?: string;
      favorites?: boolean;
      search?: string;
      sortBy?: string;
      sortOrder?: string;
    }) => [...queryKeys.inventory.lists(), filters] as const,
    details: () => [...queryKeys.inventory.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.inventory.details(), id] as const,
    stats: () => [...queryKeys.inventory.all, 'stats'] as const,
  },

  // Inventory Sources
  inventorySources: {
    all: ['inventorySources'] as const,
    lists: () => [...queryKeys.inventorySources.all, 'list'] as const,
    list: (filters?: {
      sourceType?: string;
      isActive?: boolean;
      search?: string;
      sortBy?: string;
      sortOrder?: string;
    }) => [...queryKeys.inventorySources.lists(), filters] as const,
    details: () => [...queryKeys.inventorySources.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.inventorySources.details(), id] as const,
  },

  // User Specimens (custom specimens)
  userSpecimens: {
    all: ['userSpecimens'] as const,
    lists: () => [...queryKeys.userSpecimens.all, 'list'] as const,
    list: (filters?: {
      search?: string;
      materialType?: string;
      sortBy?: string;
      sortOrder?: string;
    }) => [...queryKeys.userSpecimens.lists(), filters] as const,
    details: () => [...queryKeys.userSpecimens.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.userSpecimens.details(), id] as const,
    // Combined search for specimen picker (system + user + public)
    search: (search?: string, includePublic?: boolean) =>
      [...queryKeys.userSpecimens.all, 'search', { search, includePublic }] as const,
  },

  // Admin
  admin: {
    all: ['admin'] as const,
    stats: () => [...queryKeys.admin.all, 'stats'] as const,
    reports: (filters?: { status?: string; page?: number }) =>
      [...queryKeys.admin.all, 'reports', filters] as const,
    report: (id: string) => [...queryKeys.admin.all, 'report', id] as const,
    users: (filters?: {
      search?: string;
      role?: string;
      isActive?: boolean;
      page?: number;
    }) => [...queryKeys.admin.all, 'users', filters] as const,
    user: (id: string) => [...queryKeys.admin.all, 'user', id] as const,
    specimens: (filters?: {
      search?: string;
      materialType?: string;
      isActive?: boolean;
      page?: number;
    }) => [...queryKeys.admin.all, 'specimens', filters] as const,
    materials: (filters?: {
      search?: string;
      category?: string;
      isActive?: boolean;
      page?: number;
    }) => [...queryKeys.admin.all, 'materials', filters] as const,
  },
} as const;

/**
 * Cache time configurations (in milliseconds)
 * These align with backend Redis cache durations where applicable
 */
export const cacheConfig = {
  // Reference data - rarely changes, long cache (1 hour)
  referenceData: {
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours (garbage collection)
  },

  // Gallery posts - moderate cache (5 minutes, matches backend)
  posts: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },

  // Post details - moderate cache (15 minutes, matches backend)
  postDetail: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },

  // User's own data - shorter cache for freshness
  userData: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  },

  // User profile - very short cache
  userProfile: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  },

  // Admin data - short cache for real-time feel
  admin: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
} as const;
