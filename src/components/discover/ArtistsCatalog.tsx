import { memo, useCallback, useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import type { Aura } from '../../lib/aura';
import {
  type ArtistSort,
  type TagFilter,
  flattenPages,
  reachedHardCap,
  useDiscoverArtists,
  useDiscoverTags,
} from '../../lib/discover';
import { Skeleton } from '../ui/Skeleton';
import { VirtualGrid } from '../ui/VirtualGrid';
import { ArtistGridCard } from './ArtistGridCard';
import { FilterRow } from './FilterRow';
import { InfiniteSentinel } from './InfiniteSentinel';

interface ArtistsCatalogProps {
  aura: Aura;
  query: string;
}

const SORT_OPTIONS: ReadonlyArray<{ id: ArtistSort; label: string }> = [
  { id: 'popular', label: 'Popular' },
  { id: 'trending', label: 'Trending' },
  { id: 'listeners', label: 'Listeners' },
  { id: 'tracks', label: 'Tracks' },
  { id: 'star', label: 'Star' },
  { id: 'az', label: 'A–Z' },
];

function ArtistsCatalogImpl({ aura, query }: ArtistsCatalogProps) {
  const [sort, setSort] = useState<ArtistSort>('popular');
  const [tag, setTag] = useState<TagFilter>('all');

  const tagsQuery = useDiscoverTags(8);
  const artistsQuery = useDiscoverArtists({ sort, tag, q: query });
  const items = useMemo(() => flattenPages(artistsQuery.data), [artistsQuery.data]);
  const cappedMore = useMemo(() => reachedHardCap(artistsQuery.data), [artistsQuery.data]);

  const loadMore = useCallback(() => {
    if (!artistsQuery.isFetchingNextPage && artistsQuery.hasNextPage) {
      artistsQuery.fetchNextPage();
    }
  }, [artistsQuery]);

  const tagOptions = useMemo<ReadonlyArray<{ id: TagFilter; label: string; count?: number }>>(
    () => [
      { id: 'all', label: 'All' },
      ...(tagsQuery.data?.items ?? []).map((tg) => ({
        id: tg.id,
        label: tg.label,
        count: tg.count,
      })),
    ],
    [tagsQuery.data],
  );

  const isInitialLoading = artistsQuery.isLoading;
  const isEmpty = !isInitialLoading && items.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <FilterRow options={tagOptions} active={tag} onChange={setTag} aura={aura} />
        <FilterRow options={SORT_OPTIONS} active={sort} onChange={setSort} aura={aura} size="sm" />
      </div>

      {isInitialLoading ? (
        <SkeletonGrid />
      ) : isEmpty ? (
        <EmptyArtists query={query} />
      ) : (
        <VirtualGrid
          items={items}
          itemHeight={320}
          minColumnWidth={210}
          gap={20}
          overscan={3}
          disabled={items.length < 30}
          getItemKey={(a) => a.id}
          renderItem={(a) => <ArtistGridCard artist={a} />}
        />
      )}

      <InfiniteSentinel
        hasMore={Boolean(artistsQuery.hasNextPage)}
        isFetching={artistsQuery.isFetchingNextPage}
        onLoadMore={loadMore}
      />
      {artistsQuery.isFetchingNextPage && (
        <div className="py-4 flex justify-center">
          <Skeleton className="h-3 w-24 rounded-full" />
        </div>
      )}
      {cappedMore && !artistsQuery.isFetchingNextPage && <RefineHint />}
    </div>
  );
}

const RefineHint = memo(function RefineHint() {
  return (
    <div className="pt-2 pb-4 flex justify-center">
      <span className="text-[11px] font-medium text-white/35 text-center max-w-[420px] leading-relaxed">
        Уточни поиск — достигнут лимит результатов
      </span>
    </div>
  );
});

const SkeletonGrid = memo(function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="h-[320px] rounded-3xl" />
      ))}
    </div>
  );
});

const EmptyArtists = memo(function EmptyArtists({ query }: { query: string }) {
  return (
    <div className="py-24 flex flex-col items-center gap-4">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(255,255,255,0.06)',
        }}
      >
        <Users size={24} className="text-white/15" />
      </div>
      <p className="text-white/30 text-sm">
        {query ? `No artists matching "${query}"` : 'No artists found'}
      </p>
    </div>
  );
});

export const ArtistsCatalog = memo(ArtistsCatalogImpl);