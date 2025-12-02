'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, Search } from 'lucide-react';
import type { SpecimenDetailDto, SpecimenListDto, CreateSpecimenRequest, UpdateSpecimenRequest } from '@/types/admin';

const materialTypes = ['Rock', 'Mineral', 'Glass', 'Fossil', 'Other'];
const difficulties = ['Easy', 'Medium', 'Hard'];

const defaultFormData: CreateSpecimenRequest = {
  commonName: '',
  scientificName: '',
  alias: '',
  rockFamily: '',
  species: '',
  variety: '',
  materialType: 'Rock',
  mohsHardnessMin: undefined,
  mohsHardnessMax: undefined,
  tumblingDifficulty: '',
  recommendedGritSequence: '',
  specialConsiderations: '',
  notes: '',
};

export default function SpecimensAdminPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [materialTypeFilter, setMaterialTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSpecimen, setSelectedSpecimen] = useState<SpecimenDetailDto | null>(null);
  const [formData, setFormData] = useState<CreateSpecimenRequest>(defaultFormData);

  const { data: specimens, isLoading } = useQuery({
    queryKey: ['admin', 'specimens', search, materialTypeFilter, page],
    queryFn: () => adminApi.getSpecimens(
      search || undefined,
      materialTypeFilter === 'all' ? undefined : materialTypeFilter,
      undefined,
      page,
      20
    ),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateSpecimenRequest) => adminApi.createSpecimen(data),
    onSuccess: () => {
      toast.success('Specimen created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'specimens'] });
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Failed to create specimen');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSpecimenRequest }) =>
      adminApi.updateSpecimen(id, data),
    onSuccess: () => {
      toast.success('Specimen updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'specimens'] });
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Failed to update specimen');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteSpecimen(id),
    onSuccess: () => {
      toast.success('Specimen deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'specimens'] });
      setIsDeleteDialogOpen(false);
      setSelectedSpecimen(null);
    },
    onError: () => {
      toast.error('Failed to delete specimen');
    },
  });

  const handleOpenCreate = () => {
    setSelectedSpecimen(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = async (specimen: SpecimenListDto) => {
    try {
      const detail = await adminApi.getSpecimen(specimen.id);
      setSelectedSpecimen(detail);
      setFormData({
        commonName: detail.commonName,
        scientificName: detail.scientificName || '',
        alias: detail.alias || '',
        rockFamily: detail.rockFamily || '',
        species: detail.species || '',
        variety: detail.variety || '',
        materialType: detail.materialType,
        mohsHardnessMin: detail.mohsHardnessMin ?? undefined,
        mohsHardnessMax: detail.mohsHardnessMax ?? undefined,
        tumblingDifficulty: detail.tumblingDifficulty || '',
        recommendedGritSequence: detail.recommendedGritSequence || '',
        specialConsiderations: detail.specialConsiderations || '',
        notes: detail.notes || '',
      });
      setIsDialogOpen(true);
    } catch {
      toast.error('Failed to load specimen details');
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedSpecimen(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.commonName.trim()) {
      toast.error('Common name is required');
      return;
    }

    if (selectedSpecimen) {
      updateMutation.mutate({
        id: selectedSpecimen.id,
        data: { ...formData, isActive: true },
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (specimen: SpecimenListDto) => {
    setSelectedSpecimen(specimen as unknown as SpecimenDetailDto);
    setIsDeleteDialogOpen(true);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Specimen Management</CardTitle>
              <CardDescription>Manage rock and mineral specimens in the database</CardDescription>
            </div>
            <Button onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Specimen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search specimens..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={materialTypeFilter}
              onValueChange={(v) => {
                setMaterialTypeFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Material Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {materialTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : specimens?.items.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No specimens found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Family</TableHead>
                    <TableHead>Hardness</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {specimens?.items.map((specimen) => (
                    <TableRow key={specimen.id}>
                      <TableCell className="font-medium">{specimen.commonName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{specimen.materialType}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {specimen.rockFamily || '-'}
                      </TableCell>
                      <TableCell>
                        {specimen.mohsHardnessMin != null ? (
                          specimen.mohsHardnessMax != null && specimen.mohsHardnessMax !== specimen.mohsHardnessMin
                            ? `${specimen.mohsHardnessMin}-${specimen.mohsHardnessMax}`
                            : specimen.mohsHardnessMin.toString()
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {specimen.tumblingDifficulty ? (
                          <Badge
                            variant={
                              specimen.tumblingDifficulty === 'Easy' ? 'default' :
                              specimen.tumblingDifficulty === 'Medium' ? 'secondary' : 'destructive'
                            }
                          >
                            {specimen.tumblingDifficulty}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(specimen)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(specimen)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {specimens && specimens.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {specimens.page} of {specimens.totalPages} ({specimens.totalCount} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(specimens.totalPages, p + 1))}
                      disabled={page === specimens.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedSpecimen ? 'Edit Specimen' : 'Add Specimen'}</DialogTitle>
            <DialogDescription>
              {selectedSpecimen ? 'Update specimen details' : 'Add a new specimen to the database'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="commonName">Common Name *</Label>
                <Input
                  id="commonName"
                  value={formData.commonName}
                  onChange={(e) => setFormData({ ...formData, commonName: e.target.value })}
                  placeholder="e.g., Agate"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scientificName">Scientific Name</Label>
                <Input
                  id="scientificName"
                  value={formData.scientificName}
                  onChange={(e) => setFormData({ ...formData, scientificName: e.target.value })}
                  placeholder="e.g., SiO2"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="alias">Alias</Label>
                <Input
                  id="alias"
                  value={formData.alias}
                  onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                  placeholder="Alternative names"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rockFamily">Rock Family</Label>
                <Input
                  id="rockFamily"
                  value={formData.rockFamily}
                  onChange={(e) => setFormData({ ...formData, rockFamily: e.target.value })}
                  placeholder="e.g., Quartz"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="materialType">Material Type</Label>
                <Select
                  value={formData.materialType}
                  onValueChange={(v) => setFormData({ ...formData, materialType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {materialTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mohsHardnessMin">Hardness Min</Label>
                <Input
                  id="mohsHardnessMin"
                  type="number"
                  step="0.5"
                  min="1"
                  max="10"
                  value={formData.mohsHardnessMin ?? ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    mohsHardnessMin: e.target.value ? parseFloat(e.target.value) : undefined,
                  })}
                  placeholder="1-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mohsHardnessMax">Hardness Max</Label>
                <Input
                  id="mohsHardnessMax"
                  type="number"
                  step="0.5"
                  min="1"
                  max="10"
                  value={formData.mohsHardnessMax ?? ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    mohsHardnessMax: e.target.value ? parseFloat(e.target.value) : undefined,
                  })}
                  placeholder="1-10"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tumblingDifficulty">Tumbling Difficulty</Label>
                <Select
                  value={formData.tumblingDifficulty || 'none'}
                  onValueChange={(v) => setFormData({ ...formData, tumblingDifficulty: v === 'none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {difficulties.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recommendedGritSequence">Recommended Grit Sequence</Label>
                <Input
                  id="recommendedGritSequence"
                  value={formData.recommendedGritSequence}
                  onChange={(e) => setFormData({ ...formData, recommendedGritSequence: e.target.value })}
                  placeholder="e.g., 60/90, 120/220, 400, Polish"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialConsiderations">Special Considerations</Label>
              <Textarea
                id="specialConsiderations"
                value={formData.specialConsiderations}
                onChange={(e) => setFormData({ ...formData, specialConsiderations: e.target.value })}
                placeholder="Any special handling instructions..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedSpecimen ? 'Save Changes' : 'Create Specimen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Specimen</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedSpecimen?.commonName}&quot;? This action
              will deactivate the specimen and it will no longer appear in searches.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedSpecimen && deleteMutation.mutate(selectedSpecimen.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
