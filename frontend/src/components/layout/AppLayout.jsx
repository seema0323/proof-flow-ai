import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Activity,
  CircleUserRound,
  FolderKanban,
  LayoutDashboard,
  CheckSquare,
  ShieldCheck,
  Users,
  Settings,
  BrainCircuit,
  LogOut,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useProject } from "../../context/ProjectContext";
import { getProjects } from "../../services/api";

export default function AppLayout({ children }) {
  const { logout, token } = useAuth();
  const { selectedProjectId } = useProject();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    let isCurrent = true;

    getProjects(token)
      .then((data) => {
        const projectList = Array.isArray(data) ? data : data?.projects || [];
        if (isCurrent) setProjects(projectList);
      })
      .catch(() => {
        if (isCurrent) setProjects([]);
      });

    return () => {
      isCurrent = false;
    };
  }, [token]);

  const selectedProject = projects.find((project) => project._id === selectedProjectId);
  const workspaceItems = [
    { icon: <LayoutDashboard size={17} />, text: "Dashboard", to: "/dashboard" },
    { icon: <FolderKanban size={17} />, text: "Projects", to: "/projects" },
    { icon: <CheckSquare size={17} />, text: "Tasks", to: "/tasks" },
    { icon: <ShieldCheck size={17} />, text: "Verification", to: "/verification" },
  ];
  const intelligenceItems = [
    { icon: <FaGithub size={17} />, text: "GitHub Activity", to: "/github" },
    { icon: <Users size={17} />, text: "Team", to: "/team" },
    { icon: <BrainCircuit size={17} />, text: "AI Intelligence", to: "/intelligence" },
  ];

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-[252px] shrink-0 border-r border-slate-800 bg-[#0b1020] px-3.5 py-5 text-white lg:flex lg:flex-col">
          <Link to="/dashboard" className="flex items-center gap-3 rounded-md px-3 py-2 focus-visible:outline-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-500 text-base font-bold text-white">P</span>
            <span className="min-w-0"><span className="block text-sm font-bold tracking-tight">ProofFlow</span><span className="mt-0.5 block text-[11px] text-slate-400">Proof over promises</span></span>
          </Link>

          <NavigationSection label="Workspace" items={workspaceItems} />
          <NavigationSection label="Intelligence" items={intelligenceItems} />

          <div className="mt-auto space-y-2 px-1">
            <div className="rounded-md border border-slate-700/80 bg-slate-900/60 p-3">
              <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-400" /><p className="text-xs font-semibold">Verification engine</p></div>
              <p className="mt-2 flex items-center gap-2 text-[11px] text-slate-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Available for project evidence</p>
            </div>
            <SidebarItem icon={<Settings size={17} />} text="Settings" to="/settings" />
            <button type="button" onClick={handleLogout} className="group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white focus-visible:outline-white">
              <LogOut size={17} className="text-slate-500 transition group-hover:text-slate-200" />Log out
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex min-h-14 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
              <Link to="/dashboard" aria-label="ProofFlow dashboard" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-indigo-600 text-sm font-bold text-white lg:hidden">P</Link>
              <Link to="/projects" className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-slate-50 focus-visible:outline-indigo-500">
                <FolderKanban size={16} className="shrink-0 text-indigo-600" />
                <span className="min-w-0"><span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Current project</span><span className="block max-w-[48vw] truncate text-xs font-semibold text-slate-800 sm:max-w-xs">{selectedProject?.name || "Select a project"}</span></span>
              </Link>
              <div className="flex shrink-0 items-center gap-2">
                <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 sm:inline-flex"><Activity size={13} />Engine available</span>
                <Link to="/settings" aria-label="Account settings" title="Account settings" className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"><CircleUserRound size={17} /></Link>
              </div>
            </div>
            <nav aria-label="Primary navigation" className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-1.5 lg:hidden">
              {[...workspaceItems, ...intelligenceItems].map((item) => <MobileItem key={item.to} {...item} />)}
              <MobileItem icon={<Settings size={16} />} text="Settings" to="/settings" />
              <button type="button" onClick={handleLogout} className="flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-indigo-500"><LogOut size={16} />Log out</button>
            </nav>
          </header>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

function NavigationSection({ label, items }) {
  return <div className="mt-7 px-1">
    <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
    <nav className="space-y-0.5">{items.map((item) => <SidebarItem key={item.to} {...item} />)}</nav>
  </div>;
}

function SidebarItem({ icon, text, to }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-white ${
          isActive
            ? "bg-indigo-500/15 text-indigo-200 ring-1 ring-inset ring-indigo-400/20"
            : "text-slate-400 hover:bg-white/5 hover:text-white"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={
              isActive
                ? "text-indigo-300"
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

function MobileItem({ icon, text, to }) {
  return <NavLink to={to} aria-label={text} title={text} className={({ isActive }) => `flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-indigo-500 ${isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
    {icon}<span>{text}</span>
  </NavLink>;
}