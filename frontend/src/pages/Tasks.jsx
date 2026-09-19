import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  CheckCircle2,
  Clock3,
  Circle,
  AlertTriangle,
  ListTodo,
  CalendarDays,
  UserRound,
  Loader2,
  Sparkles,
  Filter,
} from "lucide-react";

import {
  getTasks,
  createTask,
  updateTaskStatus,
} from "../services/api";

const token = import.meta.env.VITE_AUTH_TOKEN;
const PROJECT_ID = "6a9bef510dd60e7bf06339e3";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    deadline: "",
  });

  async function loadTasks() {
    try {
      setLoading(true);
      setError("");

      const data = await getTasks(PROJECT_ID, token);

      if (Array.isArray(data)) {
        setTasks(data);
      } else {
        setTasks(data?.tasks || []);
      }
    } catch (err) {
      setError(err.message || "Unable to load tasks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

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

  async function handleCreateTask(e) {
    e.preventDefault();

    if (!newTask.title.trim()) return;

    try {
      setCreating(true);
      setError("");

      const payload = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        project: PROJECT_ID,
      };

      if (newTask.deadline) {
        payload.deadline = newTask.deadline;
      }

      await createTask(payload, token);

      setNewTask({
        title: "",
        description: "",
        deadline: "",
      });

      setShowCreate(false);
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
    <div className="min-h-screen bg-[#f6f8fc]">
      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
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
            className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus size={17} />
            Create Task
          </button>
        </div>
      </header>

      <main className="px-6 py-7 lg:px-8">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-indigo-100/70 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
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

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                      <span className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700">
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
                        Update status
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
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {/* EMPTY */}
        {!loading && filteredTasks.length === 0 && (
          <section className="mt-6 flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <ListTodo size={25} />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-950">
              No tasks found
            </h3>

            <p className="mt-2 max-w-md text-sm text-slate-500">
              {search || filter !== "all"
                ? "Change your search or filter to find another task."
                : "Create your first task to start tracking verified work."}
            </p>

            {!search && filter === "all" && (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="mt-5 flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white"
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
          onMouseDown={() => setShowCreate(false)}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                  New Work Item
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  Create Task
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add work that can later be verified with evidence.
                </p>
              </div>

              <button
                type="button"
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
  const styles = {
    todo: "bg-slate-100 text-slate-600",
    "in-progress": "bg-indigo-50 text-indigo-700",
    completed: "bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
        styles[status] || styles.todo
      }`}
    >
      {status === "in-progress"
        ? "In progress"
        : status === "completed"
          ? "Completed"
          : "Todo"}
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