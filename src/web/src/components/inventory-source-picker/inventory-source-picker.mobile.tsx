'use client';

import * as React from 'react';
import { Check, Plus, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useInventorySources } from '@/hooks/use-inventory-sources';
import type { InventorySourceListDto, InventorySourceType } from '@/types/inventory-source';
import { sourceTypeDisplayNames } from '@/types/inventory-source';
import { cn } from '@/lib/utils';
import type { InventorySourcePickerProps } from './types';
import { SOURCE_TYPE_ICONS } from './types';

export function InventorySourcePickerMobile({
  value,
  onChange,
  onAddNew,
  placeholder = 'Select a source...',
  disabled = false,
  allowClear = true,
}: InventorySourcePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const { data: sources = [], isLoading } = useInventorySources(
    { isActive: true, search: searchQuery || undefined },
    0,
    100
  );

  const selectedSource = React.useMemo(() => {
    if (!value) return null;
    return sources.find((s) => s.inventorySourceId === value) || null;
  }, [sources, value]);

  const groupedSources = React.useMemo(() => {
    const groups: Record<InventorySourceType, InventorySourceListDto[]> = {
      Store: [],
      Online: [],
      Found: [],
      Contact: [],
      GemShow: [],
      Other: [],
    };

    sources.forEach((source) => {
      groups[source.sourceType].push(source);
    });

    return groups;
  }, [sources]);

  const handleSelect = (sourceId: string) => {
    onChange(sourceId === value ? null : sourceId);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between h-12 text-base"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        {selectedSource ? (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {React.createElement(SOURCE_TYPE_ICONS[selectedSource.sourceType], {
              className: 'h-5 w-5 text-muted-foreground shrink-0',
            })}
            <span className="truncate">{selectedSource.name}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">
            {isLoading ? 'Loading...' : placeholder}
          </span>
        )}
        <div className="flex items-center gap-2 shrink-0">
          {allowClear && value && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleClear(e as unknown as React.MouseEvent);
                }
              }}
              className="rounded-full p-1 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </span>
          )}
        </div>
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0">
          <SheetHeader className="p-4 pb-2 border-b">
            <SheetTitle>Select Source</SheetTitle>
          </SheetHeader>

          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search sources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 text-base pl-10"
              />
            </div>
          </div>

          {/* Add New Button */}
          {onAddNew && (
            <div className="p-4 border-b">
              <Button
                variant="outline"
                className="w-full h-12 text-base justify-start text-primary"
                onClick={() => {
                  setOpen(false);
                  onAddNew();
                }}
              >
                <Plus className="h-5 w-5 mr-2" />
                Add New Source
              </Button>
            </div>
          )}

          {/* Sources List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading sources...
              </div>
            ) : sources.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No sources found.</p>
                {onAddNew && (
                  <Button
                    variant="link"
                    onClick={() => {
                      setOpen(false);
                      onAddNew();
                    }}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add a new source
                  </Button>
                )}
              </div>
            ) : (
              <>
                {(Object.keys(groupedSources) as InventorySourceType[]).map((type) => {
                  const typeSources = groupedSources[type];
                  if (typeSources.length === 0) return null;

                  return (
                    <div key={type}>
                      <div className="px-4 py-2 bg-muted/50 text-sm font-medium text-muted-foreground">
                        {sourceTypeDisplayNames[type]}
                      </div>
                      <div className="divide-y">
                        {typeSources.map((source) => {
                          const Icon = SOURCE_TYPE_ICONS[source.sourceType];
                          const isSelected = source.inventorySourceId === value;

                          return (
                            <button
                              key={source.inventorySourceId}
                              type="button"
                              className={cn(
                                "w-full flex items-center gap-3 p-4 text-left active:bg-muted min-h-[60px]",
                                isSelected && "bg-primary/10"
                              )}
                              onClick={() => handleSelect(source.inventorySourceId)}
                            >
                              <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium">{source.name}</div>
                                {source.location && (
                                  <div className="text-sm text-muted-foreground truncate">
                                    {source.location}
                                  </div>
                                )}
                              </div>
                              {isSelected && (
                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                                  <Check className="h-4 w-4 text-primary-foreground" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
