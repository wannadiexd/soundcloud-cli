export default function Feed() {
  return (
    <div className="w-full max-w-[1480px] mx-auto px-8 pt-10 pb-32">
      <div className="mb-5">
        <h2 className="text-[22px] font-bold leading-tight tracking-[-0.015em] text-white/90">
          Feed
        </h2>
        <p className="mt-1 text-[13px] leading-snug text-white/50">
          Latest from people you follow
        </p>
      </div>

      <div
        className="rounded-2xl p-5 mb-6"
        style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <p className="text-white/80 font-medium text-[13px] mb-1">This is your feed</p>
        <p className="text-white/40 text-[12px]">
          Follow your favorite artists, labels and friends on SoundCloud and see every track they post right here.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <div className="w-14 h-14 rounded-full bg-white/[0.04] flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="text-white/25">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
        </div>
        <p className="text-white/40 text-[14px]">Follow artists to see their latest tracks here</p>
      </div>
    </div>
  );
}