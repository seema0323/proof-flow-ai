import { useEffect, useState } from "react";
import {
  NavLink,
  useLocation,
  Navigate,
} from "react-router-dom";
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
  getEvidence,
  submitEvidence,
  autoVerifyEvidence,
  verifyEvidenceWithAI,
  getProjectInsights,
  getProjectReport,
} from "./services/api";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Verification from "./pages/Verification";
import GitHubActivity from "./pages/GitHubActivity";
import Team from "./pages/Team";
import Intelligence from "./pages/Intelligence";
import SettingsPage from "./pages/Settings";

function App() {
    const location = useLocation();
  const [health, setHealth] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [commits, setCommits] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
const [selectedTask, setSelectedTask] = useState(null);
const [verificationResult, setVerificationResult] = useState(null);
const [submittedEvidence, setSubmittedEvidence] = useState(null);
const [aiInsights, setAiInsights] = useState(null);
const [insightsLoading, setInsightsLoading] = useState(false);
const [projectReport, setProjectReport] = useState(null);
const [reportLoading, setReportLoading] = useState(false);

const [newEvidence, setNewEvidence] = useState({
  description: "",
  githubCommitSha: "",
  deployedUrl: "",
  file: null,
});
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
async function loadAIInsights() {
  try {
    setInsightsLoading(true);
    setError("");

    const data = await getProjectInsights(
      projectId,
      token
    );

    setAiInsights(data.insights);
  } catch (err) {
    setError(err.message);
  } finally {
    setInsightsLoading(false);
  }
}
async function loadProjectReport() {
  try {
    setReportLoading(true);
    setError("");

    const data = await getProjectReport(
      projectId,
      token
    );

    setProjectReport(data.report);
  } catch (err) {
    setError(err.message);
  } finally {
    setReportLoading(false);
  }
}
async function handleSubmitEvidence(e) {
  e.preventDefault();

  try {
    setError("");

    // 1. Evidence save
    const data = await submitEvidence(
      {
        taskId: selectedTask._id,
        description: newEvidence.description,
        githubCommitSha: newEvidence.githubCommitSha,
        deployedUrl: newEvidence.deployedUrl,
        file: newEvidence.file,
      },
      token
    );

    setSubmittedEvidence(data.evidence);

    // 2. AI verification
    const aiData = await verifyEvidenceWithAI(
      data.evidence._id,
      token
    );

    // 3. Show AI result
    setVerificationResult(aiData.evidence);

    setNewEvidence({
      description: "",
      githubCommitSha: "",
      deployedUrl: "",
      file: null,
    });

    setShowEvidenceForm(false);
    setSelectedTask(null);
    setError("");
  } catch (err) {
    setError(err.message);
  }
}
async function loadTaskEvidence(task) {
  try {
    setError("");
    const data = await getEvidence(task._id, token);

    if (data.evidence.length > 0) {
      const latestEvidence =
        data.evidence[data.evidence.length - 1];

      setSubmittedEvidence(latestEvidence);
      setVerificationResult(latestEvidence);
    } else {
      setSubmittedEvidence(null);
      setVerificationResult(null);
    }
  } catch (err) {
    setError(err.message);
  }
}
  if (location.pathname === "/") {
    return <Navigate to="/dashboard" replace />;
  }

  if (location.pathname === "/projects") {
    return <Projects />;
  }

  if (location.pathname === "/tasks") {
    return <Tasks />;
  }

  if (location.pathname === "/verification") {
    return <Verification />;
  }

  if (location.pathname === "/github") {
    return <GitHubActivity />;
  }

  if (location.pathname === "/team") {
    return <Team />;
  }

  if (location.pathname === "/intelligence") {
    return <Intelligence />;
  }
if (location.pathname === "/settings") {
  return <SettingsPage />;
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
{showEvidenceForm && selectedTask && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            Submit Work Proof
          </h3>
          <p className="text-sm text-slate-500">
            {selectedTask.title}
          </p>
        </div>

        <button
          onClick={() => {
            setShowEvidenceForm(false);
            setSelectedTask(null);
          }}
          className="text-slate-400 hover:text-slate-700"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmitEvidence} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Work Description
          </label>

          <textarea
            required
            rows="3"
            value={newEvidence.description}
            onChange={(e) =>
              setNewEvidence({
                ...newEvidence,
                description: e.target.value,
              })
            }
            placeholder="Explain what work you completed"
            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            GitHub Commit SHA
          </label>

          <input
            required
            type="text"
            value={newEvidence.githubCommitSha}
            onChange={(e) =>
              setNewEvidence({
                ...newEvidence,
                githubCommitSha: e.target.value,
              })
            }
            placeholder="Example: 8e987ca..."
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
          />
        </div>
        <div>
  <label className="mb-1 block text-sm font-medium">
    Deployed URL
  </label>

  <input
    type="url"
    value={newEvidence.deployedUrl}
    onChange={(e) =>
      setNewEvidence({
        ...newEvidence,
        deployedUrl: e.target.value,
      })
    }
    placeholder="https://your-project.vercel.app"
    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
  />
</div>

<div>
  <label className="mb-1 block text-sm font-medium">
    Screenshot / File
  </label>

  <input
    type="file"
    accept="image/*,.pdf"
    onChange={(e) =>
      setNewEvidence({
        ...newEvidence,
        file: e.target.files[0],
      })
    }
    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
  />

  <p className="mt-1 text-xs text-slate-400">
    Maximum file size: 5 MB
  </p>
</div>

        <button
          type="submit"
          className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Submit & Verify Proof
        </button>
      </form>

    </div>
  </div>
)}
      <div className="flex min-h-screen">

       {/* Sidebar */}
<aside className="hidden w-72 shrink-0 border-r border-slate-800 bg-slate-950 px-4 py-6 text-white lg:flex lg:flex-col">

  {/* Brand */}
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
{/* Workspace */}
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

{/* Intelligence */}
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
      icon={<ShieldCheck size={18} />}
      text="AI Intelligence"
      to="/intelligence"
    />
  </nav>
</div>

  {/* Bottom */}
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
    />
  </div>
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

           
            
              {/* Project Command Center */}
<section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
  <div className="relative px-6 py-6 md:px-8">
    <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-indigo-100/60 blur-3xl" />

    <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            ✦ AI Work Verification
          </span>

          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            ● Verification Active
          </span>
        </div>

        <h1 className="max-w-3xl text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
          Turn project activity into
          <span className="text-indigo-600"> verified progress.</span>
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          ProofFlow validates evidence, GitHub activity and task
          progress so your team can prove what was actually built.
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
          <ShieldCheck size={19} />
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500">
            Current workspace
          </p>
          <p className="text-sm font-semibold text-slate-900">
            ProofFlow AI
          </p>
        </div>
      </div>
    </div>
  </div>
</section>

{/* Loading */}
{loading && (
  <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
    Loading project intelligence...
  </div>
)}

{/* Error */}
{error && (
  <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
    {error}
  </div>
)}

{/* Project Intelligence Metrics */}
{health && (
  <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

    {/* Claimed */}
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">
          Claimed Progress
        </p>

        <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
          CLAIMED
        </span>
      </div>

      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
        {health.claimedProgress}%
      </p>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-400 transition-all duration-500"
          style={{ width: `${health.claimedProgress}%` }}
        />
      </div>

      <p className="mt-3 text-xs text-slate-500">
        {health.claimedTasks} tasks claimed complete
      </p>
    </div>

    {/* Verified */}
    <div className="rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-white to-indigo-50/60 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">
          Verified Progress
        </p>

        <span className="rounded-lg bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-700">
          VERIFIED
        </span>
      </div>

      <p className="mt-4 text-3xl font-bold tracking-tight text-indigo-600">
        {health.verifiedProgress}%
      </p>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-indigo-100">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all duration-500"
          style={{ width: `${health.verifiedProgress}%` }}
        />
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Evidence-backed actual progress
      </p>
    </div>

    {/* Health */}
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">
          Project Health
        </p>

        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <ShieldCheck size={16} />
        </span>
      </div>

      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
        {health.progress}%
      </p>

      <p className="mt-3 text-xs text-slate-500">
        {health.completedTasks} of {health.totalTasks} tasks completed
      </p>
    </div>

    {/* Risk */}
    <div
      className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        health.riskLevel === "high"
          ? "border-red-200 bg-red-50/60"
          : health.riskLevel === "medium"
          ? "border-amber-200 bg-amber-50/60"
          : "border-emerald-200 bg-emerald-50/60"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">
          Risk Level
        </p>

        <span
          className={`h-2.5 w-2.5 rounded-full ${
            health.riskLevel === "high"
              ? "bg-red-500"
              : health.riskLevel === "medium"
              ? "bg-amber-500"
              : "bg-emerald-500"
          }`}
        />
      </div>

      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
        {capitalize(health.riskLevel)}
      </p>

      <p className="mt-3 text-xs text-slate-500">
        {health.overdueTasks} overdue tasks need attention
      </p>
    </div>

  </section>
)}
              <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-indigo-600">
        ProofFlow AI
      </p>
      <h2 className="text-xl font-semibold text-slate-900">
        AI Project Insights
      </h2>
    </div>

    <button
      onClick={loadAIInsights}
      disabled={insightsLoading}
      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
    >
      {insightsLoading ? "Analyzing..." : "Analyze Project ✨"}
    </button>
  </div>

  {aiInsights ? (
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <div className="rounded-xl bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase text-slate-500">
          AI Health Score
        </p>
        <p className="mt-1 text-3xl font-bold text-slate-900">
          {aiInsights.healthScore}%
        </p>
      </div>

      <div className="rounded-xl bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase text-slate-500">
          Risk Level
        </p>
        <p className="mt-1 text-lg font-semibold capitalize text-slate-900">
          {aiInsights.riskLevel}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 p-4">
        <p className="font-semibold text-slate-900">⚠ Top Risk</p>
        <p className="mt-1 text-sm text-slate-600">
          {aiInsights.topRisk}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 p-4">
        <p className="font-semibold text-slate-900">→ Next Action</p>
        <p className="mt-1 text-sm text-slate-600">
          {aiInsights.nextAction}
        </p>
      </div>

      <div className="md:col-span-2 rounded-xl bg-indigo-50 p-4">
        <p className="text-sm text-slate-700">
          {aiInsights.summary}
        </p>
        <p className="mt-2 text-sm font-medium text-indigo-700">
          ✓ {aiInsights.positiveSignal}
        </p>
      </div>
    </div>
  ) : (
    <p className="mt-4 text-sm text-slate-500">
      Analyze tasks and verified evidence to discover project risks and next actions.
    </p>
  )}
</section>
<section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-indigo-600">
        AI Generated Report
      </p>
      <h2 className="text-xl font-semibold text-slate-900">
        Project Status Report
      </h2>
    </div>

    <button
      onClick={loadProjectReport}
      disabled={reportLoading}
      className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
    >
      {reportLoading ? "Generating..." : "Generate Report"}
    </button>
  </div>

  {projectReport ? (
    <div className="mt-5">
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-700">
        {projectReport.overallStatus}
      </span>

      <p className="mt-4 text-sm leading-6 text-slate-600">
        {projectReport.executiveSummary}
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-emerald-50 p-4">
          <h3 className="font-semibold text-emerald-800">
            ✓ Verified Work
          </h3>
          {projectReport.verifiedWork.map((item, index) => (
            <p key={index} className="mt-2 text-sm text-slate-700">
              • {item}
            </p>
          ))}
        </div>

        <div className="rounded-xl bg-amber-50 p-4">
          <h3 className="font-semibold text-amber-800">
            ⚠ Blockers
          </h3>
          {projectReport.blockers.map((item, index) => (
            <p key={index} className="mt-2 text-sm text-slate-700">
              • {item}
            </p>
          ))}
        </div>

        <div className="rounded-xl bg-indigo-50 p-4">
          <h3 className="font-semibold text-indigo-800">
            → Next Priorities
          </h3>
          {projectReport.nextPriorities.map((item, index) => (
            <p key={index} className="mt-2 text-sm text-slate-700">
              • {item}
            </p>
          ))}
        </div>
      </div>
    </div>
  ) : (
    <p className="mt-4 text-sm text-slate-500">
      Generate an evidence-aware status report for your project.
    </p>
  )}
</section>
              {verificationResult && (
  <section className="mt-6">
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
      <p className="text-sm font-medium text-emerald-700">
        Evidence Verification Result
      </p>

      <h3 className="mt-1 text-lg font-semibold text-slate-900">
        {verificationResult.verificationStatus === "verified"
          ? "Verified ✅"
          : verificationResult.verificationStatus}
      </h3>

      <p className="mt-2 text-sm text-slate-600">
  Score: {verificationResult.verificationScore}%
</p>

<p className="mt-1 text-sm text-slate-600">
  Confidence:{" "}
  <span className="font-semibold capitalize">
    {verificationResult.verificationConfidence || "low"}
  </span>
</p>
      

      <p className="mt-1 text-sm text-slate-600">
        {verificationResult.verificationReason}
      </p>
      {submittedEvidence?.fileUrl && (
  <div className="mt-4">
    <p className="mb-2 text-sm font-medium text-slate-700">
      Submitted Evidence
    </p>

    <img
      src={submittedEvidence.fileUrl}
      alt="Submitted work evidence"
      className="max-h-64 rounded-xl border border-slate-200 object-cover"
    />
  </div>
)}

{submittedEvidence?.deployedUrl && (
  <a
    href={submittedEvidence.deployedUrl}
    target="_blank"
    rel="noreferrer"
    className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline"
  >
    View Live Project ↗
  </a>
)}
    </div>
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

<button
  onClick={() => {
    setSelectedTask(task);
    loadTaskEvidence(task);
    setShowEvidenceForm(true);
  }}
  className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
>
  Submit Proof
</button>

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