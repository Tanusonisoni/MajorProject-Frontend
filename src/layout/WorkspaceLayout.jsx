import { createElement, useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Award,
  Bell,
  BookOpen,
  CheckSquare,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  ChevronDown,
  Target,
  UserRound,
  Users,
  X,
} from "lucide-react";
import "./Workspace.css";

const studentLinks = [
  { label: "Dashboard", to: "/student/dashboard", icon: LayoutDashboard },
  { label: "Lessons", to: "/student/lessons", icon: BookOpen },
  { label: "Quizzes", to: "/student/quizzes", icon: ClipboardList },
  { label: "Challenges", to: "/student/challenges", icon: Target },
  { label: "My submissions", to: "/student/submissions", icon: CheckSquare },
  { label: "Leaderboard", to: "/student/leaderboard", icon: Award },
  { label: "Profile", to: "/student/profile", icon: UserRound },
  { label: "Notifications", to: "/student/notifications", icon: Bell },
];

const adminLinks = [
  { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Lessons", to: "/admin/lessons", icon: BookOpen },
  { label: "Quizzes", to: "/admin/quizzes", icon: ClipboardList },
  { label: "Challenges", to: "/admin/challenges", icon: Target },
  { label: "Submissions", to: "/admin/submissions", icon: CheckSquare },
  { label: "Students", to: "/admin/users", icon: Users },
  { label: "Leaderboard", to: "/admin/leaderboard", icon: Award },
];

export default function WorkspaceLayout({ role, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileNotice, setProfileNotice] = useState("");
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const links = role === "admin" ? adminLinks : studentLinks;
  const userName = localStorage.getItem("userName") || (role === "admin" ? "Admin" : "Learner");

  useEffect(() => {
    if (!profileOpen) return undefined;
    function closeOutside(event) {
      if (!profileRef.current?.contains(event.target)) setProfileOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key === "Escape") setProfileOpen(false);
    }
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileOpen]);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    navigate("/login", { replace: true });
  }

  return (
    <div className={`workspace ${collapsed ? "workspace--collapsed" : ""}`}>
      <div
        className={`workspace-backdrop ${drawerOpen ? "is-visible" : ""}`}
        onClick={() => { setDrawerOpen(false); setProfileOpen(false); }}
        aria-hidden="true"
      />
      <aside className={`workspace-sidebar ${drawerOpen ? "is-open" : ""}`}>
        <div className="workspace-brand">
          <span className="workspace-brand-mark">E</span>
          <div className="workspace-brand-copy">
            <strong>EcoQuest</strong>
            <span>{role === "admin" ? "Admin workspace" : "Learning space"}</span>
          </div>
          <button
            className="workspace-icon-button workspace-close"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation"
            type="button"
          >
            <X size={19} />
          </button>
        </div>

        <nav className="workspace-nav" aria-label={`${role} navigation`}>
          {links.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) =>
                `workspace-nav-link ${isActive ? "is-active" : ""}`
              }
              title={label}
            >
              {createElement(Icon, { size: 19, strokeWidth: 1.9 })}
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="workspace-sidebar-footer">
          <p>Learn today, protect tomorrow.</p>
          <button type="button" className="workspace-nav-link" onClick={logout}>
            <LogOut size={19} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="workspace-main">
        <header className="workspace-topbar">
          <button
            className="workspace-icon-button workspace-menu"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            type="button"
          >
            <Menu size={21} />
          </button>
          <div className="workspace-topbar-title">
            <span>EcoQuest</span>
            <span className="workspace-topbar-divider">/</span>
            <span>{role === "admin" ? "Admin" : "Student"}</span>
          </div>
          {role === "admin" ? (
            <div className="workspace-account-menu" ref={profileRef}>
              <button type="button" className="workspace-account workspace-account-trigger" aria-haspopup="menu" aria-expanded={profileOpen} onClick={() => setProfileOpen((value) => !value)}>
                <span className="workspace-account-name">{userName}</span>
                <span className="workspace-avatar">{userName.trim().slice(0, 1).toUpperCase() || "A"}</span>
                <ChevronDown size={15} aria-hidden="true" />
              </button>
              {profileOpen && <div className="workspace-profile-menu" role="menu" aria-label="Admin profile menu">
                <div className="workspace-profile-heading"><strong>{userName}</strong><span>Administrator</span></div>
                <button type="button" role="menuitem" onClick={() => setProfileNotice("Admin profile details are not available: the backend profile endpoint currently supports student accounts only.")}>My Profile</button>
                <button type="button" role="menuitem" onClick={() => setProfileNotice("Profile editing is unavailable: there is no admin profile update endpoint.")}>Edit Profile</button>
                {profileNotice && <p role="status">{profileNotice}</p>}
                <button type="button" role="menuitem" className="workspace-profile-logout" onClick={logout}><LogOut size={15} />Logout</button>
              </div>}
            </div>
          ) : (
            <div className="workspace-account">
              <span className="workspace-account-name">{userName}</span>
              <span className="workspace-avatar">{userName.trim().slice(0, 1).toUpperCase() || "L"}</span>
            </div>
          )}
          <button
            type="button"
            className="workspace-collapse"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "Expand" : "Collapse"}
          </button>
        </header>
        <main className="workspace-content min-w-0">{children}</main>
      </div>
    </div>
  );
}
