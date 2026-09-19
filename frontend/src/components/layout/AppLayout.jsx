import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  ShieldCheck,
  Users,
  Settings,
  BrainCircuit,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-900">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="hidden w-72 shrink-0 border-r border-slate-800 bg-[#070b18] px-4 py-6 text-white lg:flex lg:flex-col">
          {/* BRAND */}
          <div className="flex items-center gap-3 px-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500 text-lg font-bold shadow-lg shadow-indigo-500/20">
              P
            </div>

            <div>
              <h1 className="text-base font-semibold tracking-tight">
                ProofFlow AI
              </h1>
              <p className="text-xs text-slate-400">
                Verified work intelligence
              </p>
            </div>
          </div>

          {/* WORKSPACE */}
          <div className="mt-8 px-3">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Workspace
            </p>

            <nav className="space-y-1">
              <SidebarItem
                icon={<LayoutDashboard size={18} />}
                text="Dashboard"
                to="/dashboard"
              />

              <SidebarItem
                icon={<FolderKanban size={18} />}
                text="Projects"
                to="/projects"
              />

              <SidebarItem
                icon={<CheckSquare size={18} />}
                text="Tasks"
                to="/tasks"
              />

              <SidebarItem
                icon={<ShieldCheck size={18} />}
                text="Verification"
                to="/verification"
              />
            </nav>
          </div>

          {/* INTELLIGENCE */}
          <div className="mt-7 px-3">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Intelligence
            </p>

            <nav className="space-y-1">
              <SidebarItem
                icon={<FaGithub size={18} />}
                text="GitHub Activity"
                to="/github"
              />

              <SidebarItem
                icon={<Users size={18} />}
                text="Team"
                to="/team"
              />

              <SidebarItem
                icon={<BrainCircuit size={18} />}
                text="AI Intelligence"
                to="/intelligence"
              />
            </nav>
          </div>

          {/* BOTTOM */}
          <div className="mt-auto px-3">
            <div className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" />

                <p className="text-sm font-medium">
                  Verification Engine
                </p>
              </div>

              <p className="text-xs leading-5 text-slate-400">
                AI and GitHub evidence verification active.
              </p>
            </div>

            <SidebarItem
              icon={<Settings size={18} />}
              text="Settings"
              to="/settings"
            />
          </div>
        </aside>

        {/* PAGE */}
        <div className="min-w-0 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ icon, text, to }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
          isActive
            ? "bg-indigo-500/15 text-indigo-300 ring-1 ring-inset ring-indigo-500/20"
            : "text-slate-400 hover:bg-slate-900 hover:text-white"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={
              isActive
                ? "text-indigo-400"
                : "text-slate-500 transition-colors group-hover:text-slate-300"
            }
          >
            {icon}
          </span>

          <span>{text}</span>

          {isActive && (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" />
          )}
        </>
      )}
    </NavLink>
  );
}