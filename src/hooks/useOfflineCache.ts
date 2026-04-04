import { useEffect, useState } from 'react';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

interface OfflineCacheResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  isCached: boolean;
  error: Error | null;
}

export function useOfflineCache<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'>
): OfflineCacheResult<T> {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const cacheKey = `offline_cache_${queryKey.join('_')}`;

  const getCachedData = (): T | undefined => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached) as T;
    } catch { /* ignore */ }
    return undefined;
  };

  const query = useQuery<T, Error>({
    queryKey,
    queryFn: async () => {
      const result = await queryFn();
      try {
        localStorage.setItem(cacheKey, JSON.stringify(result));
      } catch { /* storage full, ignore */ }
      return result;
    },
    enabled: isOnline,
    ...options,
  });

  if (!isOnline) {
    const cached = getCachedData();
    return {
      data: cached,
      isLoading: false,
      isError: cached === undefined,
      isCached: cached !== undefined,
      error: cached === undefined ? new Error('Offline and no cached data') : null,
    };
  }

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isCached: false,
    error: query.error,
  };
}
