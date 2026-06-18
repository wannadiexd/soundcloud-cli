import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuthStore } from "../store/authStore";

const HomeIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const SearchIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const CompassIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>;
const LibraryIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>;
const DownloadIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const ClockIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const SettingsIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
const PanelCloseIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>;
const PanelOpenIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/></svg>;

const navItems = [
  { to: "/home",     icon: HomeIcon,    label: "Home" },
  { to: "/search",   icon: SearchIcon,  label: "Search" },
  { to: "/discover", icon: CompassIcon, label: "Discover" },
  { to: "/library",  icon: LibraryIcon, label: "Library" },
  { to: "/offline",  icon: DownloadIcon,label: "Offline" },
];

const LABEL_T = "max-width 320ms cubic-bezier(0.2,0.8,0.2,1), opacity 240ms ease, padding-left 320ms cubic-bezier(0.2,0.8,0.2,1)";
const ROW = "group relative w-full flex items-center h-10 rounded-xl transition-all duration-200";
const ACTIVE_STYLE: React.CSSProperties = {
  color: "#fff",
  background: "linear-gradient(180deg, var(--color-accent-glow), transparent), rgba(255,255,255,0.05)",
  boxShadow: "0 0 18px var(--color-accent-glow), inset 0 0.5px 0 rgba(255,255,255,0.14)",
};

function Label({ collapsed, children }: { collapsed: boolean; children: React.ReactNode }) {
  return (
    <span
      className="overflow-hidden whitespace-nowrap text-[13px] font-medium"
      style={{ maxWidth: collapsed ? 0 : "142px", opacity: collapsed ? 0 : 1, transition: LABEL_T }}
    >
      {children}
    </span>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const btnCls = `${ROW} text-white/45 hover:text-white/80 hover:bg-white/[0.05] cursor-pointer`;

  return (
    <aside
      className="shrink-0 flex flex-col h-full overflow-hidden border-r border-white/[0.05] pb-3 transition-[width] duration-300"
      style={{ width: collapsed ? 56 : 196, transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
    >
      <nav className="flex flex-col gap-0.5 px-2 pt-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `${ROW} ${isActive ? "" : "text-white/45 hover:text-white/80 hover:bg-white/[0.05]"}`
            }
            style={({ isActive }) => (isActive ? ACTIVE_STYLE : undefined)}
          >
            <span className="w-10 shrink-0 flex items-center justify-center"><Icon /></span>
            <Label collapsed={collapsed}>{label}</Label>
          </NavLink>
        ))}
      </nav>

      <div className="px-2 pt-4 space-y-0.5">
        <div className="relative h-5 mx-1 mb-0.5">
          <span
            className="absolute inset-x-0 top-1/2 h-px bg-white/[0.07]"
            style={{ opacity: collapsed ? 1 : 0, transition: "opacity 240ms ease" }}
          />
          <span
            className="absolute inset-0 flex items-center px-2 text-[10px] uppercase tracking-[0.18em] text-white/25 font-semibold whitespace-nowrap"
            style={{ opacity: collapsed ? 0 : 1, transition: "opacity 240ms ease" }}
          >
            Quick access
          </span>
        </div>
        <NavLink
          to="/library/history"
          title={collapsed ? "History" : undefined}
          className={({ isActive }) =>
            `${ROW} ${isActive ? "" : "text-white/45 hover:text-white/80 hover:bg-white/[0.05]"}`
          }
          style={({ isActive }) => (isActive ? ACTIVE_STYLE : undefined)}
        >
          <span className="w-10 shrink-0 flex items-center justify-center"><ClockIcon /></span>
          <Label collapsed={collapsed}>History</Label>
        </NavLink>
      </div>

      <div className="flex-1" />

      <div className="px-2 flex flex-col gap-0.5">
        <NavLink
          to="/settings"
          title={collapsed ? "Settings" : undefined}
          className={({ isActive }) =>
            `${ROW} ${isActive ? "" : "text-white/45 hover:text-white/80 hover:bg-white/[0.05]"}`
          }
          style={({ isActive }) => (isActive ? ACTIVE_STYLE : undefined)}
        >
          <span className="w-10 shrink-0 flex items-center justify-center"><SettingsIcon /></span>
          <Label collapsed={collapsed}>Settings</Label>
        </NavLink>

        <button onClick={() => setCollapsed(!collapsed)} className={btnCls} title={collapsed ? "Expand" : undefined}>
          <span className="w-10 shrink-0 flex items-center justify-center">
            {collapsed ? <PanelOpenIcon /> : <PanelCloseIcon />}
          </span>
          <Label collapsed={collapsed}>Collapse</Label>
        </button>

        {user && (
          <button
            onClick={() => navigate("/settings")}
            className={`${ROW} hover:bg-white/[0.05] cursor-pointer mt-1`}
            title={collapsed ? user.username : undefined}
          >
            <span className="w-10 shrink-0 flex items-center justify-center">
              <img src={user.avatar} alt={user.username} className="w-[26px] h-[26px] rounded-full object-cover ring-1 ring-white/10" />
            </span>
            <span
              className="overflow-hidden whitespace-nowrap text-[12.5px] text-white/55 font-medium truncate"
              style={{ maxWidth: collapsed ? 0 : "120px", opacity: collapsed ? 0 : 1, transition: LABEL_T }}
            >
              {user.username}
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}