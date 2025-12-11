'use client';

import { useState } from 'react';
import { usePosts, useVoteMutation } from '@/hooks';
import { useAuth } from '@/providers/auth-provider';
import { PAGE_CONTAINER } from '@/lib/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GalleryGridSkeleton } from '@/components/skeletons';
import { LazyImage } from '@/components/lazy-image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Heart,
  MessageCircle,
  ImageIcon,
  AlertCircle,
  User,
} from 'lucide-react';
import Link from 'next/link';
import type { PostListDto } from '@/types/post';

export default function GalleryPage() {
  const { isAuthenticated } = useAuth();
  const [sortBy, setSortBy] = useState<string>('newest');

  const { data: posts, isLoading, error } = usePosts(sortBy);
  const voteMutation = useVoteMutation();

  const handleVote = (postId: string, hasVoted: boolean) => {
    if (!isAuthenticated) {
      toast.error('Please log in to vote');
      return;
    }
    voteMutation.mutate({ postId, hasVoted });
  };

  return (
    <div className={PAGE_CONTAINER}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gallery</h1>
          <p className="text-muted-foreground">
            Discover beautiful tumbled rocks from the community
          </p>
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="votes">Most Voted</SelectItem>
            <SelectItem value="comments">Most Discussed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <GalleryGridSkeleton count={6} />
      ) : error ? (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-4 py-6">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div>
              <p className="font-medium">Error loading gallery</p>
              <p className="text-sm text-muted-foreground">Please try again later</p>
            </div>
          </CardContent>
        </Card>
      ) : posts?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No posts yet</h3>
            <p className="text-muted-foreground text-center">
              Be the first to share your tumbled rocks!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {posts?.map((post) => (
            <PostRow
              key={post.postId}
              post={post}
              onVote={(hasVoted) => handleVote(post.postId, hasVoted)}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PostRow({
  post,
  onVote,
  isAuthenticated,
}: {
  post: PostListDto;
  onVote: (hasVoted: boolean) => void;
  isAuthenticated: boolean;
}) {
  const [hasVoted, setHasVoted] = useState(false);

  const handleVoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onVote(hasVoted);
    if (isAuthenticated) {
      setHasVoted(!hasVoted);
    }
  };

  return (
    <Link
      href={`/gallery/${post.postId}`}
      className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
        {post.coverPhotoUrl ? (
          <LazyImage
            src={post.coverPhotoThumbnailUrl || post.coverPhotoUrl}
            alt={post.title}
            blurHash={post.coverPhotoBlurHash}
            wrapperClassName="w-full h-full"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{post.title}</p>
        <p className="text-sm text-muted-foreground">
          {post.photoCount} photo{post.photoCount !== 1 ? 's' : ''}
          {' · '}
          {post.author.displayName || post.author.username}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={handleVoteClick}
          className={`flex items-center gap-1 text-sm transition-colors ${
            hasVoted ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
          }`}
        >
          <Heart className={`h-4 w-4 ${hasVoted ? 'fill-current' : ''}`} />
          <span>{post.voteCount}</span>
        </button>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MessageCircle className="h-4 w-4" />
          <span>{post.commentCount}</span>
        </div>
      </div>
    </Link>
  );
}
