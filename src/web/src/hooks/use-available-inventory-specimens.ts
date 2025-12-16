'use client';

import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/lib/api';
import { queryKeys, cacheConfig } from '@/lib/query-keys';
import type { InventoryDto, InventorySpecimenDto } from '@/types/inventory';

/**
 * Represents an inventory specimen for selection in cycle creation
 */
export interface AvailableInventorySpecimen {
  inventorySpecimenId: string;
  inventoryId: string;
  inventoryName: string;
  specimenId: string | null;
  userSpecimenId: string | null;
  commonName: string;
  weightGrams: number | null;
  status: string;
}

/**
 * Groups inventory specimens by their parent inventory item
 */
export interface InventoryGroup {
  inventoryId: string;
  inventoryName: string;
  acquiredDate: string;
  specimens: AvailableInventorySpecimen[];
}

/**
 * Fetches inventory items with available specimens, grouped by inventory
 * Only returns specimens with status "Available"
 */
export function useAvailableInventorySpecimens() {
  return useQuery({
    queryKey: [...queryKeys.inventory.all, 'available-specimens'],
    queryFn: async (): Promise<InventoryGroup[]> => {
      // First get all inventory items with available count > 0
      const inventoryList = await inventoryApi.getAll(undefined, 0, 100);
      const inventoryWithAvailable = inventoryList.filter(inv => inv.availableCount > 0);

      if (inventoryWithAvailable.length === 0) {
        return [];
      }

      // Fetch full details for each inventory to get specimens
      const inventoryDetails = await Promise.all(
        inventoryWithAvailable.map(inv => inventoryApi.getById(inv.inventoryId))
      );

      // Group available specimens by inventory
      return inventoryDetails
        .map((inv: InventoryDto): InventoryGroup => ({
          inventoryId: inv.inventoryId,
          inventoryName: inv.name,
          acquiredDate: inv.acquiredDate,
          specimens: inv.specimens
            .filter((s: InventorySpecimenDto) => s.status === 'Available')
            .map((s: InventorySpecimenDto): AvailableInventorySpecimen => ({
              inventorySpecimenId: s.inventorySpecimenId,
              inventoryId: inv.inventoryId,
              inventoryName: inv.name,
              specimenId: s.specimenId,
              userSpecimenId: s.userSpecimenId,
              commonName: s.commonName,
              weightGrams: s.weightGrams,
              status: s.status,
            })),
        }))
        .filter(group => group.specimens.length > 0);
    },
    ...cacheConfig.userData,
    staleTime: 1000 * 30, // 30 seconds - inventory may change more frequently
  });
}
