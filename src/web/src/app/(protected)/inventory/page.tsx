'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useInventory, useInventoryStats, useDeleteInventory, useUpdateInventoryStatus } from '@/hooks/use-inventory';
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
  Package,
  MoreVertical,
  Pencil,
  Trash2,
  Star,
  Search,
  DollarSign,
  Scale,
  CheckCircle,
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
import Link from 'next/link';
import type { InventoryListDto, InventoryStatus, SourceType } from '@/types/inventory';
import {
  INVENTORY_STATUS_COLORS,
  INVENTORY_STATUS_LABELS,
} from '@/lib/inventory-constants';

const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  Store: 'Store',
  Online: 'Online',
  Found: 'Found',
  Gift: 'Gift',
  Trade: 'Trade',
  Other: 'Other',
};

function formatWeight(grams: number | null, unit: string): string {
  if (grams === null) return '-';
  let value = grams;
  if (unit === 'oz') value = grams / 28.3495;
  else if (unit === 'lb') value = grams / 453.592;
  return `${value.toFixed(1)} ${unit}`;
}

function formatCost(cost: number | null): string {
  if (cost === null) return '-';
  return `$${cost.toFixed(2)}`;
}

export default function InventoryPage() {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<InventoryStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'acquiredDate' | 'name' | 'cost'>('acquiredDate');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hasLoadedOnce = useRef(false);

  // Debounce search to avoid API call on every keystroke
  const debouncedSearch = useDebouncedValue(search, 300);

  const filters = {
    status: activeTab === 'all' ? undefined : activeTab,
    search: debouncedSearch || undefined,
    sortBy,
    sortOrder: 'desc' as const,
  };

  const { data: inventory, isLoading, isFetching } = useInventory(filters);

  // Track when we've loaded data at least once
  useEffect(() => {
    if (!isLoading && inventory) {
      hasLoadedOnce.current = true;
    }
  }, [isLoading, inventory]);
  const { data: stats } = useInventoryStats();
  const deleteMutation = useDeleteInventory();
  const updateStatusMutation = useUpdateInventoryStatus();

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

  const handleMarkDepleted = (id: string) => {
    updateStatusMutation.mutate({
      id,
      data: { status: 'Depleted' },
    });
  };

  const renderInventoryRow = (item: InventoryListDto) => {
    return (
      <div
        key={item.inventoryId}
        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
      >
        <Link href={`/inventory/${item.inventoryId}`} className="flex-1 min-w-0 flex items-center gap-3">
          {item.coverPhotoThumbnailUrl ? (
            <img
              src={item.coverPhotoThumbnailUrl}
              alt={item.name}
              className="w-12 h-12 rounded object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{item.name}</p>
              {item.isFavorite && <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {SOURCE_TYPE_LABELS[item.sourceType]}
              {item.sourceName && ` · ${item.sourceName}`}
              {item.specimenCount > 0 && ` · ${item.specimenCount} specimen${item.specimenCount !== 1 ? 's' : ''}`}
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{formatWeight(item.remainingWeightGrams, item.displayUnit)}</p>
            <p className="text-xs text-muted-foreground">{formatCost(item.cost)}</p>
          </div>
          <Badge variant="secondary" className={INVENTORY_STATUS_COLORS[item.status]}>
            {INVENTORY_STATUS_LABELS[item.status]}
          </Badge>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => router.push(`/inventory/${item.inventoryId}`)}>
                <Pencil className="mr-2 h-4 w-4" />
                View/Edit
              </DropdownMenuItem>
              {item.status !== 'Depleted' && (
                <DropdownMenuItem onSelect={() => handleMarkDepleted(item.inventoryId)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Depleted
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onSelect={() => handleDelete(item.inventoryId)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  // Only show full page skeleton on initial load, not on subsequent searches
  if (isLoading && !hasLoadedOnce.current) {
    return <FullPageSkeleton withTabs cardCount={3} />;
  }

  return (
    <PageTransition>
      <div className={PAGE_CONTAINER}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
            <p className="text-muted-foreground">Track your rock and specimen collection</p>
          </div>
          <Button asChild>
            <Link href="/inventory/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Inventory
            </Link>
          </Button>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Package className="h-4 w-4" />
                Total Items
              </div>
              <p className="text-xl font-semibold mt-1">{stats.totalItems}</p>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Scale className="h-4 w-4" />
                Total Weight
              </div>
              <p className="text-xl font-semibold mt-1">{formatWeight(stats.totalWeightGrams, 'lb')}</p>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <DollarSign className="h-4 w-4" />
                Total Invested
              </div>
              <p className="text-xl font-semibold mt-1">{formatCost(stats.totalInvested)}</p>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <CheckCircle className="h-4 w-4" />
                Available
              </div>
              <p className="text-xl font-semibold mt-1">{stats.availableCount}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-10"
            />
            {isFetching && search && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
            )}
          </div>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="acquiredDate">Date Acquired</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="cost">Cost</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="Available">Available</TabsTrigger>
            <TabsTrigger value="InUse">In Use</TabsTrigger>
            <TabsTrigger value="Depleted">Depleted</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {inventory?.length === 0 ? (
              <div className="border rounded-lg border-dashed py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-1">No inventory items</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {activeTab === 'all'
                    ? 'Start tracking your rock collection'
                    : `No ${INVENTORY_STATUS_LABELS[activeTab as InventoryStatus].toLowerCase()} items`}
                </p>
                {activeTab === 'all' && (
                  <Button asChild>
                    <Link href="/inventory/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Inventory
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <StaggerContainer className="space-y-2">
                {inventory?.map((item) => (
                  <StaggerItem key={item.inventoryId}>
                    {renderInventoryRow(item)}
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </TabsContent>
        </Tabs>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Inventory Item</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this inventory item? This action cannot be undone.
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
