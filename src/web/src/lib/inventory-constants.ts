import type { InventoryStatus, SourceType } from '@/types/inventory';

/**
 * Inventory status badge colors for light/dark mode
 */
export const INVENTORY_STATUS_COLORS: Record<InventoryStatus, string> = {
  Available: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  InUse: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  Depleted: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  Partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
};

/**
 * Inventory status display labels
 */
export const INVENTORY_STATUS_LABELS: Record<InventoryStatus, string> = {
  Available: 'Available',
  InUse: 'In Use',
  Depleted: 'Depleted',
  Partial: 'Partial',
};

/**
 * Inventory status options for dropdowns
 */
export const INVENTORY_STATUS_OPTIONS: { value: InventoryStatus; label: string }[] = [
  { value: 'Available', label: 'Available' },
  { value: 'InUse', label: 'In Use' },
  { value: 'Partial', label: 'Partial' },
  { value: 'Depleted', label: 'Depleted' },
];

/**
 * Source type options for dropdowns
 */
export const SOURCE_TYPE_OPTIONS: { value: SourceType; label: string }[] = [
  { value: 'Store', label: 'Store (physical)' },
  { value: 'Online', label: 'Online' },
  { value: 'Found', label: 'Found/Collected' },
  { value: 'Gift', label: 'Gift' },
  { value: 'Trade', label: 'Trade' },
  { value: 'Other', label: 'Other' },
];
