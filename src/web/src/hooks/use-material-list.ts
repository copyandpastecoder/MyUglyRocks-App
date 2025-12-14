'use client';

import { useState, useCallback } from 'react';
import type { MaterialFormItem } from '@/lib/material-utils';
import { DEFAULT_MATERIAL_ITEM } from '@/lib/material-utils';

/**
 * Custom hook for managing a list of materials in forms.
 * Provides add, remove, update, and reset functionality.
 */
export function useMaterialList(initialValue: MaterialFormItem[] = []) {
  const [materials, setMaterials] = useState<MaterialFormItem[]>(initialValue);

  const addMaterial = useCallback(() => {
    setMaterials((prev) => [...prev, { ...DEFAULT_MATERIAL_ITEM }]);
  }, []);

  const removeMaterial = useCallback((index: number) => {
    setMaterials((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateMaterial = useCallback(
    (index: number, field: keyof MaterialFormItem, value: string) => {
      setMaterials((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    },
    []
  );

  const resetMaterials = useCallback((newValue: MaterialFormItem[] = []) => {
    setMaterials(newValue);
  }, []);

  return {
    materials,
    setMaterials,
    addMaterial,
    removeMaterial,
    updateMaterial,
    resetMaterials,
  };
}
