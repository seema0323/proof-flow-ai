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
  createProject,
  createTask,
  updateTaskStatus,
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
  const [showCreateTask, setShowCreateTask] = useState(false);

const [newTask, setNewTask] = useState({
  title: "",
  description: "",
  deadline: "",
});
  const [showCreateProject, setShowCreateProject] = useState(false);

const [newProject, setNewProject] = useState({
  name: "",
  description: "",
});

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
  async function handleCreateProject(e) {
  e.preventDefault();

  try {
    const data = await createProject(newProject, token);

    setProjects((prev) => [data.project || data, ...prev]);

    setNewProject({
      name: "",
      description: "",
    });

    setShowCreateProject(false);
  } catch (err) {
    setError(err.message);
  }
}
async function handleCreateTask(e) {
  e.preventDefault();

  try {
    const data = await createTask(
      {
        ...newTask,
        projectId: projectId,
      },
      token
    );

    setTasks((prev) => [data.task, ...prev]);

    setNewTask({
      title: "",
      description: "",
      deadline: "",
    });

    setShowCreateTask(false);
  } catch (err) {
    setError(err.message);
  }
}
async function handleStatusChange(taskId, status) {
  try {
    const data = await updateTaskStatus(taskId, status, token);

    setTasks((prev) =>
      prev.map((task) =>
        task._id === taskId ? data.task : task
      )
    );
  } catch (err) {
    setError(err.message);
  }
}
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {showCreateProject && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Create Project
          </h3>
          <p className="text-sm text-slate-500">
            Start a new verified workspace
          </p>
        </div>

        <button
          onClick={() => setShowCreateProject(false)}
          className="text-slate-400 hover:text-slate-700"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleCreateProject} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Project Name
          </label>

          <input
            type="text"
            required
            value={newProject.name}
            onChange={(e) =>
              setNewProject({
                ...newProject,
                name: e.target.value,
              })
            }
            placeholder="ProofFlow AI"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Description
          </label>

          <textarea
            required
            rows="4"
            value={newProject.description}
            onChange={(e) =>
              setNewProject({
                ...newProject,
                description: e.target.value,
              })
            }
            placeholder="What is this project about?"
            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setShowCreateProject(false)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Create Project
          </button>
        </div>
      </form>
    </div>
  </div>
)}
{showCreateTask && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Create Task</h3>
          <p className="text-sm text-slate-500">
            Add a task to this project
          </p>
        </div>

        <button
          onClick={() => setShowCreateTask(false)}
          className="text-slate-400 hover:text-slate-700"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleCreateTask} className="space-y-4">
        <input
          required
          type="text"
          placeholder="Task title"
          value={newTask.title}
          onChange={(e) =>
            setNewTask({ ...newTask, title: e.target.value })
          }
          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
        />

        <textarea
          rows="3"
          placeholder="Task description"
          value={newTask.description}
          onChange={(e) =>
            setNewTask({
              ...newTask,
              description: e.target.value,
            })
          }
          className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
        />

        <input
          type="date"
          value={newTask.deadline}
          onChange={(e) =>
            setNewTask({ ...newTask, deadline: e.target.value })
          }
          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
        />

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowCreateTask(false)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
          >
            Create Task
          </button>
        </div>
      </form>
    </div>
  </div>
)}
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

      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowCreateProject(true)}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          + Create Project
        </button>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
          SY
        </div>
      </div>

    </div>
  </header>

  <main className="p-6">
   <div className="mx-auto max-w-7xl"></div>

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
    <div>
      <h2 className="text-lg font-semibold">Tasks</h2>
      <p className="text-sm text-slate-400">
        {tasks.length} total
      </p>
    </div>

    <button
      onClick={() => setShowCreateTask(true)}
      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
    >
      + Create Task
    </button>
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
            <h3 className="font-semibold">{task.title}</h3>

          <select
  value={task.status}
  onChange={(e) =>
    handleStatusChange(task._id, e.target.value)
  }
  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 outline-none"
>
  <option value="todo">Todo</option>
  <option value="in-progress">In-progress</option>
  <option value="completed">Completed</option>
</select>
          </div>

          <p className="mt-3 text-sm text-slate-500">
            Assigned to: {task.assignedTo?.name || "Unassigned"}
          </p>
        </div>
      ))
    )}
  </div>
</section>
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