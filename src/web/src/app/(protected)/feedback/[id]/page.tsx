'use client';

import { use } from 'react';
import { usePost, useComments, useVoteMutation, useAddComment } from '@/hooks/use-posts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, ArrowLeft, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/providers/auth-provider';
import { useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function FeedbackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { user, isAuthenticated } = useAuth();
  const [commentText, setCommentText] = useState('');

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
      });
      setCommentText('');
      toast.success('Comment added successfully');
    } catch (error) {
      toast.error('Failed to add comment');
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
                {post.author.displayName?.[0] || post.author.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{post.author.displayName || post.author.username}</p>
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
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="mb-4 min-h-[100px]"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || addCommentMutation.isPending}
                >
                  {addCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
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
              <Card key={comment.commentId}>
                <CardContent className="pt-6">
                  <div className="mb-4 flex items-start gap-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.author.avatarUrl || undefined} />
                      <AvatarFallback>
                        {comment.author.displayName?.[0] || comment.author.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {comment.author.displayName || comment.author.username}
                        </p>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.dateCreated), { addSuffix: true })}
                        </span>
                        {comment.isEdited && (
                          <span className="text-xs text-muted-foreground">(edited)</span>
                        )}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm">{comment.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
