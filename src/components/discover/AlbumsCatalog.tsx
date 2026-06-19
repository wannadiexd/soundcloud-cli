import { memo, useCallback, useMemo, useState } from 'react';
import { Disc3 } from 'lucide-react';
import { type Aura, auraRgba } from '../../lib/aura';
import {
  type AlbumKindFilter,
  type AlbumSort,
  type CatalogAlbum,
  flattenPages,
  useDiscoverAlbums,
} from '../../lib/discover';
import { Skeleton } from '../ui/Skeleton';
import { VirtualGrid } from '../ui/VirtualGrid';
import { AlbumGridCard } from './AlbumGridCard';
import { FilterRow } from './FilterRow';
import { InfiniteSentinel } from './InfiniteSentinel';

interface AlbumsCatalogProps {
  aura: Aura;
  query: string;
}

const KIND_OPTIONS: ReadonlyArray<{ id: AlbumKindFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'album', label: 'Album' },
  { id: 'ep', label: 'EP' },
  { id: 'single', label: 'Single' },
  { id: 'compilation', label: 'Compilation' },
];

const SORT_OPTIONS: ReadonlyArray<{ id: AlbumSort; label: string }> = [
  { id: 'recent', label: 'Recent' },
  { id: 'popular', label: 'Popular' },
  { id: 'tracks', label: 'Tracks' },
  { id: 'az', label: 'A–Z' },
];

function AlbumsCatalogImpl({ aura, query }: AlbumsCatalogProps) {
  const [kind, setKind] = useState<AlbumKindFilter>('all');
  const [sort, setSort] = useState<AlbumSort>('recent');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <FilterRow options={KIND_OPTIONS} active={kind} onChange={setKind} aura={aura} />
        <FilterRow options={SORT_OPTIONS} active={sort} onChange={setSort} aura={aura} size="sm" />
      </div>
      <FlatAlbumsView sort={sort} kind={kind} query={query} aura={aura} />
    </div>
  );
}

const FlatAlbumsView = memo(function FlatAlbumsView({
  sort,
  kind,
  query,
  aura,
}: {
  sort: AlbumSort;
  kind: AlbumKindFilter;
  query: string;
  aura: Aura;
}) {
  const albumsQuery = useDiscoverAlbums({ sort, kind, q: query });
  const items = useMemo(() => flattenPages(albumsQuery.data), [albumsQuery.data]);

  const loadMore = useCallback(() => {
    if (!albumsQuery.isFetchingNextPage && albumsQuery.hasNextPage) {
      albumsQuery.fetchNextPage();
    }
  }, [albumsQuery]);

  const isInitialLoading = albumsQuery.isLoading;
  const isEmpty = !isInitialLoading && items.length === 0;

  return (
    <div className="flex flex-col gap-6">
      {isInitialLoading ? (
        <SkeletonGrid />
      ) : isEmpty ? (
        <EmptyAlbums query={query} />
      ) : (
        <VirtualGrid
          items={items}
          itemHeight={300}
          minColumnWidth={180}
          gap={20}
          overscan={3}
          disabled={items.length < 40}
          getItemKey={(a) => a.id}
          renderItem={(a) => <AlbumGridCard album={a} aura={aura} />}
        />
      )}
      <InfiniteSentinel
        hasMore={Boolean(albumsQuery.hasNextPage)}
        isFetching={albumsQuery.isFetchingNextPage}
        onLoadMore={loadMore}
      />
      {albumsQuery.isFetchingNextPage && (
        <div className="py-4 flex justify-center">
          <Skeleton className="h-3 w-24 rounded-full" />
        </div>
      )}
    </div>
  );
});

const YearGroup = memo(function YearGroup({
  year,
  items,
  aura,
}: {
  year: number;
  items: CatalogAlbum[];
  aura: Aura;
}) {
  return (
    <div className="flex flex-col md:flex-row md:gap-8 gap-4">
      <div className="md:w-[200px] md:shrink-0 flex md:flex-col md:items-end items-center md:sticky md:top-24 self-start">
        <div className="flex items-baseline gap-3 md:flex-col md:items-end md:gap-1 min-w-0 max-w-full">
          <span
            className="font-black leading-none tabular-nums tracking-tight whitespace-nowrap text-[clamp(48px,7vw,80px)]"
            style={{
              background: `linear-gradient(180deg, ${auraRgba(aura, 0.95)}, ${auraRgba(aura, 0.4)})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: `drop-shadow(0 4px 24px ${auraRgba(aura, 0.35)})`,
            }}
          >
            {year}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/30 md:text-right whitespace-nowrap">
            Releases · {items.length}
          </span>
        </div>
      </div>
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {items.map((al) => (
          <AlbumGridCard key={al.id} album={al} aura={aura} />
        ))}
      </div>
    </div>
  );
});

export { YearGroup };

const SkeletonGrid = memo(function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="h-[300px] rounded-3xl" />
      ))}
    </div>
  );
});

const EmptyAlbums = memo(function EmptyAlbums({ query }: { query: string }) {
  return (
    <div className="py-24 flex flex-col items-center gap-4">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(255,255,255,0.06)',
        }}
      >
        <Disc3 size={24} className="text-white/15" />
      </div>
      <p className="text-white/30 text-sm">
        {query ? `No albums matching "${query}"` : 'No albums found'}
      </p>
    </div>
  );
});

export const AlbumsCatalog = memo(AlbumsCatalogImpl);