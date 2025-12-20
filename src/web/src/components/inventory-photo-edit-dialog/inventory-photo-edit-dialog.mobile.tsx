'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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

export function InventoryPhotoEditDialogMobile({
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0">
        <SheetHeader className="p-4 pb-2 border-b">
          <SheetTitle>Edit Photo</SheetTitle>
          <SheetDescription>
            Update the specimen tag or caption for this photo.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Photo preview */}
          <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
            <img
              src={photo.thumbnailUrl || photo.url}
              alt={photo.caption || 'Photo'}
              className="w-full h-full object-contain"
            />
          </div>

          <Form {...form}>
            <form id="photo-edit-form-mobile" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="inventorySpecimenId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Tag Specimen</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue placeholder="Select a specimen (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__" className="py-3">No specimen tag</SelectItem>
                        {specimens.map((specimen) => (
                          <SelectItem
                            key={specimen.inventorySpecimenId}
                            value={specimen.inventorySpecimenId}
                            className="py-3"
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
                    <FormLabel className="text-base font-semibold">Caption</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Add a caption (optional)"
                        className="h-12 text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <SheetFooter className="p-4 border-t bg-background">
          <div className="flex gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
              className="flex-1 h-12 text-base"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="photo-edit-form-mobile"
              disabled={updateMutation.isPending}
              className="flex-1 h-12 text-base"
            >
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              )}
              Save
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
