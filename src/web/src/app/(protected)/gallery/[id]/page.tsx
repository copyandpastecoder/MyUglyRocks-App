'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postApi, cycleApi } from '@/lib/api';
import { PAGE_CONTAINER } from '@/lib/layout';
import { formatSizeCategories } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { useTimezone } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { PhotoLightbox, useLightbox } from '@/components/photo-lightbox';
import { PageTransition } from '@/components/ui/page-transition';
import { EnhancedImage } from '@/components/ui/enhanced-image';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Send,
  Loader2,
  User,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Package,
  RefreshCw,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import Link from 'next/link';
import type { CommentDto } from '@/types/post';

export default function PostDetailPage() {
  const params = useParams();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const { formatDate } = useTimezone();
  const postId = params.id as string;

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const lightbox = useLightbox();

  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => postApi.getById(postId),
  });

  const { data: voteData } = useQuery({
    queryKey: ['votes', postId],
    queryFn: () => postApi.getVotes(postId),
    enabled: isAuthenticated,
  });

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => postApi.getComments(postId),
  });

  // Fetch cycle photos if this is a cycle post and user is the author
  const { data: cyclePhotos } = useQuery({
    queryKey: ['cycle-photos', post?.cycle?.cycleId],
    queryFn: () => cycleApi.getPhotos(post!.cycle!.cycleId),
    enabled: !!post && post.postType === 'Cycle' && !!post.cycle?.cycleId && post.author.userId === user?.userId,
  });

  const voteMutation = useMutation({
    mutationFn: async () => {
      if (voteData?.userHasVoted) {
        await postApi.removeVote(postId);
      } else {
        await postApi.addVote(postId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['votes', postId] });
    },
    onError: (err) => {
      // Check if this is a 409 Conflict (already voted)
      const isAlreadyVoted = err instanceof Error &&
        'response' in err &&
        (err as { response?: { status?: number } }).response?.status === 409;
      
      if (!isAlreadyVoted) {
        // Only show error for actual failures
        toast.error('Failed to update vote');
      }
      // For 409, just let the query invalidation update the correct state
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['votes', postId] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: (data: { content: string; parentCommentId?: string }) =>
      postApi.addComment(postId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      setNewComment('');
      setReplyingTo(null);
      toast.success('Comment added');
    },
    onError: () => {
      toast.error('Failed to add comment');
    },
  });

  const syncPhotosMutation = useMutation({
    mutationFn: async () => {
      if (!post || !cyclePhotos) return;
      const completedPhotos = cyclePhotos.filter(p => p.processingStatus === 'Completed');
      const photoIds = completedPhotos.map(p => p.photoId);
      const coverPhotoId = completedPhotos[0]?.photoId || undefined;
      
      return postApi.update(postId, {
        title: post.title,
        description: post.description || undefined,
        photoIds,
        coverPhotoId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      toast.success('Photos synced successfully!');
    },
    onError: () => {
      toast.error('Failed to sync photos');
    },
  });

  const handleVote = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to vote');
      return;
    }
    voteMutation.mutate();
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!isAuthenticated) {
      toast.error('Please log in to comment');
      return;
    }
    commentMutation.mutate({
      content: newComment.trim(),
      parentCommentId: replyingTo || undefined,
    });
  };

  const nextPhoto = () => {
    if (post?.photos && currentPhotoIndex < post.photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  if (postLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="aspect-video" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">Post not found</h2>
        <Button asChild className="mt-4">
          <Link href="/gallery">Back to Gallery</Link>
        </Button>
      </div>
    );
  }

  const hasVoted = voteData?.userHasVoted ?? false;
  const currentPhoto = post.photos[currentPhotoIndex];

  return (
    <PageTransition>
    <div className={PAGE_CONTAINER}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/gallery">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{post.title}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>by {post.author.username}</span>
            <span>-</span>
            <span>{formatDate(post.publishedDate, 'MMM d, yyyy')}</span>
          </div>
        </div>
      </div>

      {/* Photo Carousel */}
      {post.photos.length > 0 && (
        <Card className="overflow-hidden">
          <div className="relative aspect-video bg-black group">
            {currentPhoto && (
              <EnhancedImage
                src={currentPhoto.mediumUrl || currentPhoto.url}
                alt={`Photo ${currentPhotoIndex + 1}`}
                blurHash={currentPhoto.blurHash}
                className="w-full h-full object-contain cursor-pointer"
                wrapperClassName="w-full h-full"
                onClick={() => lightbox.open(currentPhotoIndex)}
              />
            )}
            {/* Fullscreen button */}
            <button
              onClick={() => lightbox.open(currentPhotoIndex)}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              title="View fullscreen"
            >
              <Maximize2 className="h-5 w-5" />
            </button>
            {post.photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  disabled={currentPhotoIndex === 0}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white disabled:opacity-30"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextPhoto}
                  disabled={currentPhotoIndex === post.photos.length - 1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white disabled:opacity-30"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                  {post.photos.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPhotoIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        idx === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Photo Lightbox */}
      <PhotoLightbox
        photos={post.photos}
        initialIndex={lightbox.initialIndex}
        isOpen={lightbox.isOpen}
        onClose={lightbox.close}
        onIndexChange={setCurrentPhotoIndex}
      />

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button
          variant={hasVoted ? 'default' : 'outline'}
          onClick={handleVote}
          disabled={voteMutation.isPending}
          className="gap-2"
        >
          <Heart className={`h-4 w-4 ${hasVoted ? 'fill-current' : ''}`} />
          Ugly Rocks! ({post.voteCount})
        </Button>
        <Button variant="outline" className="gap-2" disabled>
          <MessageCircle className="h-4 w-4" />
          {post.commentCount} Comments
        </Button>
        {post.postType === 'Cycle' && post.author.userId === user?.userId && cyclePhotos && (
          <Button
            variant="outline"
            onClick={() => syncPhotosMutation.mutate()}
            disabled={syncPhotosMutation.isPending}
            className="gap-2 ml-auto"
          >
            {syncPhotosMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sync Photos
          </Button>
        )}
      </div>

      {/* Description */}
      {post.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="whitespace-pre-wrap">{post.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Collapsible Overview Card (Cycle or Inventory) */}
      {post.postType === 'Cycle' && post.cycle && (
        <Collapsible open={isOverviewOpen} onOpenChange={setIsOverviewOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3 px-4">
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Title and metadata */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {post.cycle.status}
                      </Badge>
                      <CardTitle className="text-base sm:text-lg leading-tight truncate">{post.cycle.name}</CardTitle>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      <span>Day {post.cycle.elapsedDays}</span>
                      <span>•</span>
                      <span>{post.cycle.stageCount} stage{post.cycle.stageCount !== 1 ? 's' : ''}</span>
                      {post.cycle.finalQuality && (
                        <>
                          <span>•</span>
                          <span>{post.cycle.finalQuality}/5 ★</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Chevron */}
                  <div className="flex items-center shrink-0">
                    {isOverviewOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="grid gap-4 md:grid-cols-3 pt-0">
                <div>
                  <p className="text-sm text-muted-foreground">Started</p>
                  <p className="font-medium">{formatDate(post.cycle.startDate, 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="font-medium">{post.cycle.endDate ? formatDate(post.cycle.endDate, 'MMM d, yyyy') : 'Ongoing'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Runtime</p>
                  <p className="font-medium">{post.cycle.elapsedDays}d</p>
                </div>
                {post.cycle.specimenNames && post.cycle.specimenNames.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Specimens</p>
                    <p className="font-medium">{post.cycle.specimenNames.join(', ')}</p>
                  </div>
                )}
                {post.cycle.difficultyRating && (
                  <div>
                    <p className="text-sm text-muted-foreground">Difficulty</p>
                    <p className="font-medium">
                      {post.cycle.difficultyRating === 1 ? 'Easy' :
                       post.cycle.difficultyRating === 2 ? 'Medium' :
                       post.cycle.difficultyRating === 3 ? 'Hard' :
                       post.cycle.difficultyRating === 4 ? 'Very Hard' :
                       post.cycle.difficultyRating === 5 ? 'Expert' : 'Unknown'}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Photos</p>
                  <p className="font-medium">{post.cycle.photoCount} photos</p>
                </div>
                {(post.cycle.tumblerName || post.cycle.barrelName) && (
                  <div>
                    <p className="text-sm text-muted-foreground">Equipment</p>
                    <p className="font-medium">
                      {[post.cycle.tumblerName, post.cycle.barrelName].filter(Boolean).join(' - ')}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Gallery</p>
                  <p className="font-medium">{post.voteCount} likes</p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Inventory Overview Card */}
      {post.postType === 'Inventory' && post.inventory && (
        <Collapsible open={isOverviewOpen} onOpenChange={setIsOverviewOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3 px-4">
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Title and metadata */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {post.inventory.sourceType}
                      </Badge>
                      <CardTitle className="text-base sm:text-lg leading-tight truncate">{post.inventory.name}</CardTitle>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      {post.inventory.specimenNames.length > 0 && (
                        <span>{post.inventory.specimenNames.join(', ')}</span>
                      )}
                      {post.inventory.sizeCategories.length > 0 && (
                        <>
                          {post.inventory.specimenNames.length > 0 && <span>•</span>}
                          <span>{formatSizeCategories(post.inventory.sizeCategories).join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Chevron */}
                  <div className="flex items-center shrink-0">
                    {isOverviewOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="grid gap-4 md:grid-cols-3 pt-0">
                <div>
                  <p className="text-sm text-muted-foreground">Source</p>
                  <p className="font-medium">{post.inventory.sourceType}</p>
                </div>
                {post.inventory.sourceName && (
                  <div>
                    <p className="text-sm text-muted-foreground">Source Name</p>
                    <p className="font-medium">{post.inventory.sourceName}</p>
                  </div>
                )}
                {post.inventory.sourceLocation && (
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{post.inventory.sourceLocation}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Acquired</p>
                  <p className="font-medium">{formatDate(post.inventory.acquiredDate, 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Condition</p>
                  <p className="font-medium">{post.inventory.condition}</p>
                </div>
                {post.inventory.specimenNames.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Specimens</p>
                    <p className="font-medium">{post.inventory.specimenNames.join(', ')}</p>
                  </div>
                )}
                {post.inventory.sizeCategories.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Size</p>
                    <p className="font-medium">{formatSizeCategories(post.inventory.sizeCategories).join(', ')}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Photos</p>
                  <p className="font-medium">{post.inventory.photoCount} photos</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gallery</p>
                  <p className="font-medium">{post.voteCount} likes</p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comments ({post.commentCount})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Comment Form */}
          {isAuthenticated ? (
            <form onSubmit={handleSubmitComment} className="space-y-2">
              <Textarea
                placeholder={replyingTo ? 'Write a reply...' : 'Write a comment...'}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              <div className="flex justify-between items-center">
                {replyingTo && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                  >
                    Cancel reply
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={!newComment.trim() || commentMutation.isPending}
                  className="ml-auto"
                >
                  {commentMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span className="ml-2">Post</span>
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              <Link href="/login" className="text-primary hover:underline">
                Log in
              </Link>{' '}
              to leave a comment
            </p>
          )}

          <Separator />

          {/* Comments List */}
          {commentsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : comments?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div className="space-y-4">
              {comments?.map((comment) => (
                <CommentItem
                  key={comment.commentId}
                  comment={comment}
                  onReply={(id) => setReplyingTo(id)}
                  currentUserId={user?.userId}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </PageTransition>
  );
}

function CommentItem({
  comment,
  onReply,
  currentUserId,
  formatDate,
  depth = 0,
}: {
  comment: CommentDto;
  onReply: (id: string) => void;
  currentUserId?: string;
  formatDate: (utcDateString: string | null | undefined, formatStr?: string) => string;
  depth?: number;
}) {
  const maxDepth = 3;

  return (
    <div className={depth > 0 ? 'ml-8 border-l-2 pl-4' : ''}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.author.avatarUrl || undefined} />
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {comment.author.username}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDate(comment.dateCreated, 'MMM d, yyyy')}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
          </div>
          <p className="text-sm">{comment.content}</p>
          {depth < maxDepth && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => onReply(comment.commentId)}
            >
              Reply
            </Button>
          )}
        </div>
      </div>
      {comment.replies?.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.commentId}
              comment={reply}
              onReply={onReply}
              currentUserId={currentUserId}
              formatDate={formatDate}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
