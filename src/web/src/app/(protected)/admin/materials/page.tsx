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
import { Checkbox } from '@/components/ui/checkbox';
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
import type { MaterialDetailDto, MaterialListDto, CreateMaterialRequest, UpdateMaterialRequest } from '@/types/admin';

const categories = ['Abrasive', 'Additive', 'Media', 'Cleaning'];
const usageTypes = ['Coarse', 'Medium', 'Fine', 'PrePolish', 'Polish', 'Cleaning'];

const defaultFormData: CreateMaterialRequest = {
  commonName: '',
  category: 'Abrasive',
  materialType: '',
  materialSize: '',
  usageType: '',
  meshSize: 0,
  sortOrder: 0,
  isCleaning: false,
  notes: '',
};

export default function MaterialsAdminPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialDetailDto | null>(null);
  const [formData, setFormData] = useState<CreateMaterialRequest>(defaultFormData);

  const { data: materials, isLoading } = useQuery({
    queryKey: ['admin', 'materials', search, categoryFilter, page],
    queryFn: () => adminApi.getMaterials(
      search || undefined,
      categoryFilter === 'all' ? undefined : categoryFilter,
      undefined,
      page,
      20
    ),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateMaterialRequest) => adminApi.createMaterial(data),
    onSuccess: () => {
      toast.success('Material created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'materials'] });
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Failed to create material');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMaterialRequest }) =>
      adminApi.updateMaterial(id, data),
    onSuccess: () => {
      toast.success('Material updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'materials'] });
      handleCloseDialog();
    },
    onError: () => {
      toast.error('Failed to update material');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteMaterial(id),
    onSuccess: () => {
      toast.success('Material deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin', 'materials'] });
      setIsDeleteDialogOpen(false);
      setSelectedMaterial(null);
    },
    onError: () => {
      toast.error('Failed to delete material');
    },
  });

  const handleOpenCreate = () => {
    setSelectedMaterial(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = async (material: MaterialListDto) => {
    try {
      const detail = await adminApi.getMaterial(material.id);
      setSelectedMaterial(detail);
      setFormData({
        commonName: detail.commonName,
        category: detail.category,
        materialType: detail.materialType || '',
        materialSize: detail.materialSize || '',
        usageType: detail.usageType || '',
        meshSize: detail.meshSize,
        sortOrder: detail.sortOrder,
        isCleaning: detail.isCleaning,
        notes: detail.notes || '',
      });
      setIsDialogOpen(true);
    } catch {
      toast.error('Failed to load material details');
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedMaterial(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.commonName.trim()) {
      toast.error('Common name is required');
      return;
    }

    if (selectedMaterial) {
      updateMutation.mutate({
        id: selectedMaterial.id,
        data: { ...formData, isActive: true },
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (material: MaterialListDto) => {
    setSelectedMaterial(material as unknown as MaterialDetailDto);
    setIsDeleteDialogOpen(true);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Material Management</CardTitle>
              <CardDescription>Manage tumbling materials (grits, polishes, media)</CardDescription>
            </div>
            <Button onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Material
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search materials..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(v) => {
                setCategoryFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
          ) : materials?.items.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No materials found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Usage Type</TableHead>
                    <TableHead>Mesh Size</TableHead>
                    <TableHead>Sort Order</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials?.items.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{material.commonName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{material.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {material.usageType ? (
                          <Badge variant="secondary">{material.usageType}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{material.meshSize || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{material.sortOrder}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(material)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(material)}
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
              {materials && materials.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {materials.page} of {materials.totalPages} ({materials.totalCount} total)
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
                      onClick={() => setPage((p) => Math.min(materials.totalPages, p + 1))}
                      disabled={page === materials.totalPages}
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
            <DialogTitle>{selectedMaterial ? 'Edit Material' : 'Add Material'}</DialogTitle>
            <DialogDescription>
              {selectedMaterial ? 'Update material details' : 'Add a new tumbling material'}
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
                  placeholder="e.g., 60/90 Silicon Carbide"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="materialType">Material Type</Label>
                <Input
                  id="materialType"
                  value={formData.materialType}
                  onChange={(e) => setFormData({ ...formData, materialType: e.target.value })}
                  placeholder="e.g., Silicon Carbide"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="materialSize">Material Size</Label>
                <Input
                  id="materialSize"
                  value={formData.materialSize}
                  onChange={(e) => setFormData({ ...formData, materialSize: e.target.value })}
                  placeholder="e.g., 60/90"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="usageType">Usage Type</Label>
                <Select
                  value={formData.usageType || 'none'}
                  onValueChange={(v) => setFormData({ ...formData, usageType: v === 'none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {usageTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meshSize">Mesh Size</Label>
                <Input
                  id="meshSize"
                  type="number"
                  min="0"
                  value={formData.meshSize || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    meshSize: e.target.value ? parseInt(e.target.value) : 0,
                  })}
                  placeholder="e.g., 60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min="0"
                  value={formData.sortOrder || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    sortOrder: e.target.value ? parseInt(e.target.value) : 0,
                  })}
                  placeholder="e.g., 1"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isCleaning"
                checked={formData.isCleaning}
                onCheckedChange={(checked) => setFormData({ ...formData, isCleaning: checked as boolean })}
              />
              <Label htmlFor="isCleaning" className="text-sm">
                This is a cleaning material
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this material..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedMaterial ? 'Save Changes' : 'Create Material'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Material</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedMaterial?.commonName}&quot;? This action
              will deactivate the material and it will no longer appear in searches.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedMaterial && deleteMutation.mutate(selectedMaterial.id)}
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
