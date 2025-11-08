'use client';

import { useState, useDeferredValue, Suspense } from 'react';
import { useMemo } from 'react';

/**
 * Deferred Search Hook
 * Uses useDeferredValue for responsive search with optimized filtering
 */

interface UseDeferredSearchOptions<T> {
  items: T[];
  getItemText: (item: T) => string;
  threshold?: number;
}

interface UseDeferredSearchResult<T> {
  query: string;
  deferredQuery: string;
  setQuery: (query: string) => void;
  filteredItems: T[];
  isDeferred: boolean;
}

/**
 * Hook for optimized search using useDeferredValue
 */
export function useDeferredSearch<T>({
  items,
  getItemText,
  threshold = 100,
}: UseDeferredSearchOptions<T>): UseDeferredSearchResult<T> {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const shouldUseDeferred = items.length > threshold;
  const activeQuery = shouldUseDeferred ? deferredQuery : query;

  const filteredItems = useMemo(() => {
    const normalizedQuery = activeQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return items;
    }

    return items.filter(item =>
      getItemText(item).toLowerCase().includes(normalizedQuery)
    );
  }, [items, getItemText, activeQuery]);

  const isDeferred = shouldUseDeferred && query !== deferredQuery;

  return {
    query,
    deferredQuery,
    setQuery,
    filteredItems,
    isDeferred,
  };
}

/**
 * Searchable List with useDeferredValue
 */
export function SearchableList<T>({
  items,
  getItemText,
  renderItem,
  placeholder = "Search items...",
}: {
  items: T[];
  getItemText: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  placeholder?: string;
}) {
  const { query, setQuery, filteredItems, isDeferred } = useDeferredSearch({
    items,
    getItemText,
  });

  return (
    <div className="searchable-list">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="search-input"
        style={{
          backgroundColor: isDeferred ? '#f0f0f0' : 'white',
          transition: 'background-color 0.2s',
        }}
      />

      {isDeferred && (
        <div className="search-info" style={{ color: '#666', fontSize: '14px' }}>
          Searching...
        </div>
      )}

      <Suspense fallback={<SearchResultsSkeleton count={5} />}>
        <SearchResults
          items={filteredItems}
          renderItem={renderItem}
          deferredQuery={query}
        />
      </Suspense>
    </div>
  );
}

const SearchResults = <T,>({
  items,
  renderItem,
  deferredQuery,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  deferredQuery: string;
}) => {
  if (deferredQuery && items.length === 0) {
    return (
      <div className="no-results">
        No items found for &ldquo;{deferredQuery}&rdquo;
      </div>
    );
  }

  return (
    <ul className="results-list">
      {items.map((item, index) => (
        <li key={index} className="result-item">
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
};

const SearchResultsSkeleton: React.FC<{ count: number }> = ({ count }) => {
  return (
    <ul className="results-list">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="result-item-skeleton">
          <div className="skeleton-line" style={{ height: '20px', backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '8px' }} />
        </li>
      ))}
    </ul>
  );
};
