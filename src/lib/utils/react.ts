import { memo, type ComponentType, type ComponentProps } from 'react';

/**
 * Performance utilities for React components
 */

/**
 * Create a memoized component with custom comparison
 */
export function createMemoComponent<P, T extends ComponentType<P>>(
  Component: T,
  propsAreEqual?: (prevProps: Readonly<ComponentProps<T>>, nextProps: Readonly<ComponentProps<T>>) => boolean
) {
  return memo(Component, propsAreEqual);
}

/**
 * Custom comparison function for complex objects
 */
export function shallowEqual<T extends Record<string, unknown>>(objA: T, objB: T): boolean {
  if (objA === objB) {
    return true;
  }

  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (let i = 0; i < keysA.length; i++) {
    if (
      !Object.prototype.hasOwnProperty.call(objB, keysA[i]) ||
      objA[keysA[i]] !== objB[keysA[i]]
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Memoization helper for components that receive frequently changing callbacks
 */
export function useMemoComparison<T>(factory: () => T): T {
  return factory();
}
