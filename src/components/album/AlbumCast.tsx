import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Aura, auraRgba } from '../../lib/aura';
import { usePerfMode } from '../../lib/perf';
import { Avatar } from '../ui/Avatar';
import type { AlbumArtist } from './types';

const UsersIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const ROLE_LABELS: Record<string, string> = {
  primary: 'Primary artist',
  featured: 'Featured',
  remixer: 'Remixer',
  producer: 'Producer',
};

const ROLE_ORDER = ['primary', 'featured', 'remixer', 'producer'];

interface CastGroup { role: string; items: AlbumArtist[] }

function groupByRole(artists: AlbumArtist[]): CastGroup[] {
  const map = new Map<string, AlbumArtist[]>();
  for (const a of artists) {
    const arr = map.get(a.role) ?? [];
    arr.push(a);
    map.set(a.role, arr);
  }
  const ordered: CastGroup[] = [];
  for (const k of ROLE_ORDER) {
    const items = map.get(k);
    if (items?.length) { ordered.push({ role: k, items }); map.delete(k); }
  }
  for (const [k, items] of map) {
    if (items.length) ordered.push({ role: k, items });
  }
  return ordered;
}

const CastCard = memo(function CastCard({ artist, roleLabel, aura }: { artist: AlbumArtist; roleLabel: string; aura: Aura }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(`/user/${artist.id}`)}
      className="group relative flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all duration-500 hover:scale-[1.04]"
      style={{ background: 'rgba(255,255,255,0.03)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)' }}
    >
      <span
        className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 ring-2 ring-white/10 group-hover:ring-white/30 transition-all duration-500"
        style={{ boxShadow: `0 8px 18px ${auraRgba(aura, 0.18)}` }}
      >
        <Avatar src={artist.avatar_url} alt={artist.name} size={48} />
      </span>
      <span className="min-w-0 flex flex-col leading-tight">
        <span className="text-[12px] font-semibold text-white/90 truncate group-hover:text-white">{artist.name}</span>
        <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">{roleLabel}</span>
      </span>
    </button>
  );
});

interface AlbumCastProps { artists: AlbumArtist[]; aura: Aura }

function AlbumCastImpl({ artists, aura }: AlbumCastProps) {
  const perf = usePerfMode();
  const groups = useMemo(() => groupByRole(artists), [artists]);
  const b = perf.blur(28);

  if (artists.length === 0) return null;

  return (
    <div
      className="rounded-[2rem] p-5 md:p-7"
      style={{
        background: b > 0
          ? 'linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.015) 100%)'
          : 'rgba(18,18,22,0.85)',
        backdropFilter: b > 0 ? `blur(${b}px) saturate(160%)` : undefined,
        WebkitBackdropFilter: b > 0 ? `blur(${b}px) saturate(160%)` : undefined,
        boxShadow: '0 30px 80px rgba(0,0,0,0.30), inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div className="flex items-center gap-3 mb-5">
        <span
          className="w-8 h-8 rounded-xl flex items-center justify-center text-white/70"
          style={{ background: auraRgba(aura, 0.12), boxShadow: `inset 0 0 0 1px ${auraRgba(aura, 0.25)}` }}
        >
          <UsersIcon />
        </span>
        <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/60">
          Cast <span className="text-white/25 ml-2">{artists.length}</span>
        </h3>
      </div>

      <div className="flex flex-col gap-6">
        {groups.map((g) => {
          const roleLabel = ROLE_LABELS[g.role] ?? g.role;
          return (
            <div key={g.role} className="flex flex-col gap-3">
              <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-white/30">
                {roleLabel} · {g.items.length}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {g.items.map((artist) => (
                  <CastCard key={artist.id} artist={artist} roleLabel={roleLabel} aura={aura} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const AlbumCast = memo(AlbumCastImpl);