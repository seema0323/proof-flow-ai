import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useProject } from "../context/ProjectContext";
import {
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Clock3,
  AlertTriangle,
  FolderKanban,
  ListTodo,
  CalendarDays,
  UserRound,
  Loader2,
  Sparkles,
  Filter,
  Upload,
  X,
} from "lucide-react";

import {
  getTasks,
  getProjectMembers,
  createTask,
  updateTaskStatus,
  claimTaskCompletion,
  submitEvidence,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Tasks() {
  const { selectedProjectId } = useProject();
  const { token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [claimingId, setClaimingId] = useState("");
  const [evidenceTask, setEvidenceTask] = useState(null);
  const [submittingEvidence, setSubmittingEvidence] = useState(false);
  const [success, setSuccess] = useState("");
  const requestSequence = useRef(0);
  const [evidenceForm, setEvidenceForm] = useState({
    description: "",
    githubUrl: "",
    githubCommitSha: "",
    deployedUrl: "",
    file: null,
  });

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    deadline: "",
    assignedTo: "",
    status: "todo",
  });

  async function loadTasks() {
    const sequence = ++requestSequence.current;
    if (!selectedProjectId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setTasks([]);
    try {
      setLoading(true);
      setError("");

      const data = await getTasks(selectedProjectId, token);

      if (sequence === requestSequence.current) {
        setTasks(Array.isArray(data) ? data : data?.tasks || []);
      }
    } catch (err) {
      if (sequence === requestSequence.current) {
        setError(err.message || "Unable to load tasks.");
      }
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }

  useEffect(() => {
    let isCurrent = true;
    setMembers([]);
    setMembersLoading(Boolean(selectedProjectId));
    setEvidenceTask(null);
    setSuccess("");
    setError("");
    if (selectedProjectId) {
      getProjectMembers(selectedProjectId, token)
        .then((data) => {
          if (!isCurrent) return;
          const projectMembers = data.members || [];
          setMembers(data.owner ? [data.owner, ...projectMembers] : projectMembers);
        })
        .catch((err) => {
          if (isCurrent) setError(err.message || "Unable to load project members.");
        })
        .finally(() => {
          if (isCurrent) setMembersLoading(false);
        });
    }
    loadTasks();
    return () => {
      isCurrent = false;
      requestSequence.current += 1;
    };
  }, [selectedProjectId, token]);

  async function handleStatusChange(taskId, status) {
    try {
      setUpdatingId(taskId);
      setError("");

      await updateTaskStatus(taskId, status, token);

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task._id === taskId ? { ...task, status } : task
        )
      );
    } catch (err) {
      setError(err.message || "Unable to update task.");
      await loadTasks();
    } finally {
      setUpdatingId("");
    }
  }

  async function handleClaimCompletion(taskId) {
    try {
      setClaimingId(taskId);
      setError("");
      setSuccess("");
      await claimTaskCompletion(taskId, token);
      setTasks((currentTasks) => currentTasks.map((task) =>
        task._id === taskId ? { ...task, completionClaimed: true } : task
      ));
      setSuccess("Completion claimed. Submit evidence to request verification.");
    } catch (err) {
      setError(err.message || "Unable to claim task completion.");
      await loadTasks();
    } finally {
      setClaimingId("");
    }
  }

  function openEvidenceForm(task) {
    setEvidenceTask(task);
    setEvidenceForm({
      description: "",
      githubUrl: "",
      githubCommitSha: "",
      deployedUrl: "",
      file: null,
    });
    setError("");
  }

  async function handleEvidenceSubmit(event) {
    event.preventDefault();
    const hasProof = evidenceForm.githubUrl.trim() ||
      evidenceForm.githubCommitSha.trim() ||
      evidenceForm.deployedUrl.trim() || evidenceForm.file;

    if (!hasProof) {
      setError("Add a GitHub link, commit SHA, deployed URL, or file as supporting proof.");
      return;
    }

    if (evidenceForm.file && evidenceForm.file.size > 5 * 1024 * 1024) {
      setError("The selected file must be 5 MB or smaller.");
      return;
    }

    try {
      setSubmittingEvidence(true);
      setError("");
      await submitEvidence({
        taskId: evidenceTask._id,
        ...evidenceForm,
      }, token);
      setEvidenceTask(null);
      setSuccess("Evidence submitted and pending AI verification.");
    } catch (err) {
      setError(err.message || "Unable to submit evidence.");
    } finally {
      setSubmittingEvidence(false);
    }
  }

  async function handleCreateTask(e) {
    e.preventDefault();

    if (!newTask.title.trim()) return;

    try {
      setCreating(true);
      setError("");

      const payload = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        projectId: selectedProjectId,
        status: newTask.status,
      };

      if (newTask.assignedTo) payload.assignedTo = newTask.assignedTo;

      if (newTask.deadline) {
        payload.deadline = newTask.deadline;
      }

      await createTask(payload, token);

      setNewTask({
        title: "",
        description: "",
        deadline: "",
        assignedTo: "",
        status: "todo",
      });

      setShowCreate(false);
      setSuccess("Task created successfully.");
      await loadTasks();
    } catch (err) {
      setError(err.message || "Unable to create task.");
    } finally {
      setCreating(false);
    }
  }

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        !query ||
        task.title?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.assignedTo?.name?.toLowerCase().includes(query);

      let matchesFilter = true;

      if (filter === "todo") {
        matchesFilter = task.status === "todo";
      }

      if (filter === "in-progress") {
        matchesFilter = task.status === "in-progress";
      }

      if (filter === "completed") {
        matchesFilter = task.status === "completed";
      }

      if (filter === "claimed") {
        matchesFilter = task.completionClaimed === true;
      }

      if (filter === "overdue") {
        matchesFilter = isOverdue(task);
      }

      return matchesSearch && matchesFilter;
    });
  }, [tasks, search, filter]);

  const todoCount = tasks.filter((task) => task.status === "todo").length;

  const progressCount = tasks.filter(
    (task) => task.status === "in-progress"
  ).length;

  const completedCount = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  const overdueCount = tasks.filter(isOverdue).length;

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-[#f4f6fb]">
        <div className="flex items-center justify-between px-6 py-4 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
              Workspace
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              Tasks
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setShowCreate(true)}
            disabled={!selectedProjectId}
            className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={17} />
            Create Task
          </button>
        </div>
      </header>

      <main className="px-6 py-7 lg:px-8">
        {/* HERO */}
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600">
                <Sparkles size={16} />
                Verified execution
              </div>

              <h2 className="mt-3 max-w-2xl text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
                Track work from assignment to verified completion.
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Manage task progress, deadlines and completion claims before
                evidence is verified by ProofFlow.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatCard
                title="Todo"
                value={todoCount}
                icon={<Circle size={16} />}
              />

              <StatCard
                title="In Progress"
                value={progressCount}
                icon={<Clock3 size={16} />}
              />

              <StatCard
                title="Completed"
                value={completedCount}
                icon={<CheckCircle2 size={16} />}
              />

              <StatCard
                title="Overdue"
                value={overdueCount}
                icon={<AlertTriangle size={16} />}
                danger={overdueCount > 0}
              />
            </div>
          </div>
        </section>

        {/* TOOLBAR */}
        <section className="mt-7 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Project Tasks
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {tasks.length} total task{tasks.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none sm:w-72"
              />
            </div>

            <div className="relative">
              <Filter
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm font-medium text-slate-700 outline-none"
              >
                <option value="all">All tasks</option>
                <option value="todo">Todo</option>
                <option value="in-progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="claimed">Claimed complete</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div role="status" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            <span>{success}</span>
            {success.includes("Evidence submitted") && (
              <Link to="/verification" className="font-semibold underline underline-offset-2">Open Verification</Link>
            )}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <section className="mt-6 grid gap-4 xl:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-60 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </section>
        )}

        {/* TASKS */}
        {!loading && filteredTasks.length > 0 && (
          <section className="mt-6 grid gap-4 xl:grid-cols-2">
            {filteredTasks.map((task) => {
              const overdue = isOverdue(task);

              return (
                <article
                  key={task._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <ListTodo size={19} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-950">
                          {task.title}
                        </h3>

                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
                          {task.description || "No description provided."}
                        </p>
                      </div>
                    </div>

                    <TaskStatus status={task.status} />
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <InfoBox
                      icon={<UserRound size={15} />}
                      label="Assigned to"
                      value={task.assignedTo?.name || "Unassigned"}
                    />

                    <InfoBox
                      icon={<CalendarDays size={15} />}
                      label="Deadline"
                      value={
                        task.deadline
                          ? formatDate(task.deadline)
                          : "No deadline"
                      }
                      danger={overdue}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {task.completionClaimed && (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800">
                        <AlertTriangle size={13} />
                        Completion claimed
                      </span>
                    )}

                    {overdue && (
                      <span className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700">
                        <AlertTriangle size={13} />
                        Overdue
                      </span>
                    )}
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Work status
                      </p>

                      {updatingId === task._id && (
                        <Loader2
                          size={16}
                          className="animate-spin text-indigo-600"
                        />
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <StatusButton
                        label="Todo"
                        active={task.status === "todo"}
                        disabled={updatingId === task._id}
                        onClick={() =>
                          handleStatusChange(task._id, "todo")
                        }
                      />

                      <StatusButton
                        label="In progress"
                        active={task.status === "in-progress"}
                        disabled={updatingId === task._id}
                        onClick={() =>
                          handleStatusChange(task._id, "in-progress")
                        }
                      />

                      <StatusButton
                        label="Completed"
                        active={task.status === "completed"}
                        disabled={updatingId === task._id}
                        onClick={() =>
                          handleStatusChange(task._id, "completed")
                        }
                      />
                    </div>

                    <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Next action</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {task.completionClaimed
                            ? "Completion is claimed, not yet AI verified."
                            : "Work status and verified completion are tracked separately."}
                        </p>
                      </div>
                      {task.completionClaimed ? (
                        <button type="button" onClick={() => openEvidenceForm(task)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">
                          <Upload size={15} /> Submit evidence
                        </button>
                      ) : task.status === "todo" ? (
                        <button type="button" disabled={updatingId === task._id} onClick={() => handleStatusChange(task._id, "in-progress")} className="shrink-0 rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60">
                          {updatingId === task._id ? "Updating..." : "Move to In Progress"}
                        </button>
                      ) : (
                        <button type="button" disabled={claimingId === task._id} onClick={() => handleClaimCompletion(task._id)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-slate-950 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
                          {claimingId === task._id ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                          {claimingId === task._id ? "Claiming..." : "Claim Completion"}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {/* EMPTY */}
        {!loading && filteredTasks.length === 0 && (
          <section className="mt-6 flex min-h-80 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <ListTodo size={25} />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-950">
              {!selectedProjectId ? "Select a project to view tasks" : "No tasks found"}
            </h3>

            <p className="mt-2 max-w-md text-sm text-slate-500">
              {!selectedProjectId
                ? "Choose a project before creating or updating tasks."
                : search || filter !== "all"
                ? "Change your search or filter to find another task."
                : "Create your first task to start tracking verified work."}
            </p>

            {!selectedProjectId ? (
              <Link to="/projects" className="mt-5 inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">
                <FolderKanban size={16} /> Select a project
              </Link>
            ) : !search && filter === "all" && (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="mt-5 flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Plus size={16} />
                Create Task
              </button>
            )}
          </section>
        )}
      </main>

      {/* CREATE MODAL */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
          onMouseDown={() => { if (!creating) setShowCreate(false); }}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-task-title"
            className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                  New Work Item
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  <span id="create-task-title">Create Task</span>
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add work that can later be verified with evidence.
                </p>
              </div>

              <button
                type="button"
                disabled={creating}
                onClick={() => setShowCreate(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-400 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Task title
                </label>

                <input
                  required
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      title: e.target.value,
                    })
                  }
                  placeholder="e.g. Build authentication flow"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  rows={4}
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe the expected work..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Deadline
                </label>

                <input
                  type="date"
                  value={newTask.deadline}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      deadline: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="task-assignee" className="mb-1.5 block text-sm font-semibold text-slate-700">Assignee</label>
                  <select id="task-assignee" value={newTask.assignedTo} disabled={membersLoading} onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-wait disabled:bg-slate-50">
                    <option value="">{membersLoading ? "Loading members..." : "Unassigned"}</option>
                    {members.map((entry) => {
                      const person = entry.user || entry;
                      return person._id ? <option key={person._id} value={person._id}>{person.name || person.email || "Project member"}{entry.user ? " · Member" : " · Owner"}</option> : null;
                    })}
                  </select>
                </div>
                <div>
                  <label htmlFor="task-initial-status" className="mb-1.5 block text-sm font-semibold text-slate-700">Initial work status</label>
                  <select id="task-initial-status" value={newTask.status} onChange={(e) => setNewTask({ ...newTask, status: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                    <option value="todo">Todo</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {creating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Create Task
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {evidenceTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6" onMouseDown={(event) => { if (event.target === event.currentTarget && !submittingEvidence) setEvidenceTask(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="submit-evidence-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Completion claimed</p>
                <h2 id="submit-evidence-title" className="mt-1 text-lg font-bold text-slate-950">Submit evidence for {evidenceTask.title}</h2>
                <p className="mt-1 text-sm text-slate-500">Submitting proof does not mark the task verified. AI review happens in Verification.</p>
              </div>
              <button type="button" aria-label="Close evidence form" disabled={submittingEvidence} onClick={() => setEvidenceTask(null)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-50"><X size={19} /></button>
            </div>
            <form onSubmit={handleEvidenceSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="proof-description" className="mb-1.5 block text-sm font-semibold text-slate-700">What did you complete?</label>
                <textarea id="proof-description" required rows={3} value={evidenceForm.description} onChange={(e) => setEvidenceForm({ ...evidenceForm, description: e.target.value })} className="w-full resize-y rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="proof-github-url" className="mb-1.5 block text-sm font-semibold text-slate-700">GitHub or commit URL</label>
                <input id="proof-github-url" type="url" value={evidenceForm.githubUrl} onChange={(e) => setEvidenceForm({ ...evidenceForm, githubUrl: e.target.value })} placeholder="https://github.com/..." className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="proof-commit-sha" className="mb-1.5 block text-sm font-semibold text-slate-700">Commit SHA</label>
                  <input id="proof-commit-sha" value={evidenceForm.githubCommitSha} onChange={(e) => setEvidenceForm({ ...evidenceForm, githubCommitSha: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" />
                </div>
                <div>
                  <label htmlFor="proof-deployed-url" className="mb-1.5 block text-sm font-semibold text-slate-700">Deployed URL</label>
                  <input id="proof-deployed-url" type="url" value={evidenceForm.deployedUrl} onChange={(e) => setEvidenceForm({ ...evidenceForm, deployedUrl: e.target.value })} placeholder="https://..." className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label htmlFor="proof-file" className="mb-1.5 block text-sm font-semibold text-slate-700">Screenshot or file</label>
                <input id="proof-file" type="file" accept="image/*,.pdf" onChange={(e) => setEvidenceForm({ ...evidenceForm, file: e.target.files?.[0] || null })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm" />
                <p className="mt-1 text-xs text-slate-500">Up to 5 MB. Add at least one link, commit SHA or file.</p>
              </div>
              {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" disabled={submittingEvidence} onClick={() => setEvidenceTask(null)} className="rounded-md border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={submittingEvidence} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60">
                  {submittingEvidence ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                  {submittingEvidence ? "Uploading evidence..." : "Submit evidence"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, danger = false }) {
  return (
    <div
      className={`min-w-[105px] rounded-xl border px-4 py-3 ${
        danger
          ? "border-red-100 bg-red-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div
        className={`flex items-center gap-1.5 text-xs font-semibold ${
          danger ? "text-red-600" : "text-slate-500"
        }`}
      >
        {icon}
        {title}
      </div>

      <p
        className={`mt-2 text-xl font-bold ${
          danger ? "text-red-700" : "text-slate-950"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function TaskStatus({ status }) {
  const states = {
    todo: { style: "bg-slate-100 text-slate-700", icon: <Circle size={13} /> },
    "in-progress": { style: "bg-indigo-50 text-indigo-800", icon: <Clock3 size={13} /> },
    completed: { style: "bg-emerald-50 text-emerald-800", icon: <CheckCircle2 size={13} /> },
  };
  const current = states[status] || states.todo;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${current.style}`}
    >
      {current.icon}
      {status === "in-progress" ? "In progress" : status === "completed" ? "Completed" : "Todo"}
    </span>
  );
}

function InfoBox({ icon, label, value, danger = false }) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        danger
          ? "border-red-100 bg-red-50"
          : "border-slate-100 bg-slate-50/70"
      }`}
    >
      <div
        className={`flex items-center gap-1.5 text-xs ${
          danger ? "text-red-500" : "text-slate-400"
        }`}
      >
        {icon}
        {label}
      </div>

      <p
        className={`mt-1 truncate text-sm font-semibold ${
          danger ? "text-red-700" : "text-slate-700"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusButton({ label, active, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
        active
          ? "border-indigo-200 bg-indigo-50 text-indigo-700"
          : "border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:text-indigo-600"
      } disabled:opacity-50`}
    >
      {label}
    </button>
  );
}

function isOverdue(task) {
  if (!task.deadline || task.status === "completed") return false;

  const deadline = new Date(task.deadline);
  deadline.setHours(23, 59, 59, 999);

  return deadline < new Date();
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}