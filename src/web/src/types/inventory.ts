import { InventorySourceSummaryDto } from './inventory-source';

// Legacy SourceType - kept for backwards compatibility
export type SourceType = 'Store' | 'Online' | 'Found' | 'Gift' | 'Trade' | 'Other';
export type InventoryCondition = 'Raw' | 'PreShaped' | 'Tumbled' | 'Polished' | 'Mixed';
export type InventoryStatus = 'Available' | 'InUse' | 'Depleted' | 'Partial';
export type SizeCategory = 'ZeroToOne' | 'OneToTwo' | 'TwoToThree' | 'ThreeToFour' | 'FourToFive' | 'GreaterThanFive' | 'Assorted';

export interface InventoryDto {
  inventoryId: string;
  name: string;
  acquiredDate: string;
  inventorySourceId: string | null;
  inventorySource: InventorySourceSummaryDto | null;
  totalWeightGrams: number | null;
  remainingWeightGrams: number | null;
  displayUnit: string;
  cost: number | null;  // Aggregated from specimens
  sizeCategories: SizeCategory[] | null;  // Aggregated from specimens
  qualityRating: number | null;  // Aggregated from specimens (average)
  storageLocation: string | null;
  notes: string | null;
  dateCreated: string;
  dateUpdated: string;
  specimens: InventorySpecimenDto[];
  photos: InventoryPhotoDto[];
  // Computed fields
  displayTotalWeight: number | null;
  displayRemainingWeight: number | null;
  photoCount: number;
  // Legacy fields for backwards compatibility
  sourceType: SourceType;
  sourceName: string | null;
  sourceLocation: string | null;
  sourceUrl: string | null;
  status: InventoryStatus;
  isFavorite: boolean;
}

export interface InventoryListDto {
  inventoryId: string;
  name: string;
  acquiredDate: string;
  inventorySourceId: string | null;
  sourceType: string | null;  // From InventorySource
  sourceName: string | null;  // From InventorySource.Name
  totalWeightGrams: number | null;
  remainingWeightGrams: number | null;
  displayUnit: string;
  cost: number | null;  // Aggregated from specimens
  qualityRating: number | null;  // Aggregated from specimens (average)
  dateCreated: string;
  specimenCount: number;
  photoCount: number;
  coverPhotoUrl: string | null;
  coverPhotoThumbnailUrl: string | null;
  // Specimen status counts
  availableCount: number;
  inUseCount: number;
  depletedCount: number;
  // Legacy fields for backwards compatibility
  status: InventoryStatus;
  isFavorite: boolean;
}

export interface CreateInventoryRequest {
  name: string;
  acquiredDate: string;
  inventorySourceId?: string;
  displayUnit?: string;
  storageLocation?: string;
  notes?: string;
  specimens?: CreateInventorySpecimenRequest[];
  // Legacy fields for backwards compatibility
  sourceType?: SourceType;
  sourceName?: string;
  sourceLocation?: string;
  sourceUrl?: string;
  status?: InventoryStatus;
  isFavorite?: boolean;
}

export interface UpdateInventoryRequest {
  name: string;
  acquiredDate: string;
  inventorySourceId?: string;
  displayUnit?: string;
  storageLocation?: string;
  notes?: string;
  specimens?: CreateInventorySpecimenRequest[];
  // Legacy fields for backwards compatibility
  sourceType?: SourceType;
  sourceName?: string;
  sourceLocation?: string;
  sourceUrl?: string;
  status?: InventoryStatus;
  isFavorite?: boolean;
}

export interface UpdateInventoryStatusRequest {
  status: InventoryStatus;
}

export interface UpdateInventorySpecimensRequest {
  specimens: CreateInventorySpecimenRequest[];
}

export interface InventorySpecimenDto {
  inventorySpecimenId: string;
  specimenId: string | null;
  userSpecimenId: string | null;
  commonName: string;
  scientificName: string | null;
  materialType: string;
  tumblingDifficulty: string | null;
  weightGrams: number | null;
  cost: number | null;
  condition: InventoryCondition | null;
  qualityRating: number | null;
  sizeCategories: SizeCategory[] | null;
  notes: string | null;
  status: InventoryStatus;
  storageLocation: string | null;
  url: string | null;
  source: 'system' | 'user';
}

export interface CreateInventorySpecimenRequest {
  specimenId?: string;
  userSpecimenId?: string;
  weightGrams?: number;
  cost?: number;
  condition?: InventoryCondition;
  qualityRating?: number;
  sizeCategories?: SizeCategory[];
  notes?: string;
  status?: InventoryStatus;
  storageLocation?: string;
  url?: string;
}

export interface InventoryPhotoDto {
  inventoryPhotoId: string;
  url: string;
  fileName: string | null;
  caption: string | null;
  isCover: boolean;
  sortOrder: number;
  dateCreated: string;
  thumbnailUrl: string | null;
  mediumUrl: string | null;
  largeUrl: string | null;
  blurHash: string | null;
  width: number | null;
  height: number | null;
  processingStatus: 'Processing' | 'Completed' | 'Failed';
  processingError: string | null;
  // Specimen link
  inventorySpecimenId: string | null;
  specimenName: string | null;
}

export interface InventoryStatsDto {
  totalItems: number;
  totalWeightGrams: number;
  totalInvested: number;
  availableCount: number;
  inUseCount: number;
  depletedCount: number;
}

export interface UploadInventoryPhotoResponse {
  success: boolean;
  photo?: InventoryPhotoDto;
  error?: string;
}

// Filter options for inventory list
export interface InventoryFilters {
  status?: InventoryStatus;
  sourceType?: SourceType;
  specimenId?: string;
  favorites?: boolean;
  search?: string;
  sortBy?: 'acquiredDate' | 'name' | 'weight' | 'cost' | 'dateCreated';
  sortOrder?: 'asc' | 'desc';
}
