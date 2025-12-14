'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postApi } from '@/lib/api';
import { queryKeys, cacheConfig } from '@/lib/query-keys';
import { toast } from 'sonner';
import type { PostListDto, CreatePostRequest, UpdatePostRequest, CreateCommentRequest, UpdateCommentRequest, ReportCommentRequest } from '@/types/post';

/**
 * Hook to fetch gallery posts with sorting
 * Uses medium cache time matching backend Redis cache (5 min)
 */
export function usePosts(sortBy?: string) {
  return useQuery({
    queryKey: queryKeys.posts.list(sortBy),
    queryFn: () => postApi.getAll(sortBy === 'newest' ? undefined : sortBy),
    ...cacheConfig.posts,
  });
}

/**
 * Hook to fetch a single post by ID
 * Uses longer cache time for details (15 min)
 */
export function usePost(id: string | null) {
  return useQuery({
    queryKey: queryKeys.posts.detail(id!),
    queryFn: () => postApi.getById(id!),
    enabled: !!id,
    ...cacheConfig.postDetail,
  });
}

/**
 * Hook to fetch posts by a specific user
 */
export function useUserPosts(username: string | null) {
  return useQuery({
    queryKey: queryKeys.posts.userPosts(username!),
    queryFn: () => postApi.getUserPosts(username!),
    enabled: !!username,
    ...cacheConfig.posts,
  });
}

/**
 * Hook to fetch vote count for a post
 */
export function useVoteCount(postId: string) {
  return useQuery({
    queryKey: queryKeys.posts.votes(postId),
    queryFn: () => postApi.getVotes(postId),
    staleTime: 30 * 1000, // 30 seconds - votes change frequently
  });
}

/**
 * Hook to fetch comments for a post
 */
export function useComments(postId: string | null) {
  return useQuery({
    queryKey: queryKeys.posts.comments(postId!),
    queryFn: () => postApi.getComments(postId!),
    enabled: !!postId,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook for voting on posts with optimistic updates
 */
export function useVoteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, hasVoted }: { postId: string; hasVoted: boolean }) => {
      if (hasVoted) {
        await postApi.removeVote(postId);
        return { action: 'removed' };
      } else {
        await postApi.addVote(postId);
        return { action: 'added' };
      }
    },
    onMutate: async ({ postId, hasVoted }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.posts.lists() });

      // Snapshot current data for rollback
      const previousPosts = queryClient.getQueriesData({ queryKey: queryKeys.posts.lists() });

      // Optimistically update the vote count in all post lists
      queryClient.setQueriesData(
        { queryKey: queryKeys.posts.lists() },
        (old: PostListDto[] | undefined) => {
          if (!old) return old;
          return old.map(post =>
            post.postId === postId
              ? { ...post, voteCount: post.voteCount + (hasVoted ? -1 : 1) }
              : post
          );
        }
      );

      return { previousPosts };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      context?.previousPosts.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      toast.error('Failed to update vote');
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.votes(variables.postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(variables.postId) });
    },
  });
}

/**
 * Hook for creating posts
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePostRequest) => postApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      toast.success('Post shared successfully!');
    },
    onError: () => {
      toast.error('Failed to share post');
    },
  });
}

/**
 * Hook for updating posts
 */
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePostRequest }) =>
      postApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
      toast.success('Post updated successfully');
    },
    onError: () => {
      toast.error('Failed to update post');
    },
  });
}

/**
 * Hook for deleting posts
 */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => postApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      toast.success('Post deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete post');
    },
  });
}

/**
 * Hook for adding comments with optimistic updates
 */
export function useAddComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentRequest) => postApi.addComment(postId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.comments(postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
    },
    onError: () => {
      toast.error('Failed to add comment');
    },
  });
}

/**
 * Hook for updating comments
 */
export function useUpdateComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, data }: { commentId: string; data: UpdateCommentRequest }) =>
      postApi.updateComment(commentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.comments(postId) });
      toast.success('Comment updated');
    },
    onError: () => {
      toast.error('Failed to update comment');
    },
  });
}

/**
 * Hook for deleting comments
 */
export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => postApi.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.comments(postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(postId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.lists() });
      toast.success('Comment deleted');
    },
    onError: () => {
      toast.error('Failed to delete comment');
    },
  });
}

/**
 * Hook for reporting comments
 */
export function useReportComment() {
  return useMutation({
    mutationFn: ({ commentId, data }: { commentId: string; data: ReportCommentRequest }) =>
      postApi.reportComment(commentId, data),
    onSuccess: () => {
      toast.success('Report submitted. Thank you for helping keep the community safe.');
    },
    onError: () => {
      toast.error('Failed to submit report');
    },
  });
}
