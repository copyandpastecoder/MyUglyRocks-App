'use client';

import * as React from 'react';
import { ChevronsUpDown, Check, Plus, Store, Globe, Mountain, Users, Sparkles, MoreHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useInventorySources } from '@/hooks/use-inventory-sources';
import type { InventorySourceListDto, InventorySourceType } from '@/types/inventory-source';
import { sourceTypeDisplayNames } from '@/types/inventory-source';

const SOURCE_TYPE_ICONS: Record<InventorySourceType, React.ComponentType<{ className?: string }>> = {
  Store: Store,
  Online: Globe,
  Found: Mountain,
  Contact: Users,
  GemShow: Sparkles,
  Other: MoreHorizontal,
};

interface InventorySourcePickerProps {
  value?: string | null;
  onChange: (sourceId: string | null) => void;
  onAddNew?: () => void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
}

export function InventorySourcePicker({
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

  // Group sources by type
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

  const renderSourceItem = (source: InventorySourceListDto) => {
    const Icon = SOURCE_TYPE_ICONS[source.sourceType];
    const isSelected = source.inventorySourceId === value;

    return (
      <CommandItem
        key={source.inventorySourceId}
        value={`${source.name} ${source.location || ''}`}
        onSelect={() => handleSelect(source.inventorySourceId)}
        className="flex items-center gap-2 cursor-pointer"
      >
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="font-medium truncate">{source.name}</span>
          {source.location && (
            <span className="text-xs text-muted-foreground ml-2 truncate">
              {source.location}
            </span>
          )}
        </div>
        {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
      </CommandItem>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedSource ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {React.createElement(SOURCE_TYPE_ICONS[selectedSource.sourceType], {
                className: 'h-4 w-4 text-muted-foreground shrink-0',
              })}
              <span className="truncate">{selectedSource.name}</span>
              {selectedSource.location && (
                <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                  ({selectedSource.location})
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">
              {isLoading ? 'Loading sources...' : placeholder}
            </span>
          )}
          <div className="flex items-center gap-1 shrink-0">
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
                className="rounded-full p-0.5 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search sources..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {/* Add New Source Button */}
            {onAddNew && (
              <>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      onAddNew();
                    }}
                    className="flex items-center gap-2 cursor-pointer text-primary"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add New Source</span>
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading sources...
              </div>
            ) : sources.length === 0 ? (
              <CommandEmpty>
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No sources found.</p>
                  {onAddNew && (
                    <Button
                      variant="link"
                      size="sm"
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
              </CommandEmpty>
            ) : (
              <>
                {/* Render groups with sources */}
                {(Object.keys(groupedSources) as InventorySourceType[]).map((type) => {
                  const typeSources = groupedSources[type];
                  if (typeSources.length === 0) return null;

                  return (
                    <CommandGroup key={type} heading={sourceTypeDisplayNames[type]}>
                      {typeSources.map(renderSourceItem)}
                    </CommandGroup>
                  );
                })}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
