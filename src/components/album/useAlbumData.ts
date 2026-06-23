import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api-client';
import type { AlbumDetail } from './types';

export function useAlbumDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['album', id],
    queryFn: () => api<AlbumDetail>(`/albums/${encodeURIComponent(id!)}`),
    enabled: !!id,
    staleTime: 60_000,
  });
}