'use client';

import { useState } from 'react';
import { useFeedbackPosts, useVoteMutation } from '@/hooks/use-posts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageSquare, ThumbsUp, MessageCircle, Plus } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { FeedbackCategory } from '@/types/post';
import { useAuth } from '@/providers/auth-provider';
import { CreateFeedbackDialog } from '@/components/feedback/create-feedback-dialog';

const categories: Array<{ value: FeedbackCategory | 'All'; label: string }> = [
  { value: 'All', label: 'All Feedback' },
  { value: 'General', label: 'General' },
  { value: 'Cycles', label: 'Cycles' },
  { value: 'Inventory', label: 'Inventory' },
  { value: 'Tumblers', label: 'Tumblers' },
  { value: 'Gallery', label: 'Gallery' },
  { value: 'Materials', label: 'Materials' },
  { value: 'Specimens', label: 'Specimens' },
  { value: 'FAQ', label: 'FAQ' },
  { value: 'Settings', label: 'Settings' },
];

export default function FeedbackPage() {
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory | 'All'>('All');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const { data: posts, isLoading } = useFeedbackPosts(
    selectedCategory === 'All' ? undefined : selectedCategory,
    sortBy
  );
  const voteMutation = useVoteMutation();

  const handleVote = (postId: string, hasVoted: boolean) => {
    voteMutation.mutate({ postId, hasVoted });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Feedback</h1>
            <p className="mt-2 text-muted-foreground">
              Share your suggestions, comments, and ideas to help improve MyUglyRocks
            </p>
          </div>
          {isAuthenticated && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Feedback
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Category Tabs */}
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
          <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as FeedbackCategory | 'All')}>
            <TabsList className="inline-flex w-auto flex-wrap gap-1 h-auto">
              {categories.map((cat) => (
                <TabsTrigger key={cat.value} value={cat.value} className="shrink-0">
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="votes">Most Voted</SelectItem>
              <SelectItem value="comments">Most Discussed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="text-muted-foreground">Loading feedback...</div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && posts && posts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No feedback yet</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Be the first to share your thoughts!
            </p>
            {isAuthenticated && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Feedback
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Feedback List */}
      {!isLoading && posts && posts.length > 0 && (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.postId} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Link
                      href={`/feedback/${post.postId}`}
                      className="text-xl font-semibold hover:underline"
                    >
                      {post.title}
                    </Link>
                    {post.feedbackCategory && (
                      <Badge variant="secondary" className="ml-2">
                        {post.feedbackCategory}
                      </Badge>
                    )}
                    {post.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {post.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardFooter className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    by{' '}
                    <span className="font-medium text-foreground">
                      {post.author.username}
                    </span>
                  </span>
                  <span>
                    {formatDistanceToNow(new Date(post.publishedDate), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleVote(post.postId, false)}
                    disabled={!isAuthenticated}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>{post.voteCount}</span>
                  </Button>
                  <Link href={`/feedback/${post.postId}`}>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.commentCount}</span>
                    </Button>
                  </Link>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create Feedback Dialog */}
      <CreateFeedbackDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
