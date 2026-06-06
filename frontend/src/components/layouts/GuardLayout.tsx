import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  LogOut,
  Menu,
  ScanLine,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { API_BASE_URL, LOCAL_BASE } from "@/lib/api/link";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { NotificationsContainer } from "@/components/shared/notifications";

type GuardUser = {
  id?: number;
  role?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  profile_picture?: string | null;
  featureToggles?: {
    notifications?: boolean;
  } | null;
};

let guardLayoutCache: GuardUser | null = null;

const guardNavigation = [
  { name: "Scanner", href: "/guard", icon: ScanLine },
  { name: "Release Queue", href: "/guard/release", icon: ClipboardCheck },
  { name: "Profile", href: "/guard/profile", icon: UserRound },
];

const GUARD_LAYOUT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

.pz-guard-shell {
  --navy: #071D3B;
  --navy-mid: #0B2E5A;
  --navy-light: #123B75;
  --blue: #1B6ECC;
  --teal: #1A9E75;
  --teal-light: #2DC98F;
  --amber: #EF9F27;
  --red: #E24B4A;
  --white: #FFFFFF;
  --surface: #F4F6FA;
  --surface-2: #EAF0F7;
  --border: #E2E6EE;
  --text-1: #0A1628;
  --text-2: #4A5568;
  --text-3: #8A96A8;
  --font-d: 'Inter', 'Segoe UI', Arial, sans-serif;
  --font-b: 'DM Sans', 'Segoe UI', Arial, sans-serif;
  height: 100vh;
  display: grid;
  grid-template-columns: 268px minmax(0, 1fr);
  background:
    radial-gradient(circle at top left, rgba(26,158,117,0.10), transparent 34rem),
    linear-gradient(180deg, #F7FAFD 0%, #EEF3F8 100%);
  color: var(--text-1);
  font-family: var(--font-b);
  overflow: hidden;
  transition: grid-template-columns 0.22s ease;
}

.pz-guard-shell,
.pz-guard-shell * {
  box-sizing: border-box;
}

.pz-guard-sidebar {
  height: 100vh;
  background: var(--navy);
  color: var(--white);
  position: relative;
  top: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 50;
}

.pz-guard-sidebar::before {
  content: "";
  position: absolute;
  inset: -120px auto auto -120px;
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(45,201,143,0.16), transparent 68%);
  pointer-events: none;
}

.pz-guard-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 22px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  position: relative;
}

.pz-guard-brand-copy,
.pz-guard-nav-text,
.pz-guard-profile-details {
  min-width: 0;
}

.pz-guard-brand-icon,
.pz-guard-avatar-fallback {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}

.pz-guard-brand-icon {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: var(--teal);
  box-shadow: 0 12px 30px rgba(26,158,117,0.28);
}

.pz-guard-brand-title {
  font-family: var(--font-d);
  font-size: 17px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: 0;
}

.pz-guard-brand-sub {
  margin-top: 4px;
  color: rgba(255,255,255,0.42);
  font-size: 11px;
}

.pz-guard-close {
  display: none;
  margin-left: auto;
  width: 34px;
  height: 34px;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 10px;
  background: rgba(255,255,255,0.06);
  color: var(--white);
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.pz-guard-nav {
  position: relative;
  flex: 1;
  padding: 20px 12px;
  overflow-y: auto;
  scrollbar-width: none;
}

.pz-guard-nav::-webkit-scrollbar {
  display: none;
}

.pz-guard-section-label {
  padding: 0 10px 8px;
  color: rgba(255,255,255,0.28);
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0;
}

.pz-guard-nav-link {
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 11px;
  margin: 2px 0;
  padding: 0 12px;
  border-radius: 11px;
  color: rgba(255,255,255,0.62);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.18s ease, color 0.18s ease;
}

.pz-guard-nav-link:hover {
  background: rgba(255,255,255,0.07);
  color: var(--white);
}

.pz-guard-nav-link.active {
  background: rgba(26,158,117,0.18);
  color: var(--white);
  box-shadow: inset 3px 0 0 var(--teal);
}

.pz-guard-nav-link svg {
  width: 19px;
  height: 19px;
  flex: 0 0 auto;
}

.pz-guard-sidebar-footer {
  position: relative;
  padding: 16px 18px 20px;
  border-top: 1px solid rgba(255,255,255,0.08);
}

.pz-guard-profile-summary {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
}

.pz-guard-avatar,
.pz-guard-avatar-fallback {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--navy-light);
  color: var(--white);
  font-family: var(--font-d);
  font-size: 13px;
  font-weight: 800;
}

.pz-guard-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pz-guard-profile-name {
  color: var(--white);
  font-size: 13px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pz-guard-profile-role {
  margin-top: 2px;
  color: rgba(255,255,255,0.38);
  font-size: 11px;
}

.pz-guard-main {
  min-width: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pz-guard-topbar {
  height: 68px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 30px;
  background: rgba(255,255,255,0.86);
  border-bottom: 1px solid rgba(226,230,238,0.86);
  backdrop-filter: blur(14px);
  position: sticky;
  top: 0;
  z-index: 30;
}

.pz-guard-menu-button {
  display: none;
  width: 38px;
  height: 38px;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: var(--white);
  color: var(--navy);
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.pz-guard-collapse-button {
  display: flex;
  width: 38px;
  height: 38px;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: var(--white);
  color: var(--navy);
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease;
}

.pz-guard-collapse-button:hover {
  border-color: var(--blue);
  background: #EFF6FF;
  color: var(--blue);
}

.pz-guard-page-title {
  flex: 1;
  min-width: 0;
}

.pz-guard-page-title h1 {
  margin: 0;
  color: var(--text-1);
  font-family: var(--font-d);
  font-size: 20px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: 0;
}

.pz-guard-page-title p {
  margin: 5px 0 0;
  color: var(--text-3);
  font-size: 12px;
}

.pz-guard-status-pill {
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border-radius: 999px;
  background: #E1F5EE;
  color: #065F46;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.pz-guard-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--teal);
  box-shadow: 0 0 0 5px rgba(26,158,117,0.14);
}

.pz-guard-account {
  position: relative;
}

.pz-guard-account-button {
  min-height: 42px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--border);
  border-radius: 13px;
  background: var(--white);
  padding: 4px 9px 4px 5px;
  color: var(--text-1);
  cursor: pointer;
}

.pz-guard-account-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 92px;
}

.pz-guard-account-name {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 800;
}

.pz-guard-account-role {
  color: var(--text-3);
  font-size: 11px;
}

.pz-guard-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 220px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--white);
  box-shadow: 0 18px 48px rgba(7,29,59,0.14);
  padding: 8px;
  z-index: 60;
}

.pz-guard-menu-item {
  width: 100%;
  min-height: 40px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--text-2);
  padding: 0 10px;
  text-decoration: none;
  font-family: var(--font-b);
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  text-align: left;
}

.pz-guard-menu-item:hover {
  background: var(--surface);
  color: var(--text-1);
}

.pz-guard-menu-item.danger {
  color: var(--red);
}

.pz-guard-content {
  flex: 1;
  width: 100%;
  padding: 30px;
  overflow-y: auto;
}

.pz-guard-loading-screen {
  --text-2: #4A5568;
  --font-b: 'DM Sans', 'Segoe UI', Arial, sans-serif;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: #F7FAFD;
  color: var(--text-2);
  font-family: var(--font-b);
}

.pz-guard-backdrop {
  display: none;
}

@media (min-width: 981px) {
  .pz-guard-shell.collapsed {
    grid-template-columns: 78px minmax(0, 1fr);
  }

  .pz-guard-shell.collapsed .pz-guard-brand {
    justify-content: center;
    padding: 24px 10px 18px;
  }

  .pz-guard-shell.collapsed .pz-guard-brand-copy,
  .pz-guard-shell.collapsed .pz-guard-section-label,
  .pz-guard-shell.collapsed .pz-guard-nav-text,
  .pz-guard-shell.collapsed .pz-guard-profile-details {
    display: none;
  }

  .pz-guard-shell.collapsed .pz-guard-nav {
    padding: 20px 12px;
  }

  .pz-guard-shell.collapsed .pz-guard-nav-link {
    justify-content: center;
    gap: 0;
    padding: 0;
  }

  .pz-guard-shell.collapsed .pz-guard-sidebar-footer {
    padding: 16px 10px 20px;
  }

  .pz-guard-shell.collapsed .pz-guard-profile-summary {
    grid-template-columns: 1fr;
    justify-items: center;
  }
}

@media (max-width: 980px) {
  .pz-guard-shell {
    grid-template-columns: 1fr;
  }

  .pz-guard-sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    width: min(82vw, 292px);
    transform: translateX(-104%);
    transition: transform 0.22s ease;
    box-shadow: 24px 0 80px rgba(7,29,59,0.28);
  }

  .pz-guard-sidebar.open {
    transform: translateX(0);
  }

  .pz-guard-close,
  .pz-guard-menu-button {
    display: flex;
  }

  .pz-guard-collapse-button {
    display: none;
  }

  .pz-guard-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(7,29,59,0.48);
    z-index: 45;
  }
}

@media (max-width: 640px) {
  .pz-guard-topbar {
    height: auto;
    min-height: 62px;
    padding: 10px 14px;
  }

  .pz-guard-status-pill,
  .pz-guard-account-meta {
    display: none;
  }

  .pz-guard-content {
    padding: 18px 14px 24px;
  }
}
`;

export default function GuardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GuardUser | null>(guardLayoutCache);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("pickupzone:guard:sidebar-collapsed") === "true";
  });
  const [loading, setLoading] = useState(!guardLayoutCache);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem("pickupzone:guard:sidebar-collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      guardLayoutCache = null;
      navigate("/login");
      return;
    }

    fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        if (data.role !== "guard") {
          const fallbackPath =
            data.role === "admin"
              ? "/admin"
              : data.role === "parent"
                ? "/parent"
                : data.role === "super-admin"
                  ? "/super-admin"
                  : "/login";
          navigate(fallbackPath, { replace: true });
          return;
        }

        guardLayoutCache = data;
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        guardLayoutCache = null;
        localStorage.removeItem("token");
        navigate("/login");
        setLoading(false);
      });
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const profileMenu = document.getElementById("guard-profile-menu");
      if (profileMenu && !profileMenu.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleProfileUpdate = (event: Event) => {
      const updatedUser = (event as CustomEvent).detail;
      if (!updatedUser) return;

      setUser((current) => {
        const merged = { ...(current || {}), ...updatedUser };
        guardLayoutCache = merged;
        return merged;
      });
    };

    window.addEventListener("pickupzone:user-updated", handleProfileUpdate as EventListener);
    return () => window.removeEventListener("pickupzone:user-updated", handleProfileUpdate as EventListener);
  }, []);

  const handleLogout = () => {
    guardLayoutCache = null;
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="pz-guard-loading-screen">
        <style>{GUARD_LAYOUT_CSS}</style>
        <LoadingSpinner size="lg" label="Loading guard workspace" />
        <span>Loading guard workspace...</span>
      </div>
    );
  }

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.email ||
    "Guard";
  const activeItem =
    guardNavigation.find((item) =>
      item.href === "/guard"
        ? location.pathname === "/guard"
        : location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
    ) || guardNavigation[0];
  const avatarSrc = user?.profile_picture ? `${LOCAL_BASE}${user.profile_picture}` : null;
  const notificationsEnabled = true;

  return (
    <div className={`pz-guard-shell${sidebarCollapsed ? " collapsed" : ""}`}>
      <style>{GUARD_LAYOUT_CSS}</style>
      {sidebarOpen && <div className="pz-guard-backdrop" onClick={() => setSidebarOpen(false)} />}

      <aside className={`pz-guard-sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="pz-guard-brand">
          <div className="pz-guard-brand-icon">
            <ShieldCheck size={21} aria-hidden="true" />
          </div>
          <div className="pz-guard-brand-copy">
            <div className="pz-guard-brand-title">Pickup Zone</div>
            <div className="pz-guard-brand-sub">Gate Console</div>
          </div>
          <button type="button" className="pz-guard-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <nav className="pz-guard-nav" aria-label="Guard navigation">
          <div className="pz-guard-section-label">Workspace</div>
          {guardNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem.href === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`pz-guard-nav-link${isActive ? " active" : ""}`}
                onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? item.name : undefined}
                aria-label={item.name}
              >
                <Icon aria-hidden="true" />
                <span className="pz-guard-nav-text">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pz-guard-sidebar-footer">
          <div className="pz-guard-profile-summary">
            <Avatar src={avatarSrc} name={displayName} />
            <div className="pz-guard-profile-details">
              <div className="pz-guard-profile-name">{displayName}</div>
              <div className="pz-guard-profile-role">Guard</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="pz-guard-main">
        <header className="pz-guard-topbar">
          <button type="button" className="pz-guard-menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
            <Menu size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="pz-guard-collapse-button"
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            aria-label={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
            title={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
          >
            {sidebarCollapsed ? (
              <ChevronRight size={18} aria-hidden="true" />
            ) : (
              <ChevronLeft size={18} aria-hidden="true" />
            )}
          </button>

          <div className="pz-guard-page-title">
            <h1>{activeItem.name}</h1>
            <p>{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
          </div>

          <div className="pz-guard-status-pill">
            <span className="pz-guard-status-dot" />
            On duty
          </div>

          {notificationsEnabled && <NotificationsContainer />}

          <div className="pz-guard-account" id="guard-profile-menu">
            <button type="button" className="pz-guard-account-button" onClick={() => setProfileOpen((open) => !open)}>
              <Avatar src={avatarSrc} name={displayName} />
              <span className="pz-guard-account-meta">
                <span className="pz-guard-account-name">{displayName}</span>
                <span className="pz-guard-account-role">Guard</span>
              </span>
              <ChevronDown size={16} aria-hidden="true" />
            </button>

            {profileOpen && (
              <div className="pz-guard-menu">
                <Link className="pz-guard-menu-item" to="/guard/profile" onClick={() => setProfileOpen(false)}>
                  <UserRound size={16} aria-hidden="true" />
                  Profile Settings
                </Link>
                <button type="button" className="pz-guard-menu-item danger" onClick={handleLogout}>
                  <LogOut size={16} aria-hidden="true" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="pz-guard-content">{children}</main>
      </div>
    </div>
  );
}

function Avatar({ src, name }: { src: string | null; name: string }) {
  return (
    <span className="pz-guard-avatar">
      {src ? (
        <img src={src} alt={name} />
      ) : (
        <span className="pz-guard-avatar-fallback">{getInitials(name)}</span>
      )}
    </span>
  );
}

function getInitials(name: string) {
  const parts = String(name || "G").trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] || "G"}${parts[1]?.[0] || ""}`.toUpperCase();
}
