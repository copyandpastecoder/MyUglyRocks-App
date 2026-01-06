'use client';

import { use } from 'react';
import { usePost, useComments, useVoteMutation, useAddComment } from '@/hooks/use-posts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, ArrowLeft, MessageCircle, User } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '@/providers/auth-provider';
import { useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { CommentDto } from '@/types/post';

export default function FeedbackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { user, isAuthenticated } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const { data: post, isLoading: postLoading } = usePost(id);
  const { data: comments, isLoading: commentsLoading } = useComments(id);
  const voteMutation = useVoteMutation();
  const addCommentMutation = useAddComment(id);

  const handleVote = () => {
    if (!post) return;
    voteMutation.mutate({ postId: post.postId, hasVoted: false });
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;

    try {
      await addCommentMutation.mutateAsync({
        content: commentText,
        parentCommentId: replyingTo || undefined,
      });
      setCommentText('');
      setReplyingTo(null);
      toast.success(replyingTo ? 'Reply added successfully' : 'Comment added successfully');
    } catch (error) {
      toast.error(replyingTo ? 'Failed to add reply' : 'Failed to add comment');
    }
  };

  if (postLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Feedback not found</p>
            <Link href="/feedback">
              <Button variant="link">Back to Feedback</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (post.postType !== 'Feedback') {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">This is not a feedback post</p>
            <Link href="/feedback">
              <Button variant="link">Back to Feedback</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Back Button */}
      <div className="mb-4">
        <Link href="/feedback">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Feedback
          </Button>
        </Link>
      </div>

      {/* Feedback Post */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{post.title}</h1>
              {post.feedbackCategory && (
                <Badge variant="secondary" className="mt-2">
                  {post.feedbackCategory}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author.avatarUrl || undefined} />
              <AvatarFallback>
                {post.author.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{post.author.username}</p>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(post.publishedDate), { addSuffix: true })}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleVote}
              disabled={!isAuthenticated}
              className="gap-2"
            >
              <ThumbsUp className="h-4 w-4" />
              <span>{post.voteCount}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {post.description && (
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-foreground">{post.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments Section */}
      <div className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold">
          <MessageCircle className="h-6 w-6" />
          Comments ({post.commentCount})
        </h2>

        {/* Add Comment */}
        {isAuthenticated && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <Textarea
                placeholder={replyingTo ? 'Write a reply...' : 'Add a comment...'}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="mb-4 min-h-[100px]"
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
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || addCommentMutation.isPending}
                  className="ml-auto"
                >
                  {addCommentMutation.isPending ? 'Posting...' : replyingTo ? 'Post Reply' : 'Post Comment'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comments List */}
        {commentsLoading && (
          <div className="text-center text-muted-foreground">Loading comments...</div>
        )}

        {!commentsLoading && comments && comments.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
            </CardContent>
          </Card>
        )}

        {!commentsLoading && comments && comments.length > 0 && (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.commentId}
                comment={comment}
                onReply={(id) => setReplyingTo(id)}
                currentUserId={user?.userId}
              />
            ))}
          </div>
        )}
      </div>
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
      <Card>
        <CardContent className="pt-6">
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
                  {format(new Date(comment.dateCreated), 'MMM d, yyyy')}
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
        </CardContent>
      </Card>
      {comment.replies?.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.commentId}
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
