export interface CycleDto {
  cycleId: string;
  name: string;
  startDate: string;
  endDate: string | null;
  status: string;
  difficultyRating: number | null;
  finalQuality: number | null;
  additionalSpecimens: string | null;
  notes: string | null;
  dateCreated: string;
  stageRuns: StageRunSummaryDto[];
  specimens: SpecimenDto[];
  // Computed fields
  elapsedDays: number;
  totalRuntimeHours: number;
  completedStagesCount: number;
  activeStageName: string | null;
  lastUpdated: string | null;
  weightLossGrams: number | null;
  weightLossPercent: number | null;
  photoCount: number;
  // Gallery info
  postId: string | null;
  galleryLikes: number;
  // Tumbler/Barrel info
  tumblerName: string | null;
  barrelName: string | null;
}

export interface CycleListDto {
  cycleId: string;
  name: string;
  startDate: string;
  endDate: string | null;
  status: string;
  difficultyRating: number | null;
  stageCount: number;
  activeStageCount: number;
  isOverdue: boolean;
  dateCreated: string;
  // Active stage progress info (null if no active stages)
  activeStageStartDateTime: string | null;
  activeStageDurationEstimateEndDate: string | null;
  activeStageDaysOverdue: number | null;
  // Active tumbler/barrel info
  activeTumblerName: string | null;
  activeTumblerNumber: number | null;
  hasDuplicateTumbler: boolean;
  activeBarrelNumber: number | null;
  activeBarrelNickname: string | null;
}

export interface CreateCycleRequest {
  name: string;
  startDate: string;
  difficultyRating?: number;
  additionalSpecimens?: string;
  notes?: string;
  /** System specimen IDs (from reference data) */
  specimenIds?: string[];
  /** User specimen IDs (custom user-created specimens) */
  userSpecimenIds?: string[];
  /** Inventory specimens (from user's inventory) with options for status management */
  inventorySpecimens?: InventorySpecimenInput[];
}

/**
 * Input for selecting a specimen from inventory with options for status management
 */
export interface InventorySpecimenInput {
  /** The inventory specimen ID to link to the cycle */
  inventorySpecimenId: string;
  /** If true, mark the specimen as Depleted when the cycle completes */
  markDepletedOnComplete?: boolean;
  /** If true, copy tagged photos from inventory to the cycle when the first stage is created */
  addPhotosFromInventory?: boolean;
}

export interface UpdateCycleRequest {
  name: string;
  startDate: string;
  difficultyRating?: number;
  additionalSpecimens?: string;
  notes?: string;
  /** System specimen IDs to add (from reference data) */
  specimenIds?: string[];
  /** User specimen IDs to add (custom user-created specimens) */
  userSpecimenIds?: string[];
  /** Inventory specimens to add (from user's inventory) with options */
  inventorySpecimens?: InventorySpecimenInput[];
  /** System specimen IDs to remove from the cycle */
  removedSpecimenIds?: string[];
  /** User specimen IDs to remove from the cycle */
  removedUserSpecimenIds?: string[];
  /** Inventory specimen IDs to remove from the cycle */
  removedInventorySpecimenIds?: string[];
}

export interface CompleteCycleRequest {
  finalQuality?: number;
  notes?: string;
}

export interface StageRunSummaryDto {
  stageRunId: string;
  stageName: string;
  runNumber: number;
  totalRuns: number;
  startDateTime: string;
  endDateTime: string | null; // Actual end - only set when completed/aborted
  durationEstimateEndDate: string | null; // Calculated estimate based on duration
  status: string;
  resultRating: number | null;
  cleaningRun: CleaningRunDto | null;
}

export interface StageRunDto {
  stageRunId: string;
  cycleId: string;
  stageName: string;
  runNumber: number;
  totalRuns: number;
  startDateTime: string;
  durationDays: number;
  durationHours: number;
  endDateTime: string | null; // Actual end - only set when completed/aborted
  durationEstimateEndDate: string | null; // Calculated estimate based on duration
  status: string;
  reminderEnabled: boolean;
  remindAfterDays: number | null;
  remindAtEndOfStage: boolean | null;
  loadWeightBeforeGrams: number | null;
  loadWeightAfterGrams: number | null;
  waterAmountMl: number | null;
  resultRating: number | null;
  resultShapeRounding: number | null;
  resultScratchLevel: number | null;
  resultPitting: number | null;
  resultShine: number | null;
  issueScratches: boolean | null;
  issueChips: boolean | null;
  issueUnderRounded: boolean | null;
  issueContamination: boolean | null;
  lessonsLearned: string | null;
  nextAction: string | null;
  notes: string | null;
  dateCreated: string;
  barrels: import('./tumbler').BarrelDto[];
  cleaningRun: CleaningRunDto | null;
  materials: StageMaterialDto[];
  photos: PhotoDto[];
}

export interface CreateStageRunRequest {
  barrelIds: string[];
  stageName: string;
  startDateTime: string;
  durationDays: number;
  durationHours: number;
  reminderEnabled?: boolean;
  remindAfterDays?: number;
  remindAtEndOfStage?: boolean;
  loadWeightBeforeGrams?: number;
  waterAmountMl?: number;
  notes?: string;
  materials?: CreateStageMaterialRequest[];
  cleaningRun?: CreateCleaningRunRequest;
}

export interface CleaningRunDto {
  cleaningRunId: string;
  durationMinutes: number;
  purpose: string | null;
  status: string;
  resultNotes: string | null;
  materials: CleaningMaterialDto[];
}

export interface CreateCleaningRunRequest {
  durationMinutes: number;
  purpose?: string;
  reminderEnabled?: boolean;
  materials?: CreateCleaningMaterialRequest[];
}

export interface CreateCleaningMaterialRequest {
  materialId: string;
  displayAmount?: number;
  displayUnit?: string;
}

export interface StageMaterialDto {
  stageMaterialId: string;
  materialId: string;
  materialName: string;
  displayAmount: number | null;
  displayUnit: string | null;
  sortOrder: number;
}

export interface CreateStageMaterialRequest {
  materialId: string;
  displayAmount?: number;
  displayUnit?: string;
}

export interface UpdateStageRunRequest {
  barrelIds?: string[];
  stageName: string;
  startDateTime: string;
  durationDays: number;
  durationHours: number;
  reminderEnabled?: boolean;
  remindAfterDays?: number;
  remindAtEndOfStage?: boolean;
  loadWeightBeforeGrams?: number;
  loadWeightAfterGrams?: number;
  waterAmountMl?: number;
  notes?: string;
  // Quality ratings
  resultRating?: number;
  resultShapeRounding?: number;
  resultScratchLevel?: number;
  resultPitting?: number;
  resultShine?: number;
  // Issues
  issueScratches?: boolean;
  issueChips?: boolean;
  issueUnderRounded?: boolean;
  issueContamination?: boolean;
  // Lessons and next action
  lessonsLearned?: string;
  nextAction?: string;
  // Materials and cleaning
  materials?: CreateStageMaterialRequest[];
  cleaningRun?: CreateCleaningRunRequest;
}

export interface CompleteStageRunRequest {
  resultRating?: number;
  resultShapeRounding?: number;
  resultScratchLevel?: number;
  resultPitting?: number;
  resultShine?: number;
  issueScratches?: boolean;
  issueChips?: boolean;
  issueUnderRounded?: boolean;
  issueContamination?: boolean;
  lessonsLearned?: string;
  nextAction?: string;
  loadWeightAfterGrams?: number;
  actualEndDateTime?: string;
}

export interface CleaningMaterialDto {
  cleaningMaterialId: string;
  materialId: string;
  materialName: string;
  displayAmount: number | null;
  displayUnit: string | null;
  sortOrder: number;
}

export interface PhotoDto {
  photoId: string;
  url: string;
  fileName: string | null;
  photoType: string;
  caption: string | null;
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

export interface SpecimenDto {
  specimenId: string;
  commonName: string;
  scientificName: string | null;
  materialType: string;
  mohsHardnessMin: number | null;
  mohsHardnessMax: number | null;
  tumblingDifficulty: string | null;
  /** Source: "system" for reference specimens, "user" for custom user specimens */
  source?: 'system' | 'user';
  /** Only set for user specimens - the user who created it */
  userId?: string | null;
  /** Set when the specimen was linked via inventory */
  inventorySpecimenId?: string | null;
}

export interface CyclePhotoDto {
  photoId: string;
  url: string;
  fileName: string | null;
  photoType: string;
  caption: string | null;
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
  // Stage context
  stageRunId: string;
  stageName: string;
  runNumber: number;
}
