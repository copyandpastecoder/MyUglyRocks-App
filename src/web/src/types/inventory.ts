export type SourceType = 'Store' | 'Online' | 'Found' | 'Gift' | 'Trade' | 'Other';
export type InventoryCondition = 'Raw' | 'PreShaped' | 'Tumbled' | 'Polished' | 'Mixed';
export type InventoryStatus = 'Available' | 'InUse' | 'Depleted' | 'Partial';
export type SizeCategory = 'ZeroToOne' | 'OneToTwo' | 'TwoToThree' | 'ThreeToFour' | 'FourToFive' | 'GreaterThanFive' | 'Assorted';

export interface InventoryDto {
  inventoryId: string;
  name: string;
  acquiredDate: string;
  sourceType: SourceType;
  sourceName: string | null;
  sourceLocation: string | null;
  sourceUrl: string | null;
  totalWeightGrams: number | null;
  remainingWeightGrams: number | null;
  displayUnit: string;
  cost: number | null;
  condition: InventoryCondition;
  sizeCategories: SizeCategory[] | null;
  qualityRating: number | null;
  status: InventoryStatus;
  storageLocation: string | null;
  notes: string | null;
  isFavorite: boolean;
  dateCreated: string;
  dateUpdated: string;
  specimens: InventorySpecimenDto[];
  photos: InventoryPhotoDto[];
  // Computed fields
  displayTotalWeight: number | null;
  displayRemainingWeight: number | null;
  photoCount: number;
}

export interface InventoryListDto {
  inventoryId: string;
  name: string;
  acquiredDate: string;
  sourceType: SourceType;
  sourceName: string | null;
  totalWeightGrams: number | null;
  remainingWeightGrams: number | null;
  displayUnit: string;
  cost: number | null;
  condition: InventoryCondition;
  status: InventoryStatus;
  isFavorite: boolean;
  dateCreated: string;
  specimenCount: number;
  photoCount: number;
  coverPhotoUrl: string | null;
  coverPhotoThumbnailUrl: string | null;
}

export interface CreateInventoryRequest {
  name: string;
  acquiredDate: string;
  sourceType: SourceType;
  sourceName?: string;
  sourceLocation?: string;
  sourceUrl?: string;
  totalWeightGrams?: number;
  remainingWeightGrams?: number;
  displayUnit?: string;
  cost?: number;
  condition: InventoryCondition;
  sizeCategories?: SizeCategory[];
  qualityRating?: number;
  status?: InventoryStatus;
  storageLocation?: string;
  notes?: string;
  isFavorite?: boolean;
  specimens?: CreateInventorySpecimenRequest[];
}

export interface UpdateInventoryRequest {
  name: string;
  acquiredDate: string;
  sourceType: SourceType;
  sourceName?: string;
  sourceLocation?: string;
  sourceUrl?: string;
  totalWeightGrams?: number;
  remainingWeightGrams?: number;
  displayUnit?: string;
  cost?: number;
  condition: InventoryCondition;
  sizeCategories?: SizeCategory[];
  qualityRating?: number;
  status?: InventoryStatus;
  storageLocation?: string;
  notes?: string;
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
  estimatedPercentage: number | null;
  weightGrams: number | null;
  notes: string | null;
  source: 'system' | 'user';
}

export interface CreateInventorySpecimenRequest {
  specimenId?: string;
  userSpecimenId?: string;
  estimatedPercentage?: number;
  weightGrams?: number;
  notes?: string;
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
