import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  ShieldCheck,
  Users,
  Settings,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";

import {
  getProjectHealth,
  getProjects,
  getTasks,
  getGitHubCommits,
  getGitHubContributors,
} from "./services/api";

function App() {
  const [health, setHealth] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [commits, setCommits] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const projectId = "6a9bef510dd60e7bf06339e3";

  // YAHAN APNA FRESH TOKEN RAKHO
  const token =import.meta.env.VITE_AUTH_TOKEN;
  useEffect(() => {
    async function loadDashboard() {
      try {
        setError("");

        const healthData = await getProjectHealth(projectId, token);
        setHealth(healthData.health);

        const projectData = await getProjects(token);
        setProjects(projectData.projects || projectData);

        const taskData = await getTasks(projectId, token);
        setTasks(taskData.tasks || taskData);

        const commitData = await getGitHubCommits(projectId, token);
        setCommits(commitData.commits || commitData);

        const contributorData = await getGitHubContributors(
          projectId,
          token
        );
        setContributors(
          contributorData.contributors || contributorData
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="hidden w-64 border-r border-slate-200 bg-white p-5 lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
              P
            </div>

            <div>
              <h1 className="font-semibold">ProofFlow AI</h1>
              <p className="text-xs text-slate-500">
                Work Verification
              </p>
            </div>
          </div>

          <nav className="space-y-2">
            <SidebarItem
              icon={<LayoutDashboard size={18} />}
              text="Dashboard"
              active
            />
            <SidebarItem
              icon={<FolderKanban size={18} />}
              text="Projects"
            />
            <SidebarItem
              icon={<CheckSquare size={18} />}
              text="Tasks"
            />
            <SidebarItem
              icon={<ShieldCheck size={18} />}
              text="Verification"
            />
            <SidebarItem
              icon={<FaGithub size={18} />}
              text="GitHub"
            />
            <SidebarItem
              icon={<Users size={18} />}
              text="Team"
            />
            <SidebarItem
              icon={<Settings size={18} />}
              text="Settings"
            />
          </nav>
        </aside>

        {/* Main */}
        <div className="flex-1">
          <header className="border-b border-slate-200 bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Project Overview
                </p>
                <h2 className="text-xl font-semibold">
                  Dashboard
                </h2>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                SY
              </div>
            </div>
          </header>

          <main className="p-6">
            <div className="mx-auto max-w-7xl">

              {/* Hero */}
              <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                <p className="mb-2 text-sm font-semibold text-indigo-600">
                  AI Work Verification Platform
                </p>

                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Don't just claim your work. Prove it.
                </h1>

                <p className="mt-3 max-w-3xl text-slate-500">
                  Track tasks, verify GitHub contributions,
                  validate submitted evidence and understand
                  the real health of your project.
                </p>
              </section>

              {/* Loading */}
              {loading && (
                <p className="mt-6 text-sm text-slate-500">
                  Loading dashboard...
                </p>
              )}

              {/* Error */}
              {error && (
                <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600">
                  {error}
                </p>
              )}

              {/* Health */}
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

              {/* Projects + Tasks */}
              <div className="mt-6 grid gap-6 lg:grid-cols-2">

                {/* Projects */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                      Projects
                    </h2>

                    <span className="text-sm text-slate-400">
                      {projects.length} total
                    </span>
                  </div>

                  <div className="space-y-3">
                    {projects.length === 0 && !loading ? (
                      <p className="text-sm text-slate-500">
                        No projects found.
                      </p>
                    ) : (
                      projects.map((project) => (
                        <div
                          key={project._id}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <h3 className="font-semibold">
                            {project.name}
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            {project.description}
                          </p>

                          <p className="mt-3 text-xs font-medium text-slate-600">
                            Status:{" "}
                            {capitalize(project.status)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                {/* Tasks */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                      Tasks
                    </h2>

                    <span className="text-sm text-slate-400">
                      {tasks.length} total
                    </span>
                  </div>

                  <div className="space-y-3">
                    {tasks.length === 0 && !loading ? (
                      <p className="text-sm text-slate-500">
                        No tasks found.
                      </p>
                    ) : (
                      tasks.map((task) => (
                        <div
                          key={task._id}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <h3 className="font-semibold">
                              {task.title}
                            </h3>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                              {capitalize(task.status)}
                            </span>
                          </div>

                          <p className="mt-3 text-sm text-slate-500">
                            Assigned to:{" "}
                            {task.assignedTo?.name ||
                              "Unassigned"}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>

              {/* GitHub Activity */}
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                      <FaGithub />
                      Recent Commits
                    </h2>

                    <span className="text-sm text-slate-400">
                      {commits.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {commits.slice(0, 5).map((commit) => (
                      <div
                        key={commit.sha}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <p className="font-medium">
                          {commit.message}
                        </p>

                        <p className="mt-2 text-xs text-slate-500">
                          {commit.author || "Unknown author"}
                        </p>
                      </div>
                    ))}

                    {commits.length === 0 && !loading && (
                      <p className="text-sm text-slate-500">
                        No commits found.
                      </p>
                    )}
                  </div>
                </section>

                {/* Contributors */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                      Contributors
                    </h2>

                    <span className="text-sm text-slate-400">
                      {contributors.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {contributors.map((contributor) => (
                      <div
                        key={contributor.username}
                        className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex items-center gap-3">
                          {contributor.avatar && (
                            <img
                              src={contributor.avatar}
                              alt=""
                              className="h-9 w-9 rounded-full"
                            />
                          )}

                          <p className="font-medium">
                            {contributor.username}
                          </p>
                        </div>

                        <span className="text-sm text-slate-500">
                          {contributor.contributions} commits
                        </span>
                      </div>
                    ))}

                    {contributors.length === 0 &&
                      !loading && (
                        <p className="text-sm text-slate-500">
                          No contributors found.
                        </p>
                      )}
                  </div>
                </section>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ icon, text, active }) {
  return (
    <div
      className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
        active
          ? "bg-indigo-50 text-indigo-700"
          : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
}

function MetricCard({ title, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold tracking-tight">
        {value}
      </p>

      <p className="mt-2 text-sm text-slate-500">
        {description}
      </p>
    </div>
  );
}

function capitalize(value = "") {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default App;