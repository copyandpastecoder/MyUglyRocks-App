// Post types
export interface PostDto {
  id: string;
  userId: string;
  cycleId: string;
  title: string;
  description: string | null;
  status: string;
  publishedDate: string;
  voteCount: number;
  commentCount: number;
  author: PostAuthorDto;
  cycle: CyclePreviewDto;
  photos: PostPhotoDto[];
}

export interface PostListDto {
  id: string;
  title: string;
  description: string | null;
  publishedDate: string;
  voteCount: number;
  commentCount: number;
  author: PostAuthorDto;
  coverPhotoUrl: string | null;
  photoCount: number;
}

export interface PostAuthorDto {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface PostPhotoDto {
  id: string;
  photoId: string;
  url: string;
  sortOrder: number;
  isCover: boolean;
}

export interface CyclePreviewDto {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string | null;
  goal: string | null;
  difficultyRating: number | null;
  finalQuality: number | null;
  stageCount: number;
}

export interface CreatePostRequest {
  cycleId: string;
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
  id: string;
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
  id: string;
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
  id: string;
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
