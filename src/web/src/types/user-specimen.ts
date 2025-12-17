// UserSpecimen types
export interface UserSpecimenDto {
  userSpecimenId: string;
  userId: string;
  commonName: string;
  scientificName: string | null;
  alias: string | null;
  rockFamily: string | null;
  species: string | null;
  variety: string | null;
  materialType: string;
  mohsHardnessMin: number | null;
  mohsHardnessMax: number | null;
  tumblingDifficulty: string | null;
  recommendedGritSequence: string | null;
  specialConsiderations: string | null;
  notes: string | null;
  isPublic: boolean;
  basedOnSpecimenId: string | null;
  dateCreated: string;
  aiConfidenceScore: number | null;
  aiIsKnownSpecimen: boolean | null;
}

export interface UserSpecimenListDto {
  userSpecimenId: string;
  commonName: string;
  scientificName: string | null;
  materialType: string;
  tumblingDifficulty: string | null;
  isPublic: boolean;
  dateCreated: string;
  aiConfidenceScore: number | null;
  aiIsKnownSpecimen: boolean | null;
}

export interface CreateUserSpecimenRequest {
  commonName: string;
  scientificName?: string | null;
  alias?: string | null;
  rockFamily?: string | null;
  species?: string | null;
  variety?: string | null;
  materialType?: string;
  mohsHardnessMin?: number | null;
  mohsHardnessMax?: number | null;
  tumblingDifficulty?: string | null;
  recommendedGritSequence?: string | null;
  specialConsiderations?: string | null;
  notes?: string | null;
  isPublic?: boolean;
  basedOnSpecimenId?: string | null;
  aiConfidenceScore?: number | null;
  aiIsKnownSpecimen?: boolean | null;
}

export interface UpdateUserSpecimenRequest {
  commonName: string;
  scientificName?: string | null;
  alias?: string | null;
  rockFamily?: string | null;
  species?: string | null;
  variety?: string | null;
  materialType?: string;
  mohsHardnessMin?: number | null;
  mohsHardnessMax?: number | null;
  tumblingDifficulty?: string | null;
  recommendedGritSequence?: string | null;
  specialConsiderations?: string | null;
  notes?: string | null;
  isPublic?: boolean;
  aiConfidenceScore?: number | null;
  aiIsKnownSpecimen?: boolean | null;
}

// Combined DTO for UI dropdowns/pickers - includes both system and user specimens
export interface SpecimenOptionDto {
  id: string;
  commonName: string;
  scientificName: string | null;
  alias: string | null;
  materialType: string;
  tumblingDifficulty: string | null;
  mohsHardnessMax: number | null;  // For hardness warning calculation
  source: 'system' | 'user';
  isOwned: boolean;
  basedOnSpecimenId: string | null;
}

// Filters for user specimens list
export interface UserSpecimenFilters {
  search?: string;
  materialType?: string;
  sortBy?: 'commonName' | 'dateCreated';
  sortOrder?: 'asc' | 'desc';
}

// AI Specimen Lookup types
export interface SpecimenLookupRequest {
  commonName: string;
  sourceUrl?: string | null;
  sourceName?: string | null;
  sourceDescription?: string | null;
}

export interface SpecimenLookupResponse {
  success: boolean;
  error: string | null;
  data: SpecimenLookupData | null;
}

export interface SpecimenLookupData {
  commonName: string;
  scientificName: string | null;
  alias: string | null;
  rockFamily: string | null;
  species: string | null;
  variety: string | null;
  materialType: string;
  mohsHardnessMin: number | null;
  mohsHardnessMax: number | null;
  tumblingDifficulty: string | null;
  recommendedGritSequence: string | null;
  specialConsiderations: string | null;
  isKnownSpecimen: boolean;
  confidenceScore: number;
  confidenceReason: string | null;
}
