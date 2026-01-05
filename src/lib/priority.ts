import { Priority, PriorityDisplay } from '@/lib/types';

// Export Priority enum for use in other files
export { Priority };

// Priority localization mappings
export const PRIORITY_LABELS = {
  en: {
    [Priority.LOW]: 'low',
    [Priority.MEDIUM]: 'medium',
    [Priority.HIGH]: 'high',
    [Priority.URGENT]: 'urgent'
  },
  fr: {
    [Priority.LOW]: 'basse',
    [Priority.MEDIUM]: 'moyenne',
    [Priority.HIGH]: 'haute',
    [Priority.URGENT]: 'urgente'
  }
} as const;


// Priority color mappings for UI
export const PRIORITY_COLORS = {
  [Priority.LOW]: 'bg-gray-100 text-gray-800 border-gray-200',
  [Priority.MEDIUM]: 'bg-blue-100 text-blue-800 border-blue-200',
  [Priority.HIGH]: 'bg-orange-100 text-orange-800 border-orange-200',
  [Priority.URGENT]: 'bg-red-100 text-red-800 border-red-200'
} as const;

// Priority sorting order (highest first)
export const PRIORITY_SORT_ORDER = [Priority.URGENT, Priority.HIGH, Priority.MEDIUM, Priority.LOW];

// Utility functions
export function getPriorityLabel(priority: Priority, locale: 'en' | 'fr' = 'en'): string {
  return PRIORITY_LABELS[locale][priority];
}

export function getPriorityValue(label: PriorityDisplay): Priority {
  switch (label) {
    case 'low': return Priority.LOW;
    case 'medium': return Priority.MEDIUM;
    case 'high': return Priority.HIGH;
    case 'urgent': return Priority.URGENT;
    default:
      throw new Error(`Invalid priority label: ${label}`);
  }
}

export function getPriorityColor(priority: Priority): string {
  return PRIORITY_COLORS[priority];
}

export function isValidPriority(value: number): value is Priority {
  return Object.values(Priority).includes(value);
}

// Get all priority options for forms
export function getPriorityOptions(locale: 'en' | 'fr' = 'en') {
  return [
    { value: Priority.LOW, label: getPriorityLabel(Priority.LOW, locale) },
    { value: Priority.MEDIUM, label: getPriorityLabel(Priority.MEDIUM, locale) },
    { value: Priority.HIGH, label: getPriorityLabel(Priority.HIGH, locale) },
    { value: Priority.URGENT, label: getPriorityLabel(Priority.URGENT, locale) }
  ];
}
