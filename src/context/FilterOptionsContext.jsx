import { createContext, useContext, useMemo } from 'react';
import { fetchFilterOptions } from '../api/endpoints';
import useAsync from '../hooks/useAsync';

const FilterOptionsContext = createContext(null);

/**
 * GET /filter-options once at boot. Venues, formats, languages, time bands,
 * sorts, ticket types, age ratings, the seat cap and the hold length all
 * come from here, so none of them are hardcoded in the UI.
 */
export function FilterOptionsProvider({ children }) {
  const { data, error, loading, reload } = useAsync(() => fetchFilterOptions(), []);

  const value = useMemo(() => {
    const options = data || {};
    return {
      options,
      loading,
      error,
      reload,
      venues: options.venues || [],
      formats: options.formats || [],
      languages: options.languages || [],
      timeBands: options.timeBands || [],
      sorts: options.sorts || [],
      ticketTypes: options.ticketTypes || [],
      ageRatings: options.ageRatings || [],
      maxSeatsPerOrder: options.maxSeatsPerOrder ?? 3,
      holdMinutes: options.holdMinutes ?? 8,
    };
  }, [data, error, loading, reload]);

  return <FilterOptionsContext.Provider value={value}>{children}</FilterOptionsContext.Provider>;
}

export function useFilterOptions() {
  const ctx = useContext(FilterOptionsContext);
  if (!ctx) throw new Error('useFilterOptions must be used inside FilterOptionsProvider');
  return ctx;
}
