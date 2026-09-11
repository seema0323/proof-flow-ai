import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  ShieldCheck,
  BarChart3,
  Bell,
  Settings,
  Search,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { getProjectHealth } from "./services/api";

function App() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const projectId = "6a9bef510dd60e7bf06339e3";

  // Temporary token for testing.
  // Later login ke baad token automatically localStorage se aayega.
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTliZTZiNjJkOWMyM2EzYTQzOGQwMTYiLCJpYXQiOjE3ODkxMzY3ODMsImV4cCI6MTc4OTc0MTU4M30.lRNgzKch15_pI8UeavvK7CZf52n1VT2VeIbCvyIQh_A";
  useEffect(() => {
    async function loadHealth() {
      try {
        const data = await getProjectHealth(projectId, token);
        setHealth(data.health);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="relative hidden w-64 flex-shrink-0 border-r border-slate-200 bg-white lg:block">
          <div className="flex h-16 items-center border-b border-slate-200 px-6">
            <div>
              <h1 className="text-xl font-bold tracking-tight">ProofFlow AI</h1>
              <p className="text-xs text-slate-500">Verify real work</p>
            </div>
          </div>

          <nav className="space-y-1 p-4">
            <SidebarItem
              icon={<LayoutDashboard size={18} />}
              label="Overview"
              active
            />
            <SidebarItem
              icon={<FolderKanban size={18} />}
              label="Projects"
            />
            <SidebarItem
              icon={<CheckSquare size={18} />}
              label="Tasks"
            />
            <SidebarItem
              icon={<ShieldCheck size={18} />}
              label="Verification"
            />
            <SidebarItem
              icon={<FaGithub size={18} />}
              label="GitHub Activity"
            />
            <SidebarItem
              icon={<BarChart3 size={18} />}
              label="Analytics"
            />
          </nav>

          <div className="absolute bottom-4 left-0 w-full px-4">
            <SidebarItem
              icon={<Settings size={18} />}
              label="Settings"
            />
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1">
          <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8">
            <div>
              <p className="text-xs font-medium text-slate-400">WORKSPACE</p>
              <h2 className="font-semibold text-slate-900">
                Project Overview
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
                <Search size={17} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-44 bg-transparent text-sm outline-none"
                />
              </div>

              <button className="rounded-xl border border-slate-200 bg-white p-2.5 transition hover:bg-slate-50">
                <Bell size={18} />
              </button>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                SY
              </div>
            </div>
          </header>

          <main className="p-4 md:p-8">
            <div className="mx-auto max-w-7xl">
              {/* Hero */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <div className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                  AI Work Verification Platform
                </div>

                <h3 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight md:text-4xl">
                  Don&apos;t just claim your work.
                  <span className="text-indigo-600"> Prove it.</span>
                </h3>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
                  Track tasks, verify GitHub contributions, validate submitted
                  evidence and understand the real health of your project.
                </p>
              </section>

              {/* Status */}
              {loading && (
                <p className="mt-6 text-sm text-slate-500">
                  Loading project health...
                </p>
              )}

              {error && (
                <p className="mt-6 text-sm font-medium text-red-600">
                  {error}
                </p>
              )}

              {/* Real Backend Data */}
              {health && (
                <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <MetricCard
                    title="Claimed Progress"
                    value={`${health.claimedProgress}%`}
                    description={`${health.claimedTasks} tasks claimed complete`}
                  />

                  <MetricCard
                    title="Verified Progress"
                    value={`${health.verifiedProgress}%`}
                    description="Evidence-backed project progress"
                  />

                  <MetricCard
                    title="Project Health"
                    value={`${health.progress}%`}
                    description={`${health.completedTasks}/${health.totalTasks} tasks completed`}
                  />

                  <MetricCard
                    title="Risk Level"
                    value={capitalize(health.riskLevel)}
                    description={`${health.overdueTasks} overdue tasks`}
                  />
                </section>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active = false }) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function MetricCard({ title, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-sm font-medium text-slate-500">{title}</p>

      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-400">{description}</p>
    </div>
  );
}

function capitalize(value) {
  if (!value) return "-";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default App;