
import { createElement } from "react";
import {
  FiHome,
  FiBookOpen,
  FiClipboard,
  FiTarget,
  FiUsers,
  FiCheckSquare,
  FiAward,
  FiSettings,
} from "react-icons/fi";

const menuItems = [
  { name: "Dashboard", icon: FiHome },
  { name: "Lessons", icon: FiBookOpen },
  { name: "Quizzes", icon: FiClipboard },
  { name: "Challenges", icon: FiTarget },
  { name: "Submissions", icon: FiCheckSquare },
  { name: "Students", icon: FiUsers },
  { name: "Leaderboard", icon: FiAward },
];

export default function AdminSidebar({
  activePage = "Overview",
  onNavigate = () => {},
}) {
  return (
    <aside className="fixed left-0 top-0 flex h-screen w-[250px] flex-col bg-[#104b3b] px-3 text-white">
      {/* Logo */}
      <div className="flex h-[100px] shrink-0 items-center border-b border-white/10 px-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-wide">
            ECOQUEST
          </h1>
          <p className="mt-1 text-xs text-emerald-200/70">
            Admin workspace
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-7 flex-1 space-y-2 overflow-y-auto">
        {menuItems.map(({ name, icon: Icon }) => (
          <button
            key={name}
            type="button"
            onClick={() => onNavigate(name)}
            className={`flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left text-sm transition-colors ${
              activePage === name
                ? "bg-white font-semibold text-[#104b3b]"
                : "text-emerald-100 hover:bg-white/10 hover:text-white"
            }`}
          >
            {createElement(Icon, { size: 20, className: "shrink-0" })}
            <span>{name}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/10 px-4 py-5">
        <p className="text-xs text-emerald-100/60">
          Learn today, protect tomorrow.
        </p>
      </div>
    </aside>
  );
}
