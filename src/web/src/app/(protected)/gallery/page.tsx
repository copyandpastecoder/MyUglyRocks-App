'use client';

import { useState } from 'react';
import { usePosts, useVoteMutation } from '@/hooks';
import { useAuth } from '@/providers/auth-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GalleryGridSkeleton } from '@/components/skeletons';
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
    <div className="space-y-6">
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts?.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onVote={(hasVoted) => handleVote(post.id, hasVoted)}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({
  post,
  onVote,
  isAuthenticated,
}: {
  post: PostListDto;
  onVote: (hasVoted: boolean) => void;
  isAuthenticated: boolean;
}) {
  // For now, we don't know if user has voted without an additional API call
  // This could be optimized by including userHasVoted in the list response
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
    <Link href={`/gallery/${post.id}`}>
      <Card className="overflow-hidden transition-shadow hover:shadow-lg cursor-pointer group">
        <div className="aspect-square relative bg-muted">
          {post.coverPhotoUrl ? (
            <img
              src={post.coverPhotoUrl}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
          {post.photoCount > 1 && (
            <Badge className="absolute top-2 right-2 bg-black/70">
              {post.photoCount} photos
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold truncate">{post.title}</h3>
          {post.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {post.description}
            </p>
          )}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {post.author.avatarUrl ? (
                <img
                  src={post.author.avatarUrl}
                  alt={post.author.username}
                  className="h-5 w-5 rounded-full"
                />
              ) : (
                <User className="h-4 w-4" />
              )}
              <span>{post.author.displayName || post.author.username}</span>
            </div>
            <div className="flex items-center gap-3">
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
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
