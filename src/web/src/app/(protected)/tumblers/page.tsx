'use client';

import { useState } from 'react';
import { useTumblers, useDeleteTumbler } from '@/hooks';
import { PAGE_CONTAINER } from '@/lib/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { NoTumblersEmpty } from '@/components/ui/empty-state';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { Plus, Cylinder, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { TumblerListDto } from '@/types/tumbler';

export default function TumblersPage() {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const router = useRouter();

  const { data: tumblers, isLoading } = useTumblers();
  const deleteMutation = useDeleteTumbler();

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  if (isLoading) {
    return (
      <div className={PAGE_CONTAINER}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Tumblers</h1>
            <p className="text-muted-foreground">Manage your rock tumblers</p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className={PAGE_CONTAINER}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Tumblers</h1>
            <p className="text-muted-foreground">Manage your rock tumblers</p>
          </div>
          <Button asChild>
            <Link href="/tumblers/new">
              <Plus className="mr-2 h-4 w-4" />
              New Tumbler
            </Link>
          </Button>
        </div>

        {tumblers?.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <NoTumblersEmpty onAction={() => router.push('/tumblers/new')} />
            </CardContent>
          </Card>
        ) : (
          <StaggerContainer className="space-y-2">
            {tumblers?.map((tumbler: TumblerListDto) => (
              <StaggerItem key={tumbler.tumblerId}>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200">
                  <Link href={`/tumblers/${tumbler.tumblerId}`} className="flex-1 min-w-0">
                    <p className="font-medium truncate">{tumbler.brand} {tumbler.model}</p>
                    <p className="text-sm text-muted-foreground">
                      {tumbler.tumblerType} · {tumbler.barrelCount} barrel{tumbler.barrelCount !== 1 ? 's' : ''}
                    </p>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Cylinder className="h-4 w-4 text-muted-foreground" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/tumblers/${tumbler.tumblerId}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => handleDelete(tumbler.tumblerId)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tumbler</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tumbler? This action cannot be undone.
              If this tumbler has any stage runs, it will be deactivated instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </PageTransition>
  );
}
