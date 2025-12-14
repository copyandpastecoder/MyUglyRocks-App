/**
 * Material utility constants and functions.
 */

/**
 * Available material units for measurement.
 */
export const MATERIAL_UNITS = [
  { value: 'tbsp', label: 'tbsp' },
  { value: 'tsp', label: 'tsp' },
  { value: 'cup', label: 'cup' },
  { value: 'oz', label: 'oz' },
  { value: 'g', label: 'g' },
  { value: 'ml', label: 'ml' },
] as const;

/**
 * Material item structure used in forms.
 */
export interface MaterialFormItem {
  materialId: string;
  displayAmount: string;
  displayUnit: string;
}

/**
 * Default material item for new entries.
 */
export const DEFAULT_MATERIAL_ITEM: MaterialFormItem = {
  materialId: '',
  displayAmount: '',
  displayUnit: 'tbsp',
};

/**
 * Convert form materials to API submission format.
 * Filters out empty entries and parses numeric amounts.
 */
export function formatMaterialsForSubmission(
  materials: MaterialFormItem[]
): Array<{
  materialId: string;
  displayAmount?: number;
  displayUnit?: string;
}> {
  return materials
    .filter((m) => m.materialId)
    .map((m) => ({
      materialId: m.materialId,
      displayAmount: m.displayAmount ? parseFloat(m.displayAmount) : undefined,
      displayUnit: m.displayUnit || undefined,
    }));
}
