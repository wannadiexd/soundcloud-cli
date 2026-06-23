import { Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlbumHero } from '../components/album/AlbumHero';
import { AlbumCast } from '../components/album/AlbumCast';
import { AlbumTrackList } from '../components/album/AlbumTrackList';
import { AuraField } from '../components/AuraField';
import { USER_PAGE_KEYFRAMES } from '../components/user/keyframes';
import { useViewerAura } from '../lib/useViewerAura';
import { getPlaylist } from '../api/soundcloud';
import type { AlbumDetail } from '../components/album/types';
import type { Track } from '../store/playerStore';

function Spinner() {
  return (
    <div className="relative w-full min-h-screen flex items-center justify-center">
      <div className="w-7 h-7 rounded-full border-2 border-white/10 border-t-white/50 animate-spin" />
    </div>
  );
}

function AlbumPageInner() {
  const { id } = useParams<{ id: string }>();
  const aura = useViewerAura();

  const { data, isLoading, error } = useQuery({
    queryKey: ['album', id],
    queryFn: async () => {
      const playlist = await getPlaylist(id!);
      const album: AlbumDetail = {
        id: String(playlist.id),
        title: playlist.title,
        type: playlist.isAlbum ? 'album' : (playlist.kind ?? 'playlist'),
        release_year: undefined,
        cover_url: playlist.artwork ?? undefined,
        confidence: 1,
        primary_artist: {
          id: playlist.user.id,
          name: playlist.user.username,
          role: 'primary',
          avatar_url: playlist.user.avatar ?? undefined,
        },
        artists: [
          {
            id: playlist.user.id,
            name: playlist.user.username,
            role: 'primary',
            avatar_url: playlist.user.avatar ?? undefined,
          },
        ],
        tracks: playlist.tracks as Track[],
      };
      return album;
    },
    enabled: !!id,
    staleTime: 60_000,
  });

  if (isLoading) return <Spinner />;

  if (error || !data) {
    return (
      <div className="relative w-full min-h-screen flex items-center justify-center text-white/40 text-sm">
        Failed to load album
      </div>
    );
  }

  return (
    <>
      <style>{USER_PAGE_KEYFRAMES}</style>
      <div className="relative w-full min-h-screen">
        <AuraField aura={aura} isStar={false} />
        <div
          className="relative z-10 w-full max-w-[1480px] mx-auto px-4 md:px-8 pt-10 md:pt-16 pb-32 flex flex-col gap-8"
          style={{ isolation: 'isolate' }}
        >
          <AlbumHero album={data} hasStar={false} aura={aura} />
          <AlbumCast artists={data.artists} aura={aura} />
          <AlbumTrackList tracks={data.tracks} aura={aura} />
        </div>
      </div>
    </>
  );
}

export default function AlbumPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AlbumPageInner />
    </Suspense>
  );
}