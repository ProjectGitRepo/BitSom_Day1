import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Users, SearchCheck, Layers3, Building2, Settings } from "lucide-react";

const navItems = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/talent", label: "Talent 360", icon: Users, end: false },
  { to: "/capability-search", label: "Capability Search", icon: SearchCheck, end: false },
  { to: "/workforce-planner", label: "Workforce Planner", icon: Layers3, end: false }
];

const bottomNavItems = [{ to: "/settings", label: "System Config", icon: Settings, end: false }];

export default function Layout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-stone-50">
      <aside className="flex w-64 shrink-0 flex-col border-r border-stone-200 bg-white">
        <div className="flex items-center gap-2.5 border-b border-stone-100 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Building2 size={18} />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-stone-900">TalentIQ</p>
            <p className="text-[11px] leading-tight text-stone-400">Internal Talent Marketplace</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Workspace</p>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-brand-50 text-brand-700" : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                }`
              }
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </NavLink>
          ))}

          <p className="px-3 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Admin</p>
          {bottomNavItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-brand-50 text-brand-700" : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                }`
              }
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-stone-100 p-4">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${isActive ? "bg-brand-50" : "bg-stone-50 hover:bg-stone-100"}`
            }
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
              HR
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-stone-800">HR Admin</p>
              <p className="truncate text-[11px] text-stone-400">People Operations</p>
            </div>
          </NavLink>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
