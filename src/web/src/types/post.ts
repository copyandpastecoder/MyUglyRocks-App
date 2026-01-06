// Post types
export type PostType = 'Cycle' | 'Inventory' | 'Feedback';

export type FeedbackCategory =
  | 'General'
  | 'Cycles'
  | 'Inventory'
  | 'Tumblers'
  | 'Gallery'
  | 'Materials'
  | 'Specimens'
  | 'FAQ'
  | 'Settings';

export interface PostDto {
  postId: string;
  userId: string;
  cycleId: string | null;
  inventoryId: string | null;
  postType: PostType;
  feedbackCategory: FeedbackCategory | null;
  title: string;
  description: string | null;
  status: string;
  publishedDate: string;
  voteCount: number;
  commentCount: number;
  author: PostAuthorDto;
  cycle: CyclePreviewDto | null;
  inventory: InventoryPreviewDto | null;
  photos: PostPhotoDto[];
}

export interface PostListDto {
  postId: string;
  postType: PostType;
  feedbackCategory: FeedbackCategory | null;
  title: string;
  description: string | null;
  publishedDate: string;
  voteCount: number;
  commentCount: number;
  author: PostAuthorDto;
  coverPhotoUrl: string | null;
  coverPhotoThumbnailUrl: string | null;
  coverPhotoBlurHash: string | null;
  photoCount: number;
  // Inventory-specific fields for gallery card display
  sourceType: string | null;
  specimenNames: string[];
  sizeCategories: string[];
}

export interface PostAuthorDto {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface PostPhotoDto {
  postId: string;
  photoId: string;
  url: string;
  sortOrder: number;
  isCover: boolean;
  thumbnailUrl: string | null;
  mediumUrl: string | null;
  largeUrl: string | null;
  blurHash: string | null;
  width: number | null;
  height: number | null;
}

export interface CyclePreviewDto {
  cycleId: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string | null;
  difficultyRating: number | null;
  finalQuality: number | null;
  stageCount: number;
  // Extended fields for gallery display
  elapsedDays: number;
  totalRuntimeHours: number;
  photoCount: number;
  tumblerName: string | null;
  barrelName: string | null;
  specimenNames: string[];
}

export interface InventoryPreviewDto {
  inventoryId: string;
  name: string;
  sourceType: string;
  sourceName: string | null;
  sourceLocation: string | null;
  acquiredDate: string;
  condition: string;
  specimenNames: string[];
  sizeCategories: string[];
  photoCount: number;
}

export interface CreatePostRequest {
  cycleId?: string;
  inventoryId?: string;
  feedbackCategory?: FeedbackCategory;
  title: string;
  description?: string;
  photoIds?: string[];
  coverPhotoId?: string;
}

export interface UpdatePostRequest {
  title: string;
  description?: string;
}

// Vote types
export interface VoteDto {
  voteId: string;
  postId: string;
  userId: string;
  dateCreated: string;
}

export interface VoteCountDto {
  postId: string;
  count: number;
  userHasVoted: boolean;
}

// Comment types
export interface CommentDto {
  commentId: string;
  postId: string;
  parentCommentId: string | null;
  content: string;
  isEdited: boolean;
  editedDate: string | null;
  dateCreated: string;
  author: CommentAuthorDto;
  replies: CommentDto[];
}

export interface CommentAuthorDto {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface CreateCommentRequest {
  content: string;
  parentCommentId?: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface ReportCommentRequest {
  reason: string;
  details?: string;
}
