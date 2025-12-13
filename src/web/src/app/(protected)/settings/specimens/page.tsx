'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Plus, Pencil, Trash2, Loader2, Search, Globe, Lock, Gem } from 'lucide-react';
import { PageTransition } from '@/components/ui/page-transition';
import {
  useUserSpecimens,
  useUserSpecimen,
  useCreateUserSpecimen,
  useUpdateUserSpecimen,
  useDeleteUserSpecimen,
} from '@/hooks/use-user-specimens';
import type { CreateUserSpecimenRequest, UpdateUserSpecimenRequest, UserSpecimenListDto } from '@/types/user-specimen';

const materialTypes = ['Rock', 'Mineral', 'Glass', 'Fossil', 'Other'];
const difficulties = ['Easy', 'Medium', 'Hard'];

const specimenSchema = z.object({
  commonName: z.string().min(1, 'Name is required').max(100),
  scientificName: z.string().max(100).optional().nullable(),
  alias: z.string().max(255).optional().nullable(),
  rockFamily: z.string().max(100).optional().nullable(),
  species: z.string().max(100).optional().nullable(),
  variety: z.string().max(100).optional().nullable(),
  materialType: z.string().default('Rock'),
  mohsHardnessMin: z.number().min(1).max(10).optional().nullable(),
  mohsHardnessMax: z.number().min(1).max(10).optional().nullable(),
  tumblingDifficulty: z.string().optional().nullable(),
  recommendedGritSequence: z.string().max(255).optional().nullable(),
  specialConsiderations: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isPublic: z.boolean().default(false),
});

type SpecimenFormData = z.infer<typeof specimenSchema>;

export default function MySpecimensPage() {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch user's specimens
  const { data: specimens, isLoading } = useUserSpecimens({ search });

  // Mutations
  const createMutation = useCreateUserSpecimen();
  const updateMutation = useUpdateUserSpecimen();
  const deleteMutation = useDeleteUserSpecimen();

  // Get specimen for editing
  const { data: editingSpecimen } = useUserSpecimen(editingId);

  const form = useForm<SpecimenFormData>({
    resolver: zodResolver(specimenSchema),
    defaultValues: {
      commonName: '',
      scientificName: null,
      alias: null,
      rockFamily: null,
      species: null,
      variety: null,
      materialType: 'Rock',
      mohsHardnessMin: null,
      mohsHardnessMax: null,
      tumblingDifficulty: null,
      recommendedGritSequence: null,
      specialConsiderations: null,
      notes: null,
      isPublic: false,
    },
  });

  const handleOpenDialog = (id?: string) => {
    if (id) {
      setEditingId(id);
    } else {
      setEditingId(null);
      form.reset({
        commonName: '',
        scientificName: null,
        alias: null,
        rockFamily: null,
        species: null,
        variety: null,
        materialType: 'Rock',
        mohsHardnessMin: null,
        mohsHardnessMax: null,
        tumblingDifficulty: null,
        recommendedGritSequence: null,
        specialConsiderations: null,
        notes: null,
        isPublic: false,
      });
    }
    setIsDialogOpen(true);
  };

  // Update form when editing specimen loads
  useEffect(() => {
    if (editingSpecimen && editingId) {
      form.reset({
        commonName: editingSpecimen.commonName,
        scientificName: editingSpecimen.scientificName,
        alias: editingSpecimen.alias,
        rockFamily: editingSpecimen.rockFamily,
        species: editingSpecimen.species,
        variety: editingSpecimen.variety,
        materialType: editingSpecimen.materialType,
        mohsHardnessMin: editingSpecimen.mohsHardnessMin,
        mohsHardnessMax: editingSpecimen.mohsHardnessMax,
        tumblingDifficulty: editingSpecimen.tumblingDifficulty,
        recommendedGritSequence: editingSpecimen.recommendedGritSequence,
        specialConsiderations: editingSpecimen.specialConsiderations,
        notes: editingSpecimen.notes,
        isPublic: editingSpecimen.isPublic,
      });
    }
  }, [editingSpecimen, editingId, form]);

  const handleSubmit = async (data: SpecimenFormData) => {
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: data as UpdateUserSpecimenRequest,
        });
      } else {
        await createMutation.mutateAsync(data as CreateUserSpecimenRequest);
      }
      setIsDialogOpen(false);
      setEditingId(null);
      form.reset();
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      setDeleteConfirmId(null);
    } catch {
      // Error handled by mutation
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>My Custom Specimens</CardTitle>
                <CardDescription>
                  Create and manage your own specimen entries for rocks not in the reference database
                </CardDescription>
              </div>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Specimen
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search your specimens..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardContent>
        </Card>

        {/* Specimens List */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : specimens && specimens.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {specimens.map((specimen: UserSpecimenListDto) => (
                    <TableRow key={specimen.userSpecimenId}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{specimen.commonName}</div>
                          {specimen.scientificName && (
                            <div className="text-sm text-muted-foreground italic">
                              {specimen.scientificName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{specimen.materialType}</Badge>
                      </TableCell>
                      <TableCell>
                        {specimen.tumblingDifficulty ? (
                          <Badge
                            variant={
                              specimen.tumblingDifficulty === 'Easy'
                                ? 'secondary'
                                : specimen.tumblingDifficulty === 'Hard'
                                ? 'destructive'
                                : 'default'
                            }
                          >
                            {specimen.tumblingDifficulty}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {specimen.isPublic ? (
                          <Badge variant="secondary" className="gap-1">
                            <Globe className="h-3 w-3" />
                            Public
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <Lock className="h-3 w-3" />
                            Private
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(specimen.userSpecimenId)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmId(specimen.userSpecimenId)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Gem className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">No custom specimens yet</h3>
                <p className="text-muted-foreground max-w-sm mt-1">
                  Create your first custom specimen for rocks and minerals that aren&apos;t in our reference database.
                </p>
                <Button className="mt-4" onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Specimen
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Edit Specimen' : 'Add Custom Specimen'}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? 'Update the details of your custom specimen.'
                  : 'Create a new specimen entry for rocks not in the reference database.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Common Name */}
                <div className="space-y-2">
                  <Label htmlFor="commonName">Common Name *</Label>
                  <Input
                    id="commonName"
                    {...form.register('commonName')}
                    placeholder="e.g., Rainbow Jasper"
                  />
                  {form.formState.errors.commonName && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.commonName.message}
                    </p>
                  )}
                </div>

                {/* Scientific Name */}
                <div className="space-y-2">
                  <Label htmlFor="scientificName">Scientific Name</Label>
                  <Input
                    id="scientificName"
                    {...form.register('scientificName')}
                    placeholder="e.g., SiO2"
                  />
                </div>

                {/* Material Type */}
                <div className="space-y-2">
                  <Label htmlFor="materialType">Material Type</Label>
                  <Select
                    value={form.watch('materialType')}
                    onValueChange={(value) => form.setValue('materialType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {materialTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tumbling Difficulty */}
                <div className="space-y-2">
                  <Label htmlFor="tumblingDifficulty">Tumbling Difficulty</Label>
                  <Select
                    value={form.watch('tumblingDifficulty') || ''}
                    onValueChange={(value) => form.setValue('tumblingDifficulty', value || null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Not specified</SelectItem>
                      {difficulties.map((diff) => (
                        <SelectItem key={diff} value={diff}>
                          {diff}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mohs Hardness Min */}
                <div className="space-y-2">
                  <Label htmlFor="mohsHardnessMin">Mohs Hardness (Min)</Label>
                  <Input
                    id="mohsHardnessMin"
                    type="number"
                    step="0.5"
                    min="1"
                    max="10"
                    {...form.register('mohsHardnessMin', { valueAsNumber: true })}
                    placeholder="1-10"
                  />
                </div>

                {/* Mohs Hardness Max */}
                <div className="space-y-2">
                  <Label htmlFor="mohsHardnessMax">Mohs Hardness (Max)</Label>
                  <Input
                    id="mohsHardnessMax"
                    type="number"
                    step="0.5"
                    min="1"
                    max="10"
                    {...form.register('mohsHardnessMax', { valueAsNumber: true })}
                    placeholder="1-10"
                  />
                </div>

                {/* Rock Family */}
                <div className="space-y-2">
                  <Label htmlFor="rockFamily">Rock Family</Label>
                  <Input
                    id="rockFamily"
                    {...form.register('rockFamily')}
                    placeholder="e.g., Silicate"
                  />
                </div>

                {/* Variety */}
                <div className="space-y-2">
                  <Label htmlFor="variety">Variety</Label>
                  <Input
                    id="variety"
                    {...form.register('variety')}
                    placeholder="e.g., Banded"
                  />
                </div>
              </div>

              {/* Alias */}
              <div className="space-y-2">
                <Label htmlFor="alias">Alias / Alternative Names</Label>
                <Input
                  id="alias"
                  {...form.register('alias')}
                  placeholder="Comma-separated alternative names"
                />
              </div>

              {/* Recommended Grit Sequence */}
              <div className="space-y-2">
                <Label htmlFor="recommendedGritSequence">Recommended Grit Sequence</Label>
                <Input
                  id="recommendedGritSequence"
                  {...form.register('recommendedGritSequence')}
                  placeholder="e.g., 60/90 → 120/220 → 500 → Polish"
                />
              </div>

              {/* Special Considerations */}
              <div className="space-y-2">
                <Label htmlFor="specialConsiderations">Special Considerations</Label>
                <Textarea
                  id="specialConsiderations"
                  {...form.register('specialConsiderations')}
                  placeholder="Any special handling notes..."
                  rows={2}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Personal Notes</Label>
                <Textarea
                  id="notes"
                  {...form.register('notes')}
                  placeholder="Your notes about this specimen..."
                  rows={2}
                />
              </div>

              {/* Public Toggle */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="isPublic">Make Public</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow other users to see and use this specimen
                  </p>
                </div>
                <Switch
                  id="isPublic"
                  checked={form.watch('isPublic')}
                  onCheckedChange={(checked) => form.setValue('isPublic', checked)}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId ? 'Save Changes' : 'Create Specimen'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog
          open={!!deleteConfirmId}
          onOpenChange={() => setDeleteConfirmId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Specimen?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this custom specimen. Any cycles or inventory using this specimen will no longer have a valid reference.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
}
