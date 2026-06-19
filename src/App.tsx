import { Routes, Route, Navigate } from "react-router-dom";
import Offline from "./pages/Offline";
import Sidebar from "./components/Sidebar";
import Player from "./components/Player";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Library from "./pages/Library";
import Discover from "./pages/Discover";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import { usePlayerStore } from "./store/playerStore";
import { useAuthStore } from "./store/authStore";
import { useRef, useEffect } from "react";
import Titlebar from "./components/Titlebar";
import TrackPage from "./pages/TrackPage";
import UserPage from "./pages/UserPage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import PlaylistPage from "./pages/PlaylistPage";

function AmbientGlow() {
  const track = usePlayerStore((s) => s.currentTrack);
  if (!track?.artwork) return null;
  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-[400px] opacity-[0.06] blur-[100px] pointer-events-none transition-all duration-[2s] ease-out"
      style={{
        backgroundImage: `url(${track.artwork})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        contain: "strict",
        transform: "translateZ(0)",
      }}
    />
  );
}

export default function App() {
  const sessionId = useAuthStore((s) => s.sessionId);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    let t: ReturnType<typeof setTimeout> | null = null;
    const clear = () => {
      if (t) { clearTimeout(t); t = null; }
      main.removeAttribute("data-scrolling");
    };
    const onScroll = () => {
      main.setAttribute("data-scrolling", "1");
      if (t) clearTimeout(t);
      t = setTimeout(clear, 120);
    };
    main.addEventListener("scroll", onScroll, { passive: true });
    main.addEventListener("pointermove", clear, { passive: true });
    main.addEventListener("pointerdown", clear, { passive: true });
    return () => {
      main.removeEventListener("scroll", onScroll);
      main.removeEventListener("pointermove", clear);
      main.removeEventListener("pointerdown", clear);
      if (t) clearTimeout(t);
    };
  }, []);

  if (!sessionId) return <Login />;

  return (
    <div className="flex flex-col h-screen relative overflow-hidden">
      <AmbientGlow />
      <Titlebar />
      <div className="flex flex-1 min-h-0 relative z-10" style={{ isolation: "isolate" }}>
        <Sidebar />
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto overflow-x-hidden pb-[136px]"
        >
          <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/library/*" element={<Library />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/offline" element={<Offline />} />
            <Route path="/track/:id" element={<TrackPage />} />
            <Route path="/user/:id" element={<UserPage />} />
            <Route path="/playlist/:id" element={<PlaylistPage />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
          </ErrorBoundary>
        </main>
      </div>
      <Player />
    </div>
  );
}

