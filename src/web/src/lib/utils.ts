import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Size category display labels
const SIZE_CATEGORY_LABELS: Record<string, string> = {
  'ZeroToOne': '0 - 1"',
  'OneToTwo': '1" - 2"',
  'TwoToThree': '2" - 3"',
  'ThreeToFour': '3" - 4"',
  'FourToFive': '4" - 5"',
  'GreaterThanFive': 'Greater than 5"',
  'Assorted': 'Assorted',
  // Legacy values for backward compatibility
  'Mini': 'Mini',
  'Small': 'Small',
  'Medium': 'Medium',
  'Large': 'Large',
  'ExtraLarge': 'Extra Large',
  'Fist': 'Fist',
  'DoubleFist': 'Double Fist',
  'Mixed': 'Mixed',
};

export function getSizeCategoryLabel(category: string): string {
  return SIZE_CATEGORY_LABELS[category] || category;
}

export function formatSizeCategories(categories: string[]): string[] {
  return categories.map(getSizeCategoryLabel);
}
