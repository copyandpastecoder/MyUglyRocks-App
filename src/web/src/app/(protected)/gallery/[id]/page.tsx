'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postApi } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Calendar,
  Target,
  Star,
  Send,
  Loader2,
  User,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import type { CommentDto } from '@/types/post';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const postId = params.id as string;

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

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
    onError: () => {
      toast.error('Failed to update vote');
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
    <div className="max-w-4xl mx-auto space-y-6">
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
            <span>by {post.author.displayName || post.author.username}</span>
            <span>-</span>
            <span>{new Date(post.publishedDate).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Photo Carousel */}
      {post.photos.length > 0 && (
        <Card className="overflow-hidden">
          <div className="relative aspect-video bg-black">
            {currentPhoto && (
              <img
                src={currentPhoto.url}
                alt={`Photo ${currentPhotoIndex + 1}`}
                className="w-full h-full object-contain"
              />
            )}
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
      </div>

      {/* Description */}
      {post.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="whitespace-pre-wrap">{post.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Cycle Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cycle Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Goal</p>
              <p className="font-medium">{post.cycle.goal || 'Not specified'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-medium">
                {post.cycle.startDate} - {post.cycle.endDate || 'Ongoing'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Quality</p>
              <p className="font-medium">
                {post.cycle.finalQuality ? `${post.cycle.finalQuality}/5` : 'Not rated'}
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Stages</p>
            <p className="font-medium">{post.cycle.stageCount} stages</p>
          </div>
        </CardContent>
      </Card>

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
                  key={comment.id}
                  comment={comment}
                  onReply={(id) => setReplyingTo(id)}
                  currentUserId={user?.id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CommentItem({
  comment,
  onReply,
  currentUserId,
  depth = 0,
}: {
  comment: CommentDto;
  onReply: (id: string) => void;
  currentUserId?: string;
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
              {comment.author.displayName || comment.author.username}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(comment.dateCreated).toLocaleDateString()}
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
              onClick={() => onReply(comment.id)}
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
              key={reply.id}
              comment={reply}
              onReply={onReply}
              currentUserId={currentUserId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
