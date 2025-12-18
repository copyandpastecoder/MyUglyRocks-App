'use client';

import * as React from 'react';
import { X, Search, AlertTriangle, Plus, User, Package, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSpecimenSearch } from '@/hooks/use-user-specimens';
import { useAvailableInventorySpecimens, type AvailableInventorySpecimen } from '@/hooks/use-available-inventory-specimens';
import type { SpecimenOptionDto } from '@/types/user-specimen';
import { type SpecimenSelection, type SpecimenSelectProps } from './types';

export function SpecimenSelectMobile({
  selectedItems,
  onSelectionChange,
  placeholder = 'Select specimens...',
  disabled = false,
  onAddCustom,
  includePublicSpecimens = true,
  enableInventoryMode = false,
}: SpecimenSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [inventoryMode, setInventoryMode] = React.useState(false);

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch combined specimens (system + user + public) - for normal mode
  const { data: specimens = [], isLoading } = useSpecimenSearch(debouncedSearch, includePublicSpecimens);

  // Fetch inventory specimens - for inventory mode
  const { data: inventoryGroups = [], isLoading: isLoadingInventory } = useAvailableInventorySpecimens();

  // Group specimens by source
  const groupedSpecimens = React.useMemo(() => {
    const userSpecimens: SpecimenOptionDto[] = [];
    const systemSpecimens: SpecimenOptionDto[] = [];

    specimens.forEach((specimen) => {
      if (specimen.source === 'user' && specimen.isOwned) {
        userSpecimens.push(specimen);
      } else if (specimen.source === 'system') {
        systemSpecimens.push(specimen);
      } else {
        systemSpecimens.push(specimen);
      }
    });

    return { userSpecimens, systemSpecimens };
  }, [specimens]);

  const selectedSpecimens = React.useMemo(() => {
    return specimens.filter((s) =>
      selectedItems.some((item) =>
        item.id === s.id && item.source === s.source && !item.inventorySpecimenId
      )
    );
  }, [specimens, selectedItems]);

  // Calculate hardness warning
  const hardnessWarning = React.useMemo(() => {
    if (selectedSpecimens.length < 2) return null;

    const hardnessValues = selectedSpecimens
      .map((s) => s.mohsHardnessMax)
      .filter((h): h is number => h !== null);

    if (hardnessValues.length < 2) return null;

    const minHardness = Math.min(...hardnessValues);
    const maxHardness = Math.max(...hardnessValues);
    const difference = maxHardness - minHardness;

    if (difference > 1) {
      return {
        difference: difference.toFixed(1),
        min: minHardness,
        max: maxHardness,
      };
    }
    return null;
  }, [selectedSpecimens]);

  const handleToggle = (specimen: SpecimenOptionDto) => {
    const selection: SpecimenSelection = { id: specimen.id, source: specimen.source };
    const isSelected = selectedItems.some(
      (item) => item.id === specimen.id && item.source === specimen.source && !item.inventorySpecimenId
    );

    if (isSelected) {
      onSelectionChange(
        selectedItems.filter((item) =>
          item.inventorySpecimenId || item.id !== specimen.id || item.source !== specimen.source
        )
      );
    } else {
      onSelectionChange([...selectedItems, selection]);
    }
  };

  const handleRemove = (id: string, source: 'system' | 'user') => {
    onSelectionChange(
      selectedItems.filter((item) =>
        item.inventorySpecimenId || item.id !== id || item.source !== source
      )
    );
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const isSelected = (specimen: SpecimenOptionDto) => {
    return selectedItems.some(
      (item) => item.id === specimen.id && item.source === specimen.source && !item.inventorySpecimenId
    );
  };

  // Inventory mode handlers
  const isInventorySpecimenSelected = (invSpecimen: AvailableInventorySpecimen) => {
    return selectedItems.some(
      (item) => item.inventorySpecimenId === invSpecimen.inventorySpecimenId
    );
  };

  const handleInventoryToggle = (invSpecimen: AvailableInventorySpecimen) => {
    const existingItem = selectedItems.find(
      (item) => item.inventorySpecimenId === invSpecimen.inventorySpecimenId
    );

    if (existingItem) {
      onSelectionChange(
        selectedItems.filter((item) => item.inventorySpecimenId !== invSpecimen.inventorySpecimenId)
      );
    } else {
      const selection: SpecimenSelection = {
        id: invSpecimen.specimenId || invSpecimen.userSpecimenId || invSpecimen.inventorySpecimenId,
        source: invSpecimen.userSpecimenId ? 'user' : 'system',
        inventorySpecimenId: invSpecimen.inventorySpecimenId,
        markDepletedOnComplete: false,
      };
      onSelectionChange([...selectedItems, selection]);
    }
  };

  const handleMarkDepletedToggle = (inventorySpecimenId: string) => {
    onSelectionChange(
      selectedItems.map((item) =>
        item.inventorySpecimenId === inventorySpecimenId
          ? { ...item, markDepletedOnComplete: !item.markDepletedOnComplete }
          : item
      )
    );
  };

  const handleAddPhotosToggle = (inventorySpecimenId: string) => {
    onSelectionChange(
      selectedItems.map((item) =>
        item.inventorySpecimenId === inventorySpecimenId
          ? { ...item, addPhotosFromInventory: !item.addPhotosFromInventory }
          : item
      )
    );
  };

  const handleRemoveInventorySpecimen = (inventorySpecimenId: string) => {
    onSelectionChange(
      selectedItems.filter((item) => item.inventorySpecimenId !== inventorySpecimenId)
    );
  };

  // Filter inventory groups by search query
  const filteredInventoryGroups = React.useMemo(() => {
    if (!searchQuery.trim()) return inventoryGroups;
    const query = searchQuery.toLowerCase();
    return inventoryGroups
      .map((group) => ({
        ...group,
        specimens: group.specimens.filter((s) =>
          s.commonName.toLowerCase().includes(query) ||
          group.inventoryName.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.specimens.length > 0);
  }, [inventoryGroups, searchQuery]);

  // Get selected inventory specimens for display
  const selectedInventorySpecimens = React.useMemo(() => {
    const inventoryItems = selectedItems.filter((item) => item.inventorySpecimenId);
    return inventoryItems.map((item) => {
      for (const group of inventoryGroups) {
        const specimen = group.specimens.find((s) => s.inventorySpecimenId === item.inventorySpecimenId);
        if (specimen) {
          return {
            ...specimen,
            markDepletedOnComplete: item.markDepletedOnComplete,
            addPhotosFromInventory: item.addPhotosFromInventory,
          };
        }
      }
      return null;
    }).filter(Boolean) as (AvailableInventorySpecimen & { markDepletedOnComplete?: boolean; addPhotosFromInventory?: boolean })[];
  }, [selectedItems, inventoryGroups]);

  // Mobile-optimized specimen row
  const renderMobileSpecimenItem = (specimen: SpecimenOptionDto) => {
    const selected = isSelected(specimen);

    return (
      <button
        key={`${specimen.source}-${specimen.id}`}
        type="button"
        onClick={() => handleToggle(specimen)}
        className={cn(
          "w-full flex items-center gap-3 p-4 text-left border-b border-border/50 active:bg-accent transition-colors",
          selected && "bg-primary/10"
        )}
      >
        {/* Large checkbox area */}
        <div className={cn(
          "w-7 h-7 rounded-md border-2 flex items-center justify-center flex-shrink-0",
          selected ? "bg-primary border-primary" : "border-muted-foreground/30"
        )}>
          {selected && <Check className="h-5 w-5 text-primary-foreground" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-base truncate">{specimen.commonName}</span>
            {specimen.source === 'user' && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                <User className="h-3 w-3 mr-0.5" />
                {specimen.isOwned ? 'Mine' : 'Public'}
              </Badge>
            )}
          </div>
          {specimen.scientificName && (
            <p className="text-sm text-muted-foreground italic truncate">
              {specimen.scientificName}
            </p>
          )}
        </div>

        {/* Hardness badge */}
        {specimen.mohsHardnessMax && (
          <div className="text-sm text-muted-foreground flex-shrink-0">
            H: {specimen.mohsHardnessMax}
          </div>
        )}
      </button>
    );
  };

  // Mobile-optimized inventory specimen row
  const renderMobileInventoryItem = (invSpecimen: AvailableInventorySpecimen) => {
    const selected = isInventorySpecimenSelected(invSpecimen);
    const selectedItem = selectedItems.find(
      (item) => item.inventorySpecimenId === invSpecimen.inventorySpecimenId
    );

    return (
      <div
        key={invSpecimen.inventorySpecimenId}
        className={cn(
          "border-b border-border/50",
          selected && "bg-green-500/10"
        )}
      >
        <button
          type="button"
          onClick={() => handleInventoryToggle(invSpecimen)}
          className="w-full flex items-center gap-3 p-4 text-left active:bg-accent transition-colors"
        >
          {/* Large checkbox area */}
          <div className={cn(
            "w-7 h-7 rounded-md border-2 flex items-center justify-center flex-shrink-0",
            selected ? "bg-green-500 border-green-500" : "border-muted-foreground/30"
          )}>
            {selected && <Check className="h-5 w-5 text-white" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <span className="font-medium text-base truncate block">{invSpecimen.commonName}</span>
            {invSpecimen.weightGrams && (
              <span className="text-sm text-muted-foreground">
                {invSpecimen.weightGrams}g
              </span>
            )}
          </div>
        </button>

        {/* Options when selected - stacked for mobile */}
        {selected && (
          <div className="px-4 pb-4 pt-0 flex flex-col gap-2 ml-10">
            <button
              type="button"
              onClick={() => handleAddPhotosToggle(invSpecimen.inventorySpecimenId)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border text-left",
                selectedItem?.addPhotosFromInventory
                  ? "bg-blue-500/10 border-blue-500/50"
                  : "border-border"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded border-2 flex items-center justify-center",
                selectedItem?.addPhotosFromInventory
                  ? "bg-blue-500 border-blue-500"
                  : "border-muted-foreground/30"
              )}>
                {selectedItem?.addPhotosFromInventory && <Check className="h-4 w-4 text-white" />}
              </div>
              <span className="text-sm">Copy photos to cycle</span>
            </button>

            <button
              type="button"
              onClick={() => handleMarkDepletedToggle(invSpecimen.inventorySpecimenId)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border text-left",
                selectedItem?.markDepletedOnComplete
                  ? "bg-orange-500/10 border-orange-500/50"
                  : "border-border"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded border-2 flex items-center justify-center",
                selectedItem?.markDepletedOnComplete
                  ? "bg-orange-500 border-orange-500"
                  : "border-muted-foreground/30"
              )}>
                {selectedItem?.markDepletedOnComplete && <Check className="h-4 w-4 text-white" />}
              </div>
              <span className="text-sm">Mark depleted when complete</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {/* Trigger Button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full justify-between min-h-[48px] h-auto"
        disabled={disabled}
      >
        <span className="text-muted-foreground">
          {isLoading
            ? 'Loading specimens...'
            : selectedItems.length > 0
            ? `${selectedItems.length} selected`
            : placeholder}
        </span>
        <Plus className="ml-2 h-5 w-5 shrink-0 opacity-50" />
      </Button>

      {/* Full-screen Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[100dvh] p-0 flex flex-col">
          {/* Header */}
          <SheetHeader className="p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg">
                {inventoryMode ? 'Select from Inventory' : 'Select Specimens'}
              </SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="h-10 w-10"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Search Input */}
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={inventoryMode ? "Search inventory..." : "Search specimens..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>

            {/* Mode Toggle */}
            {enableInventoryMode && (
              <div className="flex gap-2 mt-3">
                <Button
                  type="button"
                  variant={!inventoryMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInventoryMode(false)}
                  className="flex-1 h-10"
                >
                  All Specimens
                </Button>
                <Button
                  type="button"
                  variant={inventoryMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInventoryMode(true)}
                  className="flex-1 h-10"
                >
                  <Package className="h-4 w-4 mr-2" />
                  My Inventory
                </Button>
              </div>
            )}
          </SheetHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {inventoryMode ? (
              /* Inventory Mode */
              <>
                {isLoadingInventory ? (
                  <div className="py-12 text-center text-muted-foreground">
                    Loading inventory...
                  </div>
                ) : filteredInventoryGroups.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">
                      {inventoryGroups.length === 0
                        ? "No available specimens in your inventory."
                        : "No matching specimens found."}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Depleted specimens are hidden.
                    </p>
                  </div>
                ) : (
                  filteredInventoryGroups.map((group) => (
                    <div key={group.inventoryId}>
                      <div className="px-4 py-3 bg-muted/50 flex items-center gap-2 sticky top-0">
                        <Package className="h-4 w-4" />
                        <span className="font-medium">{group.inventoryName}</span>
                      </div>
                      {group.specimens.map(renderMobileInventoryItem)}
                    </div>
                  ))
                )}
              </>
            ) : (
              /* Normal Mode */
              <>
                {/* Add Custom Button */}
                {onAddCustom && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onAddCustom();
                    }}
                    className="w-full flex items-center gap-3 p-4 text-left border-b border-border text-primary active:bg-accent"
                  >
                    <div className="w-7 h-7 rounded-md border-2 border-primary flex items-center justify-center">
                      <Plus className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-base">Add Custom Specimen</span>
                  </button>
                )}

                {isLoading ? (
                  <div className="py-12 text-center text-muted-foreground">
                    Loading specimens...
                  </div>
                ) : specimens.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">No specimens found.</p>
                  </div>
                ) : (
                  <>
                    {/* Your Specimens */}
                    {groupedSpecimens.userSpecimens.length > 0 && (
                      <>
                        <div className="px-4 py-3 bg-muted/50 sticky top-0">
                          <span className="font-medium text-sm text-muted-foreground">Your Specimens</span>
                        </div>
                        {groupedSpecimens.userSpecimens.map(renderMobileSpecimenItem)}
                      </>
                    )}

                    {/* Reference Specimens */}
                    {groupedSpecimens.systemSpecimens.length > 0 && (
                      <>
                        <div className="px-4 py-3 bg-muted/50 sticky top-0">
                          <span className="font-medium text-sm text-muted-foreground">Reference Specimens</span>
                        </div>
                        {groupedSpecimens.systemSpecimens.map(renderMobileSpecimenItem)}
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <SheetFooter className="border-t p-4 flex-shrink-0">
            <Button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full h-12 text-base"
            >
              {selectedItems.length > 0
                ? `Done (${selectedItems.length} selected)`
                : 'Done'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Selected Specimens as Chips */}
      {selectedSpecimens.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSpecimens.map((specimen) => (
            <Badge
              key={`${specimen.source}-${specimen.id}`}
              variant="secondary"
              className={cn(
                "flex items-center gap-1 pr-1 py-1 text-foreground border",
                specimen.source === 'user'
                  ? "bg-blue-500/25 border-blue-500/50"
                  : "bg-primary/25 border-primary/50"
              )}
            >
              {specimen.source === 'user' && <User className="h-3 w-3" />}
              <span className="truncate max-w-[120px]">{specimen.commonName}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(specimen.id, specimen.source);
                }}
                className="ml-1 rounded-full p-1 hover:bg-muted-foreground/20 active:bg-muted-foreground/30"
              >
                <X className="h-4 w-4" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Selected Inventory Specimens as Chips */}
      {selectedInventorySpecimens.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedInventorySpecimens.map((invSpec) => (
            <Badge
              key={invSpec.inventorySpecimenId}
              variant="secondary"
              className="flex items-center gap-1 pr-1 py-1 text-foreground border bg-green-500/25 border-green-500/50"
            >
              <Package className="h-3 w-3" />
              <span className="truncate max-w-[100px]">{invSpec.commonName}</span>
              {invSpec.addPhotosFromInventory && (
                <span className="text-blue-500 text-[10px] font-medium">+PHOTOS</span>
              )}
              {invSpec.markDepletedOnComplete && (
                <span className="text-orange-500 text-[10px] font-medium">DEPLETE</span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveInventorySpecimen(invSpec.inventorySpecimenId);
                }}
                className="ml-1 rounded-full p-1 hover:bg-muted-foreground/20 active:bg-muted-foreground/30"
              >
                <X className="h-4 w-4" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Clear All button */}
      {(selectedSpecimens.length + selectedInventorySpecimens.length) > 1 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClearAll}
          className="h-8 text-sm text-muted-foreground hover:text-destructive"
        >
          Clear all
        </Button>
      )}

      {/* Hardness Warning */}
      {hardnessWarning && (
        <Alert variant="warning" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Selected specimens have a hardness difference of {hardnessWarning.difference} (range: {hardnessWarning.min} - {hardnessWarning.max}).
            Tumbling rocks with more than 1 point difference may damage softer specimens.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
