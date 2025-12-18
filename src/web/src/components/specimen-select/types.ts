// Selection item that tracks both ID and source
export interface SpecimenSelection {
  id: string;
  source: 'system' | 'user';
  /** For inventory specimens - the inventory specimen ID for linking to the cycle */
  inventorySpecimenId?: string;
  /** For inventory specimens - whether to mark as depleted when cycle completes */
  markDepletedOnComplete?: boolean;
  /** For inventory specimens - whether to copy tagged photos from inventory to cycle */
  addPhotosFromInventory?: boolean;
}

export interface SpecimenSelectProps {
  selectedItems: SpecimenSelection[];
  onSelectionChange: (items: SpecimenSelection[]) => void;
  placeholder?: string;
  disabled?: boolean;
  onAddCustom?: () => void;
  includePublicSpecimens?: boolean;
  /** Enable the inventory mode toggle - allows selecting from user's inventory */
  enableInventoryMode?: boolean;
}

// Column visibility configuration
export type ColumnKey = 'scientificName' | 'alias' | 'hardness' | 'difficulty' | 'materialType';

export interface ColumnConfig {
  key: ColumnKey;
  label: string;
  defaultVisible: boolean;
}

export const AVAILABLE_COLUMNS: ColumnConfig[] = [
  { key: 'scientificName', label: 'Scientific Name', defaultVisible: true },
  { key: 'alias', label: 'Alias', defaultVisible: true },
  { key: 'hardness', label: 'Hardness', defaultVisible: true },
  { key: 'difficulty', label: 'Tumbling Difficulty', defaultVisible: true },
  { key: 'materialType', label: 'Material Type', defaultVisible: false },
];

export const STORAGE_KEY = 'specimen-dropdown-columns';
