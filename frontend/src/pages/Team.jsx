import { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserRound,
  ShieldCheck,
  CheckCircle2,
  Clock3,
  ListTodo,
  Sparkles,
  Search,
  Loader2,
  Crown,
} from "lucide-react";

import { getTasks } from "../services/api";

const token = import.meta.env.VITE_AUTH_TOKEN;
const PROJECT_ID = "6a9bef510dd60e7bf06339e3";
const API_URL = "http://localhost:5000";

export default function Team() {
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTeam() {
    try {
      setLoading(true);
      setError("");

      const [memberResponse, taskData] = await Promise.all([
        fetch(`${API_URL}/api/projects/${PROJECT_ID}/members`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        getTasks(PROJECT_ID, token),
      ]);

      const memberData = await memberResponse.json();

      if (!memberResponse.ok) {
        throw new Error(
          memberData.message || "Unable to load team members."
        );
      }

      const memberList = Array.isArray(memberData)
        ? memberData
        : memberData.members || [];

      const taskList = Array.isArray(taskData)
        ? taskData
        : taskData?.tasks || [];

      setMembers(memberList);
      setTasks(taskList);
    } catch (err) {
      setError(err.message || "Unable to load team.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeam();
  }, []);

  const normalizedMembers = useMemo(() => {
    return members.map((entry) => {
      const user =
        entry.user ||
        entry.member ||
        entry.userId ||
        entry;

      const memberId =
        user?._id ||
        entry?._id ||
        entry?.user?._id;

      const assignedTasks = tasks.filter((task) => {
        const assignedId =
          task.assignedTo?._id ||
          task.assignedTo;

        return (
          assignedId &&
          memberId &&
          String(assignedId) === String(memberId)
        );
      });

      const completed = assignedTasks.filter(
        (task) => task.status === "completed"
      ).length;

      const inProgress = assignedTasks.filter(
        (task) => task.status === "in-progress"
      ).length;

      const claimed = assignedTasks.filter(
        (task) => task.completionClaimed
      ).length;

      return {
        id: memberId || entry?._id,
        name: user?.name || entry?.name || "Team Member",
        email: user?.email || entry?.email || "",
        role: entry?.role || "member",
        assigned: assignedTasks.length,
        completed,
        inProgress,
        claimed,
      };
    });
  }, [members, tasks]);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return normalizedMembers;

    return normalizedMembers.filter(
      (member) =>
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query)
    );
  }, [normalizedMembers, search]);

  const assignedTaskCount = tasks.filter(
    (task) => task.assignedTo
  ).length;

  const unassignedCount =
    tasks.length - assignedTaskCount;

  return (
    <div className="min-h-screen bg-[#f6f8fc]">
      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
              Contribution Intelligence
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              Team
            </h1>
          </div>

          <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 sm:flex">
            <Users size={17} />
            {normalizedMembers.length} Members
          </div>
        </div>
      </header>

      <main className="px-6 py-7 lg:px-8">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-indigo-100/70 blur-3xl" />

          <div className="relative flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600">
                <Sparkles size={16} />
                Verified contribution intelligence
              </div>

              <h2 className="mt-3 max-w-3xl text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
                Understand who is contributing to the project.
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Connect team membership with assigned work, progress and
                completion claims instead of relying only on self-reported
                contribution.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Metric
                label="Members"
                value={normalizedMembers.length}
                icon={<Users size={16} />}
              />

              <Metric
                label="Assigned"
                value={assignedTaskCount}
                icon={<ListTodo size={16} />}
              />

              <Metric
                label="Unassigned"
                value={unassignedCount}
                icon={<UserRound size={16} />}
                warning={unassignedCount > 0}
              />
            </div>
          </div>
        </section>

        {/* TOOLBAR */}
        <section className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Project Members
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Workload and contribution overview
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none"
            />
          </div>
        </section>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-6 flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white">
            <div className="text-center">
              <Loader2
                size={28}
                className="mx-auto animate-spin text-indigo-600"
              />

              <p className="mt-3 text-sm text-slate-500">
                Loading team intelligence...
              </p>
            </div>
          </div>
        )}

        {!loading && filteredMembers.length > 0 && (
          <section className="mt-6 grid gap-5 xl:grid-cols-2">
            {filteredMembers.map((member, index) => (
              <MemberCard
                key={member.id || index}
                member={member}
              />
            ))}
          </section>
        )}

        {!loading && filteredMembers.length === 0 && (
          <section className="mt-6 flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white text-center">
            <Users size={28} className="text-indigo-500" />

            <h3 className="mt-4 font-bold text-slate-950">
              No members found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              No project member matches your search.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

function MemberCard({ member }) {
  const progress =
    member.assigned > 0
      ? Math.round(
          (member.completed / member.assigned) * 100
        )
      : 0;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 font-bold text-indigo-700">
          {getInitials(member.name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-slate-950">
              {member.name}
            </h3>

            <RoleBadge role={member.role} />
          </div>

          {member.email && (
            <p className="mt-1 truncate text-sm text-slate-500">
              {member.email}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <MemberMetric
          label="Assigned"
          value={member.assigned}
        />

        <MemberMetric
          label="In Progress"
          value={member.inProgress}
        />

        <MemberMetric
          label="Completed"
          value={member.completed}
        />
      </div>

      <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck
              size={16}
              className="text-indigo-600"
            />

            <p className="text-sm font-semibold text-slate-700">
              Task completion
            </p>
          </div>

          <p className="text-sm font-bold text-indigo-600">
            {progress}%
          </p>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-indigo-600"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>
            {member.completed} completed
          </span>

          <span>
            {member.claimed} claimed
          </span>
        </div>
      </div>

      {member.assigned === 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-700">
          <Clock3 size={14} />
          No tasks currently assigned
        </div>
      )}

      {member.completed > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700">
          <CheckCircle2 size={14} />
          Completed project work recorded
        </div>
      )}
    </article>
  );
}

function Metric({ label, value, icon, warning = false }) {
  return (
    <div
      className={`min-w-[105px] rounded-xl border px-4 py-3 ${
        warning
          ? "border-amber-100 bg-amber-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div
        className={`flex items-center gap-1.5 text-xs font-semibold ${
          warning ? "text-amber-600" : "text-slate-500"
        }`}
      >
        {icon}
        {label}
      </div>

      <p
        className={`mt-2 text-xl font-bold ${
          warning ? "text-amber-700" : "text-slate-950"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function MemberMetric({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function RoleBadge({ role }) {
  const owner = role === "owner";

  return (
    <span
      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        owner
          ? "bg-indigo-50 text-indigo-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {owner && <Crown size={12} />}
      {owner ? "Owner" : "Member"}
    </span>
  );
}

function getInitials(name = "") {
  const words = name.trim().split(/\s+/);

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("") || "TM";
}