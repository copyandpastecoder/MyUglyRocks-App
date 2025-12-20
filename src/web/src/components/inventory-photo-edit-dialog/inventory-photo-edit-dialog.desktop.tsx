'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUpdateInventoryPhoto } from '@/hooks/use-inventory';
import type { InventorySpecimenDto } from '@/types/inventory';
import type { InventoryPhotoEditDialogProps } from './types';

const formSchema = z.object({
  inventorySpecimenId: z.string().optional(),
  caption: z.string().max(500, 'Caption must be 500 characters or less').optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function InventoryPhotoEditDialogDesktop({
  open,
  onOpenChange,
  inventoryId,
  photo,
  specimens,
  onSuccess,
}: InventoryPhotoEditDialogProps) {
  const updateMutation = useUpdateInventoryPhoto();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inventorySpecimenId: '',
      caption: '',
    },
  });

  useEffect(() => {
    if (open && photo) {
      form.reset({
        inventorySpecimenId: photo.inventorySpecimenId || '__none__',
        caption: photo.caption || '',
      });
    }
  }, [open, photo, form]);

  const onSubmit = (values: FormValues) => {
    if (!photo) return;

    updateMutation.mutate(
      {
        inventoryId,
        photoId: photo.inventoryPhotoId,
        data: {
          inventorySpecimenId: values.inventorySpecimenId === '__none__' ? null : values.inventorySpecimenId || null,
          caption: values.caption || null,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      }
    );
  };

  const getSpecimenName = (specimen: InventorySpecimenDto) => {
    return specimen.commonName || 'Unknown Specimen';
  };

  if (!photo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Photo</DialogTitle>
          <DialogDescription>
            Update the specimen tag or caption for this photo.
          </DialogDescription>
        </DialogHeader>

        {/* Photo preview */}
        <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
          <img
            src={photo.thumbnailUrl || photo.url}
            alt={photo.caption || 'Photo'}
            className="w-full h-full object-contain"
          />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="inventorySpecimenId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag Specimen</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a specimen (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">No specimen tag</SelectItem>
                      {specimens.map((specimen) => (
                        <SelectItem
                          key={specimen.inventorySpecimenId}
                          value={specimen.inventorySpecimenId}
                        >
                          {getSpecimenName(specimen)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="caption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Caption</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Add a caption (optional)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
