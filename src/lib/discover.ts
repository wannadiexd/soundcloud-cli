import { type InfiniteData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api } from './api-client';
import type { AuraId } from './aura';

export type AlbumKind = 'album' | 'ep' | 'single' | 'compilation';
export type ArtistSort = 'popular' | 'trending' | 'listeners' | 'tracks' | 'az';
export type AlbumSort = 'recent' | 'popular' | 'tracks' | 'az';
export type AlbumKindFilter = 'all' | AlbumKind;

export interface CatalogArtist {
  id: string;
  name: string;
  country?: string;
  avatar_url?: string;
  track_count_primary: number;
  track_count_featured: number;
  album_count: number;
  monthly_listeners: number;
  trending: number;
  popularity: number;
  tags: string[];
  star: boolean;
  aura_id?: AuraId | 'custom' | null;
  custom_hex?: string | null;
  confidence: number;
}

export interface CatalogAlbum {
  id: string;
  title: string;
  type: AlbumKind;
  release_year?: number | null;
  release_month?: number | null;
  cover_url?: string;
  primary_artist: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  track_count: number;
  total_duration_ms: number;
  popularity: number;
  star: boolean;
}

export interface DiscoverSummary {
  artists_count: number;
  albums_count: number;
  fresh_count: number;
  fresh_window_days: number;
}

export interface CursorPage<T> {
  items: T[];
  next_cursor?: string | null;
}

export interface SpotlightItem {
  kind: 'artist' | 'album';
  artist?: CatalogArtist;
  album?: CatalogAlbum;
}

export interface SpotlightResponse {
  items: SpotlightItem[];
}

const PAGE_LIMIT = 80;
const MAX_PAGES = 5;
export const DISCOVER_MIN_SEARCH_LEN = 2;
export const DISCOVER_HARD_CAP = PAGE_LIMIT * MAX_PAGES;

const buildUrl = (path: string, params: Record<string, string | undefined | null>) => {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === '') continue;
    usp.set(k, v);
  }
  const qs = usp.toString();
  return qs ? `${path}?${qs}` : path;
};

const sanitizeSearch = (q: string | undefined) => {
  if (!q) return undefined;
  const t = q.trim();
  return t.length < DISCOVER_MIN_SEARCH_LEN ? undefined : t;
};

export function useDiscoverSummary() {
  return useQuery<DiscoverSummary>({
    queryKey: ['discover', 'summary'],
    queryFn: () => api<DiscoverSummary>('/discover/summary'),
    staleTime: 60_000,
  });
}

export function useDiscoverSpotlight(limit?: number) {
  return useQuery<SpotlightResponse>({
    queryKey: ['discover', 'spotlight', limit ?? 'default'],
    queryFn: () =>
      api<SpotlightResponse>(
        buildUrl('/discover/spotlight', {
          limit: limit != null ? String(limit) : undefined,
        }),
      ),
    staleTime: 5 * 60_000,
  });
}

export function useDiscoverArtists(params: { sort: ArtistSort; q?: string }) {
  const { sort, q } = params;
  const search = sanitizeSearch(q);
  return useInfiniteQuery({
    queryKey: ['discover', 'artists', sort, search] as const,
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      api<CursorPage<CatalogArtist>>(
        buildUrl('/discover/artists', {
          sort,
          q: search,
          cursor: pageParam,
          limit: String(PAGE_LIMIT),
        }),
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: CursorPage<CatalogArtist>, allPages: CursorPage<CatalogArtist>[]) =>
      allPages.length >= MAX_PAGES ? undefined : (last.next_cursor ?? undefined),
    staleTime: 60_000,
    maxPages: MAX_PAGES,
  });
}

export function useDiscoverAlbums(params: { sort: AlbumSort; kind?: AlbumKindFilter; q?: string }) {
  const { sort, kind, q } = params;
  const kindParam = kind && kind !== 'all' ? kind : undefined;
  const search = sanitizeSearch(q);
  return useInfiniteQuery({
    queryKey: ['discover', 'albums', sort, kindParam, search] as const,
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      api<CursorPage<CatalogAlbum>>(
        buildUrl('/discover/albums', {
          sort,
          kind: kindParam,
          q: search,
          cursor: pageParam,
          limit: String(PAGE_LIMIT),
        }),
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: CursorPage<CatalogAlbum>, allPages: CursorPage<CatalogAlbum>[]) =>
      allPages.length >= MAX_PAGES ? undefined : (last.next_cursor ?? undefined),
    staleTime: 60_000,
    maxPages: MAX_PAGES,
  });
}

export async function fetchDiscoverRandom(kind: 'album' | 'artist'): Promise<string | null> {
  try {
    const res = await api<{ id: string }>(buildUrl('/discover/random', { type: kind }));
    return res.id ?? null;
  } catch {
    return null;
  }
}

export function flattenPages<T>(data: InfiniteData<CursorPage<T>> | undefined): T[] {
  if (!data) return [];
  const out: T[] = [];
  for (const p of data.pages) {
    if (p?.items) out.push(...p.items);
  }
  return out;
}