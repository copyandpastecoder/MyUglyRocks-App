// InventorySourceType - WHERE specimens are acquired from
export type InventorySourceType = 'Store' | 'Online' | 'Found' | 'Contact' | 'GemShow' | 'Other';

export interface InventorySourceDto {
  inventorySourceId: string;
  sourceType: InventorySourceType;
  name: string;
  location: string | null;
  phone: string | null;
  url: string | null;
  contactName: string | null;
  notes: string | null;
  isActive: boolean;
  dateCreated: string;
  dateUpdated: string;
  // Computed
  totalPurchases: number;
  lastPurchaseDate: string | null;
}

export interface InventorySourceListDto {
  inventorySourceId: string;
  sourceType: InventorySourceType;
  name: string;
  location: string | null;
  isActive: boolean;
  totalPurchases: number;
  lastPurchaseDate: string | null;
}

export interface InventorySourceSummaryDto {
  inventorySourceId: string;
  sourceType: InventorySourceType;
  name: string;
  location: string | null;
  phone: string | null;
  url: string | null;
  contactName: string | null;
}

export interface CreateInventorySourceRequest {
  sourceType: InventorySourceType;
  name: string;
  location?: string;
  phone?: string;
  url?: string;
  contactName?: string;
  notes?: string;
}

export interface UpdateInventorySourceRequest {
  sourceType: InventorySourceType;
  name: string;
  location?: string;
  phone?: string;
  url?: string;
  contactName?: string;
  notes?: string;
  isActive?: boolean;
}

// Filter options for inventory source list
export interface InventorySourceFilters {
  sourceType?: InventorySourceType;
  isActive?: boolean;
  search?: string;
  sortBy?: 'name' | 'sourceType' | 'location' | 'totalPurchases' | 'lastPurchaseDate' | 'dateCreated';
  sortOrder?: 'asc' | 'desc';
}

// Helper to get display name for source type
export const sourceTypeDisplayNames: Record<InventorySourceType, string> = {
  Store: 'Store',
  Online: 'Online',
  Found: 'Found',
  Contact: 'Contact',
  GemShow: 'Gem Show',
  Other: 'Other'
};

// Helper to get description for source type
export const sourceTypeDescriptions: Record<InventorySourceType, string> = {
  Store: 'Physical retail store (rock shop, lapidary supply, etc.)',
  Online: 'Online purchase (eBay, Etsy, website, etc.)',
  Found: 'Collected in the wild (beaches, hiking, mining, etc.)',
  Contact: 'From a person (gift, trade, friend, dealer)',
  GemShow: 'Gem and mineral shows (Tucson, local shows, etc.)',
  Other: 'Other source'
};
