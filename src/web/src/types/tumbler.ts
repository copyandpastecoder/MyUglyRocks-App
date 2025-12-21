export interface TumblerDto {
  tumblerId: string;
  brand: string;
  model: string | null;
  tumblerType: string;
  motorCapacityLbs: number | null;
  isMotorCapacityEditable: boolean;
  isActive: boolean;
  notes: string | null;
  dateCreated: string;
  barrels: BarrelDto[];
}

export interface TumblerListDto {
  tumblerId: string;
  brand: string;
  model: string | null;
  tumblerType: string;
  isActive: boolean;
  barrelCount: number;
  dateCreated: string;
}

export interface CreateTumblerRequest {
  brand: string;
  model?: string;
  tumblerType: string;
  motorCapacityLbs?: number;
  notes?: string;
  barrels?: CreateBarrelRequest[];
}

export interface UpdateTumblerRequest {
  brand: string;
  model?: string;
  tumblerType: string;
  motorCapacityLbs?: number;
  notes?: string;
  isActive: boolean;
}

export interface BarrelDto {
  barrelId: string;
  barrelNumber: number;
  nickname: string | null;
  capacityLbs: number | null;
  defaultGritAmountGrams: number | null;
  isDedicated: boolean;
  dedicatedStages: string[] | null;
  isActive: boolean;
  isMounted: boolean;
  isInActiveCycle: boolean;
  activeCycleId: string | null;
  activeCycleName: string | null;
}

export interface CreateBarrelRequest {
  barrelNumber: number;
  nickname?: string;
  capacityLbs?: number;
  defaultGritAmountGrams?: number;
}

export interface UpdateBarrelRequest {
  nickname?: string;
  capacityLbs?: number;
  defaultGritAmountGrams?: number;
  isDedicated?: boolean;
  dedicatedStages?: string[];
  isActive?: boolean;
}

export interface TumblerModelDto {
  tumblerModelId: string;
  brand: string;
  model: string;
  tumblerType: string;
  defaultCapacityLbs: number | null;
  defaultBarrelCount: number;
  motorCapacityLbs: number | null;
  isCustomEntry: boolean;
}
