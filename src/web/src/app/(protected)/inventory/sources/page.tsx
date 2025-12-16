'use client';

import { useState, useRef } from 'react';
import { useInventorySources, useDeleteInventorySource } from '@/hooks/use-inventory-sources';
import { useDebouncedValue } from '@/hooks';
import { PAGE_CONTAINER } from '@/lib/layout';
import { Button } from '@/components/ui/button';
import { FullPageSkeleton } from '@/components/skeletons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Store,
  Globe,
  Mountain,
  Users,
  Sparkles,
  MoreHorizontal,
  MoreVertical,
  Pencil,
  Trash2,
  Search,
  MapPin,
  ShoppingBag,
  Calendar,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { InventorySourceListDto, InventorySourceType } from '@/types/inventory-source';
import { sourceTypeDisplayNames } from '@/types/inventory-source';
import { InventorySourceFormDialog } from '@/components/inventory-source-form-dialog';

const SOURCE_TYPE_ICONS: Record<InventorySourceType, React.ComponentType<{ className?: string }>> = {
  Store: Store,
  Online: Globe,
  Found: Mountain,
  Contact: Users,
  GemShow: Sparkles,
  Other: MoreHorizontal,
};

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function InventorySourcesPage() {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editSource, setEditSource] = useState<InventorySourceListDto | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<InventorySourceType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'totalPurchases' | 'lastPurchaseDate'>('name');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebouncedValue(search, 300);

  const filters = {
    sourceType: activeTab === 'all' ? undefined : activeTab,
    search: debouncedSearch || undefined,
    sortBy,
    sortOrder: sortBy === 'name' ? 'asc' as const : 'desc' as const,
    isActive: true,
  };

  const { data: sources, isLoading, isFetching, isPlaceholderData } = useInventorySources(filters);
  const deleteMutation = useDeleteInventorySource();

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

  const renderSourceRow = (source: InventorySourceListDto) => {
    const Icon = SOURCE_TYPE_ICONS[source.sourceType];
    return (
      <div
        key={source.inventorySourceId}
        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
        onClick={() => setEditSource(source)}
      >
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{source.name}</p>
              {!source.isActive && (
                <Badge variant="secondary" className="text-xs">Inactive</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{sourceTypeDisplayNames[source.sourceType]}</span>
              {source.location && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3" />
                  {source.location}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="flex items-center gap-1 text-sm">
              <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{source.totalPurchases} purchase{source.totalPurchases !== 1 ? 's' : ''}</span>
            </div>
            {source.lastPurchaseDate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Last: {formatDate(source.lastPurchaseDate)}
              </div>
            )}
          </div>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onSelect={() => setEditSource(source)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {source.totalPurchases > 0 ? (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4 opacity-50" />
                    <span className="opacity-50">Delete</span>
                  </div>
                  <p className="text-xs mt-1 text-muted-foreground/70">
                    Remove {source.totalPurchases} linked inventor{source.totalPurchases === 1 ? 'y' : 'ies'} first
                  </p>
                </div>
              ) : (
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onSelect={() => handleDelete(source.inventorySourceId)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  if (isLoading && !isPlaceholderData && !sources) {
    return <FullPageSkeleton withTabs cardCount={3} />;
  }

  return (
    <PageTransition>
      <div className={PAGE_CONTAINER}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sources</h1>
            <p className="text-muted-foreground">Manage where you acquire specimens</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Source
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search sources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-10"
            />
            {isFetching && search && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
            )}
          </div>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="totalPurchases">Total Purchases</SelectItem>
              <SelectItem value="lastPurchaseDate">Last Purchase</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="Store">Store</TabsTrigger>
            <TabsTrigger value="Online">Online</TabsTrigger>
            <TabsTrigger value="Found">Found</TabsTrigger>
            <TabsTrigger value="Contact">Contact</TabsTrigger>
            <TabsTrigger value="GemShow">Gem Show</TabsTrigger>
            <TabsTrigger value="Other">Other</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {sources?.length === 0 ? (
              <div className="border rounded-lg border-dashed py-12 text-center">
                <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-1">No sources found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {activeTab === 'all'
                    ? 'Add your first source to track where you acquire specimens'
                    : `No ${sourceTypeDisplayNames[activeTab as InventorySourceType].toLowerCase()} sources`}
                </p>
                {activeTab === 'all' && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Source
                  </Button>
                )}
              </div>
            ) : (
              <StaggerContainer className="space-y-2">
                {sources?.map((source) => (
                  <StaggerItem key={source.inventorySourceId}>
                    {renderSourceRow(source)}
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </TabsContent>
        </Tabs>

        {/* Create/Edit Dialog */}
        <InventorySourceFormDialog
          open={showCreateDialog || !!editSource}
          onOpenChange={(open) => {
            if (!open) {
              setShowCreateDialog(false);
              setEditSource(null);
            }
          }}
          source={editSource}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Source</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this source? This action cannot be undone.
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
