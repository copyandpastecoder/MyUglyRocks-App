'use client';

import * as React from 'react';
import { Plus, X, ChevronDown, ChevronRight, DollarSign, ChevronsUpDown, Search, Settings2, User, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { WeightInput } from '@/components/weight-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';  // Used for Condition dropdown
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
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
import { StarRating } from '@/components/star-rating';
import { useSpecimenSearch } from '@/hooks/use-user-specimens';
import { useSettings } from '@/hooks/use-user';
import { cn } from '@/lib/utils';
import type { InventoryCondition, InventoryStatus, SizeCategory } from '@/types/inventory';
import type { SpecimenOptionDto } from '@/types/user-specimen';

// Column visibility configuration - same as SpecimenMultiSelect
type ColumnKey = 'scientificName' | 'alias' | 'hardness' | 'difficulty' | 'materialType';

interface ColumnConfig {
  key: ColumnKey;
  label: string;
  defaultVisible: boolean;
}

const AVAILABLE_COLUMNS: ColumnConfig[] = [
  { key: 'scientificName', label: 'Scientific Name', defaultVisible: true },
  { key: 'alias', label: 'Alias', defaultVisible: true },
  { key: 'hardness', label: 'Hardness', defaultVisible: true },
  { key: 'difficulty', label: 'Tumbling Difficulty', defaultVisible: true },
  { key: 'materialType', label: 'Material Type', defaultVisible: false },
];

const STORAGE_KEY = 'specimen-dropdown-columns';

// Conversion constants for display only
const LB_TO_GRAMS = 453.592;
const KG_TO_GRAMS = 1000;

const CONDITIONS: { value: InventoryCondition; label: string }[] = [
  { value: 'Raw', label: 'Raw' },
  { value: 'PreShaped', label: 'Pre-shaped' },
  { value: 'Tumbled', label: 'Tumbled' },
  { value: 'Polished', label: 'Polished' },
  { value: 'Mixed', label: 'Mixed' },
];

const SIZE_CATEGORIES: { value: SizeCategory; label: string }[] = [
  { value: 'ZeroToOne', label: '0-1"' },
  { value: 'OneToTwo', label: '1"-2"' },
  { value: 'TwoToThree', label: '2"-3"' },
  { value: 'ThreeToFour', label: '3"-4"' },
  { value: 'FourToFive', label: '4"-5"' },
  { value: 'GreaterThanFive', label: '>5"' },
  { value: 'Assorted', label: 'Assorted' },
];

const STATUSES: { value: InventoryStatus; label: string }[] = [
  { value: 'Available', label: 'Available' },
  { value: 'InUse', label: 'In Use' },
  { value: 'Partial', label: 'Partial' },
  { value: 'Depleted', label: 'Depleted' },
];

export interface SpecimenRowItem {
  id: string; // unique row id
  specimenId?: string;
  userSpecimenId?: string;
  selectedId: string; // the id in the dropdown
  source: 'system' | 'user';
  commonName: string;
  scientificName?: string;
  tumblingDifficulty?: string;
  weightGrams: number | null;
  cost: number | null;
  condition: InventoryCondition;
  qualityRating: number | null;
  sizeCategories: SizeCategory[];
  notes?: string;
  status: InventoryStatus;
  storageLocation?: string;
  url?: string;
}

interface SpecimenRowListProps {
  specimens: SpecimenRowItem[];
  onSpecimensChange: (specimens: SpecimenRowItem[]) => void;
  onAddCustom?: () => void;
  error?: string | null;
}

// Session storage key for metric preference - shared with WeightInput
const METRIC_STATE_KEY = 'weightInput_metric';

export function SpecimenRowList({
  specimens,
  onSpecimensChange,
  onAddCustom,
  error,
}: SpecimenRowListProps) {
  const { data: settings } = useSettings();
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());
  // Track which row's dropdown is open
  const [openDropdownId, setOpenDropdownId] = React.useState<string | null>(null);
  // Search query for specimen dropdown
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

  // Read metric preference from sessionStorage (shared with WeightInput)
  // Re-check on each render to stay in sync with WeightInput toggles
  const isMetric = React.useMemo(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(METRIC_STATE_KEY);
      if (saved !== null) {
        return saved === 'true';
      }
    }
    // Fall back to user settings
    return settings?.measurementSystem === 'Metric';
  }, [settings?.measurementSystem]);

  // Column visibility state - load from localStorage (shared with SpecimenMultiSelect)
  const [visibleColumns, setVisibleColumns] = React.useState<Record<ColumnKey, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Invalid JSON, use defaults
        }
      }
    }
    // Default visibility
    return AVAILABLE_COLUMNS.reduce((acc, col) => {
      acc[col.key] = col.defaultVisible;
      return acc;
    }, {} as Record<ColumnKey, boolean>);
  });

  // Save column visibility to localStorage
  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns((prev) => {
      const newState = { ...prev, [key]: !prev[key] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  };

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch specimens for dropdown - use debounced search
  const { data: specimenOptions = [], isLoading: isLoadingSpecimens } = useSpecimenSearch(debouncedSearch, true);

  // Group specimens by source for dropdown
  const groupedSpecimens = React.useMemo(() => {
    const system = specimenOptions.filter(s => s.source === 'system');
    const user = specimenOptions.filter(s => s.source === 'user');
    return { system, user };
  }, [specimenOptions]);

  // Calculate totals
  const totals = React.useMemo(() => {
    const validSpecimens = specimens.filter(s => s.selectedId);
    const totalWeightGrams = validSpecimens
      .filter(s => s.weightGrams != null)
      .reduce((sum, s) => sum + (s.weightGrams || 0), 0);
    const totalCost = validSpecimens
      .filter(s => s.cost != null)
      .reduce((sum, s) => sum + (s.cost || 0), 0);
    const qualityRatings = validSpecimens
      .filter(s => s.qualityRating != null)
      .map(s => s.qualityRating!);
    const avgQuality = qualityRatings.length > 0
      ? Math.round(qualityRatings.reduce((a, b) => a + b, 0) / qualityRatings.length)
      : null;
    const allSizes = Array.from(new Set(
      validSpecimens.flatMap(s => s.sizeCategories)
    )).sort();

    return { totalWeightGrams, totalCost, avgQuality, allSizes, count: validSpecimens.length };
  }, [specimens]);

  // Format total weight for display
  const formatTotalWeight = (): string => {
    const grams = totals.totalWeightGrams;
    if (grams === 0) return '0';
    if (isMetric) {
      const kg = Math.floor(grams / KG_TO_GRAMS);
      const g = Math.round(grams % KG_TO_GRAMS);
      if (kg > 0 && g > 0) return `${kg} kg ${g} g`;
      if (kg > 0) return `${kg} kg`;
      return `${g} g`;
    } else {
      const OZ_TO_GRAMS = 28.3495;
      const totalOz = grams / OZ_TO_GRAMS;
      const lbs = Math.floor(totalOz / 16);
      const oz = Math.round((totalOz % 16) * 10) / 10;
      if (lbs > 0 && oz > 0) return `${lbs} lbs ${oz} oz`;
      if (lbs > 0) return `${lbs} lbs`;
      return `${oz} oz`;
    }
  };

  // Auto-expand newly added rows (but not on initial load)
  const prevSpecimensLengthRef = React.useRef(specimens.length);
  const isInitialLoadRef = React.useRef(true);
  React.useEffect(() => {
    // Skip auto-expand on initial load (when specimens go from 0 to N)
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      prevSpecimensLengthRef.current = specimens.length;
      return;
    }
    if (specimens.length > prevSpecimensLengthRef.current) {
      // A new row was added by the user, expand it
      const newRow = specimens[specimens.length - 1];
      if (newRow) {
        setExpandedRows(prev => new Set(prev).add(newRow.id));
      }
    }
    prevSpecimensLengthRef.current = specimens.length;
  }, [specimens.length, specimens]);

  // Add a new empty row
  const addRow = () => {
    const newRow: SpecimenRowItem = {
      id: crypto.randomUUID(),
      selectedId: '',
      source: 'system',
      commonName: '',
      weightGrams: null,
      cost: null,
      condition: 'Raw',
      qualityRating: null,
      sizeCategories: [],
      status: 'Available',
      storageLocation: undefined,
      url: undefined,
    };
    onSpecimensChange([...specimens, newRow]);
  };

  // Remove a row
  // Check if a specimen row has any values filled in
  const hasValues = (row: SpecimenRowItem): boolean => {
    return !!(
      row.selectedId ||
      row.weightGrams ||
      row.cost ||
      row.qualityRating ||
      row.sizeCategories.length > 0 ||
      row.notes
    );
  };

  // Request to remove a row - show confirmation if it has values
  const requestRemoveRow = (rowId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const row = specimens.find(s => s.id === rowId);
    if (row && hasValues(row)) {
      setDeleteConfirmId(rowId);
    } else {
      removeRow(rowId);
    }
  };

  // Actually remove a row
  const removeRow = (rowId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.delete(rowId);
      return next;
    });
    onSpecimensChange(specimens.filter(s => s.id !== rowId));
    setDeleteConfirmId(null);
  };

  // Toggle row expansion
  const toggleExpanded = (rowId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  // Update specimen selection in a row
  const updateSpecimen = (rowId: string, selectedId: string) => {
    const option = specimenOptions.find(o => o.id === selectedId);
    if (!option) return;

    onSpecimensChange(
      specimens.map(s =>
        s.id === rowId
          ? {
              ...s,
              selectedId,
              specimenId: option.source === 'system' ? option.id : undefined,
              userSpecimenId: option.source === 'user' ? option.id : undefined,
              source: option.source,
              commonName: option.commonName,
              scientificName: option.scientificName ?? undefined,
              tumblingDifficulty: option.tumblingDifficulty ?? undefined,
            }
          : s
      )
    );
  };

  // Update field in a row
  const updateField = <K extends keyof SpecimenRowItem>(
    rowId: string,
    field: K,
    value: SpecimenRowItem[K]
  ) => {
    onSpecimensChange(
      specimens.map(s => (s.id === rowId ? { ...s, [field]: value } : s))
    );
  };

  // Toggle size category
  const toggleSize = (rowId: string, size: SizeCategory) => {
    const row = specimens.find(s => s.id === rowId);
    if (!row) return;

    const currentSizes = row.sizeCategories;
    const newSizes = currentSizes.includes(size)
      ? currentSizes.filter(s => s !== size)
      : [...currentSizes, size];

    updateField(rowId, 'sizeCategories', newSizes);
  };

  // Render a specimen option in the dropdown
  const renderSpecimenOption = (specimen: SpecimenOptionDto, rowId: string) => {
    // Build secondary info line based on visible columns
    const secondaryParts: React.ReactNode[] = [];
    if (visibleColumns.scientificName && specimen.scientificName) {
      secondaryParts.push(<span key="sci" className="italic">{specimen.scientificName}</span>);
    }
    if (visibleColumns.alias && specimen.alias) {
      secondaryParts.push(<span key="alias">aka &quot;{specimen.alias}&quot;</span>);
    }
    if (visibleColumns.materialType) {
      secondaryParts.push(<span key="mat">{specimen.materialType}</span>);
    }

    return (
      <CommandItem
        key={`${specimen.source}-${specimen.id}`}
        value={`${specimen.commonName} ${specimen.scientificName || ''} ${specimen.alias || ''}`}
        onSelect={() => {
          updateSpecimen(rowId, specimen.id);
          setOpenDropdownId(null);
          setSearchQuery('');
        }}
        className="flex items-center gap-2 cursor-pointer"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{specimen.commonName}</span>
            {specimen.source === 'user' && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                <User className="h-3 w-3 mr-0.5" />
                {specimen.isOwned ? 'Mine' : 'Public'}
              </Badge>
            )}
          </div>
          {secondaryParts.length > 0 && (
            <div className="text-xs text-muted-foreground truncate">
              {secondaryParts.map((part, i) => (
                <React.Fragment key={i}>
                  {i > 0 && ' • '}
                  {part}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-0.5 text-xs text-muted-foreground">
          {visibleColumns.difficulty && (
            <span className="w-16 text-right">{specimen.tumblingDifficulty || '-'}</span>
          )}
          {visibleColumns.hardness && specimen.mohsHardnessMax && (
            <span className="w-16 text-right text-[10px]">H: {specimen.mohsHardnessMax}</span>
          )}
        </div>
      </CommandItem>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Specimens *</Label>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="h-4 w-4 mr-1" />
          Add Specimen
        </Button>
      </div>

      {/* Summary Header - shows above specimen rows */}
      {specimens.length > 0 && totals.count > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground pb-2 border-b">
          <span className="font-medium">
            {totals.count} specimen{totals.count !== 1 ? 's' : ''}
          </span>
          <span>Weight: {formatTotalWeight()}</span>
          {totals.totalCost > 0 && (
            <span>Cost: ${totals.totalCost.toFixed(2)}</span>
          )}
          {totals.avgQuality && (
            <span>Avg Quality: {totals.avgQuality}★</span>
          )}
          {totals.allSizes.length > 0 && (
            <span>
              Sizes: {totals.allSizes.map(s => SIZE_CATEGORIES.find(sc => sc.value === s)?.label).join(', ')}
            </span>
          )}
        </div>
      )}

      {specimens.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
          No specimens added yet. Click &quot;Add Specimen&quot; to add rock/mineral types.
        </p>
      ) : (
        <div className="space-y-2">
          {specimens.map((row) => {
            const isExpanded = expandedRows.has(row.id);

            return (
              <Collapsible
                key={row.id}
                open={isExpanded}
                onOpenChange={() => toggleExpanded(row.id)}
              >
                <div className="border rounded-lg overflow-hidden">
                  {/* Collapsed Header */}
                  <CollapsibleTrigger asChild>
                    <div
                      className={cn(
                        'flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50 transition-colors',
                        isExpanded && 'bg-muted/30 border-b'
                      )}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}

                      {/* Specimen dropdown - prevent collapsible toggle */}
                      <div
                        className="flex-1 min-w-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Popover
                          open={openDropdownId === row.id}
                          onOpenChange={(open) => {
                            setOpenDropdownId(open ? row.id : null);
                            if (!open) setSearchQuery('');
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openDropdownId === row.id}
                              className="w-full justify-between"
                            >
                              <span className={cn(!row.selectedId && 'text-muted-foreground')}>
                                {row.selectedId ? row.commonName : 'Select specimen...'}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                            <Command shouldFilter={false}>
                              <div className="flex items-center border-b px-3">
                                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                <input
                                  placeholder="Search specimens..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                {/* Column selector dropdown */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-1">
                                      <Settings2 className="h-4 w-4" />
                                      <span className="sr-only">Toggle columns</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuLabel>Show Columns</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {AVAILABLE_COLUMNS.map((column) => (
                                      <DropdownMenuCheckboxItem
                                        key={column.key}
                                        checked={visibleColumns[column.key]}
                                        onCheckedChange={() => toggleColumn(column.key)}
                                      >
                                        {column.label}
                                      </DropdownMenuCheckboxItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              <CommandList>
                                {/* Add Custom Specimen Button */}
                                {onAddCustom && (
                                  <>
                                    <CommandGroup>
                                      <CommandItem
                                        onSelect={() => {
                                          setOpenDropdownId(null);
                                          setSearchQuery('');
                                          onAddCustom();
                                        }}
                                        className="flex items-center gap-2 cursor-pointer text-primary"
                                      >
                                        <Plus className="h-4 w-4" />
                                        <span>Add Custom Specimen</span>
                                      </CommandItem>
                                    </CommandGroup>
                                    <CommandSeparator />
                                  </>
                                )}

                                {isLoadingSpecimens ? (
                                  <div className="py-6 text-center text-sm text-muted-foreground">
                                    Loading specimens...
                                  </div>
                                ) : specimenOptions.length === 0 ? (
                                  <CommandEmpty>
                                    <div className="text-center py-6">
                                      <p className="text-muted-foreground">No specimens found.</p>
                                      {onAddCustom && (
                                        <Button
                                          variant="link"
                                          size="sm"
                                          onClick={() => {
                                            setOpenDropdownId(null);
                                            setSearchQuery('');
                                            onAddCustom();
                                          }}
                                          className="mt-2"
                                        >
                                          <Plus className="h-4 w-4 mr-1" />
                                          Add a custom specimen
                                        </Button>
                                      )}
                                    </div>
                                  </CommandEmpty>
                                ) : (
                                  <>
                                    {/* Your Specimens Section */}
                                    {groupedSpecimens.user.length > 0 && (
                                      <CommandGroup heading="Your Specimens" className="max-h-[120px] overflow-auto">
                                        {groupedSpecimens.user.map((opt) => renderSpecimenOption(opt, row.id))}
                                      </CommandGroup>
                                    )}

                                    {groupedSpecimens.user.length > 0 &&
                                      groupedSpecimens.system.length > 0 && <CommandSeparator />}

                                    {/* Reference Specimens Section */}
                                    {groupedSpecimens.system.length > 0 && (
                                      <CommandGroup heading="Reference Specimens" className="max-h-[200px] overflow-auto">
                                        {groupedSpecimens.system.map((opt) => renderSpecimenOption(opt, row.id))}
                                      </CommandGroup>
                                    )}
                                  </>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Summary badges when collapsed */}
                      {!isExpanded && row.selectedId && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {row.tumblingDifficulty && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {row.tumblingDifficulty}
                            </Badge>
                          )}
                          {row.weightGrams && (
                            <span>
                              {isMetric
                                ? `${(row.weightGrams / KG_TO_GRAMS).toFixed(2)} kg`
                                : `${(row.weightGrams / LB_TO_GRAMS).toFixed(2)} lbs`}
                            </span>
                          )}
                          {row.cost && (
                            <span>${row.cost.toFixed(2)}</span>
                          )}
                        </div>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={(e) => requestRemoveRow(row.id, e)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CollapsibleTrigger>

                  {/* Expanded Content */}
                  <CollapsibleContent>
                    <div className="p-4 space-y-4">
                      {/* Secondary info line */}
                      {row.selectedId && (row.scientificName || row.tumblingDifficulty) && (
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          {row.scientificName && (
                            <span className="italic">{row.scientificName}</span>
                          )}
                          {row.tumblingDifficulty && (
                            <Badge variant="secondary" className="text-xs">
                              {row.tumblingDifficulty}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Row 1: Weight and Cost */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Weight */}
                        <div>
                          <WeightInput
                            label="Weight"
                            valueGrams={row.weightGrams}
                            onValueChange={(grams) => updateField(row.id, 'weightGrams', grams)}
                          />
                        </div>

                        {/* Cost */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">Cost</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={row.cost ?? ''}
                              onChange={(e) =>
                                updateField(
                                  row.id,
                                  'cost',
                                  e.target.value ? parseFloat(e.target.value) : null
                                )
                              }
                              className="h-8 text-sm pl-7"
                            />
                          </div>
                        </div>

                        {/* Condition */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">Condition</Label>
                          <Select
                            value={row.condition}
                            onValueChange={(value) =>
                              updateField(row.id, 'condition', value as InventoryCondition)
                            }
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CONDITIONS.map(({ value, label }) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Row 2: Quality and Size Categories */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Quality */}
                        <div className="space-y-1.5">
                          <StarRating
                            label="Quality"
                            value={row.qualityRating}
                            onChange={(val) => updateField(row.id, 'qualityRating', val)}
                            size="sm"
                          />
                        </div>

                        {/* Size Categories */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">Size Categories</Label>
                          <div className="flex flex-wrap gap-1.5">
                            {SIZE_CATEGORIES.map(({ value, label }) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => toggleSize(row.id, value)}
                                className={cn(
                                  'px-2 py-0.5 text-xs rounded-md border transition-colors',
                                  row.sizeCategories.includes(value)
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background hover:bg-muted border-input'
                                )}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Row 3: Status, Storage Location, URL */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Status */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">Status</Label>
                          <Select
                            value={row.status}
                            onValueChange={(value) =>
                              updateField(row.id, 'status', value as InventoryStatus)
                            }
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUSES.map(({ value, label }) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Storage Location */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">Storage Location</Label>
                          <Input
                            placeholder="e.g., Shelf A, Bin 3"
                            value={row.storageLocation || ''}
                            onChange={(e) =>
                              updateField(row.id, 'storageLocation', e.target.value || undefined)
                            }
                            className="h-8 text-sm"
                          />
                        </div>

                        {/* URL */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">URL</Label>
                          <Input
                            type="url"
                            placeholder="https://..."
                            value={row.url || ''}
                            onChange={(e) =>
                              updateField(row.id, 'url', e.target.value || undefined)
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="space-y-1.5">
                        <Label className="text-xs">Notes</Label>
                        <Textarea
                          placeholder="Notes about this specimen..."
                          className="min-h-[60px] text-sm resize-none"
                          value={row.notes || ''}
                          onChange={(e) => updateField(row.id, 'notes', e.target.value || undefined)}
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      )}

      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Remove Specimen
            </AlertDialogTitle>
            <AlertDialogDescription>
              This specimen has data entered. Are you sure you want to remove it? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && removeRow(deleteConfirmId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
