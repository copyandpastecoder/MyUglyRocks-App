'use client';

import { useState } from 'react';
import { useTumblers, useDeleteTumbler } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import type { TumblerListDto } from '@/types/tumbler';

export default function TumblersPage() {
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
      <div className="space-y-6">
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Tumblers</h1>
          <p className="text-muted-foreground">Manage your rock tumblers</p>
        </div>
        <Button asChild>
          <Link href="/tumblers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Tumbler
          </Link>
        </Button>
      </div>

      {tumblers?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Cylinder className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No tumblers yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your first tumbler to start tracking your tumbling cycles
            </p>
            <Button asChild>
              <Link href="/tumblers/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Tumbler
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tumblers?.map((tumbler: TumblerListDto) => (
            <Card key={tumbler.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{tumbler.brand}</CardTitle>
                    <CardDescription>
                      {tumbler.model || 'No model specified'}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/tumblers/${tumbler.id}`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => handleDelete(tumbler.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={tumbler.tumblerType === 'Rotary' ? 'default' : 'secondary'}>
                    {tumbler.tumblerType}
                  </Badge>
                  <Badge variant="outline">
                    {tumbler.barrelCount} barrel{tumbler.barrelCount !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Added {new Date(tumbler.dateCreated).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
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
  );
}
