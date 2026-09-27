import { useEffect, useMemo, useState } from "react";
import { useProject } from "../context/ProjectContext";
import {
  Search,
  Plus,
  FolderKanban,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Loader2,
  PauseCircle,
  Sparkles,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { getProjects, createProject } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Projects() {
  const { selectedProjectId, selectProject } = useProject();
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
  });

  async function loadProjects() {
    try {
      setLoading(true);
      setError("");

      const data = await getProjects(token);

      if (Array.isArray(data)) {
        setProjects(data);
      } else {
        setProjects(data?.projects || []);
      }
    } catch (err) {
      setError(err.message || "Unable to load projects.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, [token]);

  async function handleCreateProject(e) {
    e.preventDefault();

    if (!newProject.name.trim() || !newProject.description.trim()) {
      return;
    }

    try {
      setCreating(true);
      setError("");

      await createProject(
        {
          name: newProject.name.trim(),
          description: newProject.description.trim(),
        },
        token
      );

      setNewProject({
        name: "",
        description: "",
      });

      setShowCreate(false);
      await loadProjects();
    } catch (err) {
      setError(err.message || "Unable to create project.");
    } finally {
      setCreating(false);
    }
  }

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return projects;

    return projects.filter((project) => {
      const name = project.name?.toLowerCase() || "";
      const description = project.description?.toLowerCase() || "";

      return name.includes(query) || description.includes(query);
    });
  }, [projects, search]);

  const activeProjects = projects.filter(
    (project) => project.status === "active"
  ).length;

  const completedProjects = projects.filter(
    (project) => project.status === "completed"
  ).length;

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-slate-900">
      {/* TOP HEADER */}
      <header className="border-b border-slate-200 bg-[#f4f6fb]">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 md:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
              Workspace
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              Projects
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus size={17} />
            New Project
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-5 py-6 md:px-8 md:py-8">
        {/* HERO */}
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-600">
                <Sparkles size={16} aria-hidden="true" />
                Verified project workspace
              </div>

              <h2 className="max-w-2xl text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
                Build projects whose progress can be proven.
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Manage projects, connect development activity and build a
                reliable record of the work your team actually completed.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <MiniStat label="Total" value={projects.length} />
              <MiniStat label="Active" value={activeProjects} />
              <MiniStat label="Completed" value={completedProjects} />
            </div>
          </div>
        </section>

        {/* PROJECT LIST HEADER */}
        <section className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Your Projects
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {projects.length} project{projects.length === 1 ? "" : "s"} in
              this workspace
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none"
            />
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </section>
        )}

        {/* PROJECT CARDS */}
        {!loading && filteredProjects.length > 0 && (
          <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project) => (
              <article
                key={project._id}
                onClick={() => selectProject(project._id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectProject(project._id);
                  }
                }}
                role="button"
                tabIndex={0}
                className={`group flex min-h-[270px] flex-col rounded-lg border bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md focus-visible:outline-indigo-500 ${
                  selectedProjectId === project._id
                    ? "border-indigo-400 ring-1 ring-indigo-200"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <FolderKanban size={21} />
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={project.status} />
                    {selectedProjectId === project._id ? (
                      <span className="flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/10">
                        <CheckCircle2 size={13} /> Selected
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400 group-hover:text-indigo-600">
                        Select project
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5">
                  <h3 className="text-lg font-bold tracking-tight text-slate-950">
                    {project.name}
                  </h3>

                  <p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">
                    {project.description ||
                      "No project description has been added yet."}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {project.githubRepo ||
                  project.githubOwner ||
                  project.githubRepoName ? (
                    <span className="flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                      <FaGithub size={13} />
                      <CheckCircle2 size={13} /> GitHub connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800">
                      <FaGithub size={13} />
                      <Clock3 size={13} /> GitHub not connected
                    </span>
                  )}

                  <span className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 size={13} />
                    AI review available
                  </span>
                </div>

                <div className="mt-auto border-t border-slate-100 pt-4">
                  <span className="flex w-full items-center justify-between text-sm font-semibold text-slate-700 transition group-hover:text-indigo-600">
                    {selectedProjectId === project._id ? "Selected project" : "Select this project"}
                    <ArrowUpRight size={16} />
                  </span>
                </div>
              </article>
            ))}
          </section>
        )}

        {/* EMPTY STATE */}
        {!loading && filteredProjects.length === 0 && (
          <section className="mt-6 flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <FolderKanban size={26} />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-950">
              {search ? "No matching projects" : "Create your first project"}
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              {search
                ? "Try searching with another project name."
                : "Create a workspace to start tracking tasks, evidence and verified contributions."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="mt-5 flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                <Plus size={16} />
                Create Project
              </button>
            )}
          </section>
        )}
      </main>

      {/* CREATE PROJECT MODAL */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
          onMouseDown={() => setShowCreate(false)}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                  New Workspace
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  Create Project
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Start tracking and verifying real project work.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Project name
                </label>

                <input
                  required
                  type="text"
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g. ProofFlow AI"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  required
                  rows={4}
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      description: e.target.value,
                    })
                  }
                  placeholder="What are you building?"
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Create Project
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="min-w-[82px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
      <p className="text-xl font-bold text-slate-950">{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
        {label}
      </p>
    </div>
  );
}

function StatusBadge({ status = "active" }) {
  const states = {
    active: { style: "bg-emerald-50 text-emerald-800 ring-emerald-600/10", icon: <CheckCircle2 size={13} /> },
    completed: { style: "bg-indigo-50 text-indigo-800 ring-indigo-600/10", icon: <CheckCircle2 size={13} /> },
    "on-hold": { style: "bg-amber-50 text-amber-800 ring-amber-600/10", icon: <PauseCircle size={13} /> },
  };

  const current = states[status] || states.active;

  return (
    <span
      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${current.style}`}
    >
      {current.icon}
      {(status || "active").replace("-", " ")}
    </span>
  );
}