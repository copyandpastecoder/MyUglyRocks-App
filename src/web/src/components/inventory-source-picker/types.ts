import * as React from 'react';
import type { InventorySourceType } from '@/types/inventory-source';
import { Store, Globe, Mountain, Users, Sparkles, MoreHorizontal } from 'lucide-react';

export interface InventorySourcePickerProps {
  value?: string | null;
  onChange: (sourceId: string | null) => void;
  onAddNew?: () => void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
}

export const SOURCE_TYPE_ICONS: Record<InventorySourceType, React.ComponentType<{ className?: string }>> = {
  Store: Store,
  Online: Globe,
  Found: Mountain,
  Contact: Users,
  GemShow: Sparkles,
  Other: MoreHorizontal,
};
