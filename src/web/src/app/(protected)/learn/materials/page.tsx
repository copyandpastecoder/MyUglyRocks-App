'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { materialApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Search, Sparkles, AlertCircle } from 'lucide-react';
import type { MaterialListDto, MaterialDetailDto } from '@/types/reference';

const CATEGORIES = ['Abrasive', 'Polish', 'Media', 'Additive'];
const USAGE_TYPES = ['Coarse', 'Medium', 'Fine', 'PrePolish', 'Polish', 'Burnish'];

function getCategoryColor(category: string): string {
  switch (category?.toLowerCase()) {
    case 'abrasive': return 'bg-blue-100 text-blue-800';
    case 'polish': return 'bg-purple-100 text-purple-800';
    case 'media': return 'bg-green-100 text-green-800';
    case 'additive': return 'bg-orange-100 text-orange-800';
    default: return 'bg-muted text-muted-foreground';
  }
}

function getUsageColor(usage: string | null): string {
  switch (usage?.toLowerCase()) {
    case 'coarse': return 'bg-red-100 text-red-800';
    case 'medium': return 'bg-orange-100 text-orange-800';
    case 'fine': return 'bg-yellow-100 text-yellow-800';
    case 'prepolish': return 'bg-lime-100 text-lime-800';
    case 'polish': return 'bg-green-100 text-green-800';
    case 'burnish': return 'bg-teal-100 text-teal-800';
    default: return 'bg-muted text-muted-foreground';
  }
}

export default function MaterialsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('__all__');
  const [usageType, setUsageType] = useState<string>('__all__');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: materials, isLoading, error } = useQuery({
    queryKey: ['materials', { query: search, category, usageType }],
    queryFn: () => materialApi.getAll({
      query: search || undefined,
      category: category === '__all__' ? undefined : category,
      usageType: usageType === '__all__' ? undefined : usageType,
    }),
  });

  const { data: selectedMaterial } = useQuery({
    queryKey: ['material', selectedId],
    queryFn: () => materialApi.getById(selectedId!),
    enabled: !!selectedId,
  });

  // Group materials by category for display
  const groupedMaterials = materials?.reduce((acc, material) => {
    const cat = material.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(material);
    return acc;
  }, {} as Record<string, MaterialListDto[]>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Grits & Polishes</h1>
        <p className="text-muted-foreground">
          Reference guide for tumbling materials and their uses
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search materials..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Categories</SelectItem>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={usageType} onValueChange={setUsageType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Stages</SelectItem>
                  {USAGE_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-4 py-6">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div>
              <p className="font-medium">Error loading materials</p>
              <p className="text-sm text-muted-foreground">Please try again later</p>
            </div>
          </CardContent>
        </Card>
      ) : materials?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No materials found</h3>
            <p className="text-muted-foreground text-center">
              Try adjusting your search or filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedMaterials && Object.entries(groupedMaterials).map(([cat, items]) => (
            <Card key={cat}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className={getCategoryColor(cat)}>{cat}</Badge>
                  <span className="text-muted-foreground text-sm font-normal">
                    ({items.length} items)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead className="text-right">Mesh Size</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((material) => (
                      <TableRow
                        key={material.materialId}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedId(material.materialId)}
                      >
                        <TableCell className="font-medium">
                          {material.commonName}
                        </TableCell>
                        <TableCell>
                          {material.materialType || '-'}
                        </TableCell>
                        <TableCell>
                          {material.usageType && (
                            <Badge className={getUsageColor(material.usageType)}>
                              {material.usageType}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {material.meshSize > 0 ? `${material.meshSize} mesh` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-w-3xl">
          {selectedMaterial && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedMaterial.commonName}</DialogTitle>
                <DialogDescription>
                  {selectedMaterial.materialType || selectedMaterial.category}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className={getCategoryColor(selectedMaterial.category)}>
                    {selectedMaterial.category}
                  </Badge>
                  {selectedMaterial.usageType && (
                    <Badge className={getUsageColor(selectedMaterial.usageType)}>
                      {selectedMaterial.usageType}
                    </Badge>
                  )}
                  {selectedMaterial.isCleaning && (
                    <Badge variant="outline">Cleaning</Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {selectedMaterial.materialType && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Material Type</p>
                      <p className="text-sm">{selectedMaterial.materialType}</p>
                    </div>
                  )}

                  {selectedMaterial.materialSize && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Size</p>
                      <p className="text-sm">{selectedMaterial.materialSize}</p>
                    </div>
                  )}

                  {selectedMaterial.meshSize > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Mesh Size</p>
                      <p className="text-sm">{selectedMaterial.meshSize}</p>
                    </div>
                  )}
                </div>

                {selectedMaterial.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notes</p>
                    <p className="text-sm">{selectedMaterial.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
