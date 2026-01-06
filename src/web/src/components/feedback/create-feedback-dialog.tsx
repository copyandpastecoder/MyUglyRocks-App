'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreatePost } from '@/hooks/use-posts';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { FeedbackCategory } from '@/types/post';

const feedbackCategories: Array<{ value: FeedbackCategory; label: string }> = [
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

const formSchema = z.object({
  category: z.enum([
    'General',
    'Cycles',
    'Inventory',
    'Tumblers',
    'Gallery',
    'Materials',
    'Specimens',
    'FAQ',
    'Settings',
  ] as const),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters'),
  description: z
    .string()
    .min(1, 'Comment is required')
    .max(2000, 'Comment must be at most 2000 characters'),
});

type FormData = z.infer<typeof formSchema>;

interface CreateFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateFeedbackDialog({ open, onOpenChange }: CreateFeedbackDialogProps) {
  const router = useRouter();
  const createPostMutation = useCreatePost();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const newPost = await createPostMutation.mutateAsync({
        feedbackCategory: data.category,
        title: data.title,
        description: data.description,
      });

      toast.success('Feedback created successfully!');
      form.reset();
      onOpenChange(false);

      // Navigate to the new feedback post
      router.push(`/feedback/${newPost.postId}`);
    } catch (error: unknown) {
      console.error('Error creating feedback:', error);
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || 'Failed to create feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Feedback</DialogTitle>
          <DialogDescription>
            Share your suggestions, comments, or ideas to help improve MyUglyRocks
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {feedbackCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose which part of the app your feedback is about
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Brief summary of your feedback"
                      {...field}
                      maxLength={200}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value.length}/200 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comment *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide more details about your feedback..."
                      className="min-h-[150px]"
                      {...field}
                      maxLength={2000}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value.length}/2000 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Feedback'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
