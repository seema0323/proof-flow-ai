import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  Search,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock3,
  ExternalLink,
  FileCheck2,
  BrainCircuit,
  Filter,
} from "lucide-react";

import {
  getTasks,
  getEvidence,
  verifyEvidenceWithAI,
} from "../services/api";

const token = import.meta.env.VITE_AUTH_TOKEN;
const PROJECT_ID = "6a9bef510dd60e7bf06339e3";

export default function Verification() {
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState("");
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  async function loadVerificationData() {
    try {
      setLoading(true);
      setError("");

      const taskData = await getTasks(PROJECT_ID, token);
      const tasks = Array.isArray(taskData)
        ? taskData
        : taskData?.tasks || [];

      const evidenceRequests = tasks.map(async (task) => {
        try {
          const response = await getEvidence(task._id, token);

          const taskEvidence = Array.isArray(response)
            ? response
            : response?.evidence || [];

          return taskEvidence.map((item) => ({
            ...item,
            taskInfo: task,
          }));
        } catch {
          return [];
        }
      });

      const results = await Promise.all(evidenceRequests);

      const allEvidence = results
        .flat()
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0) -
            new Date(a.createdAt || 0)
        );

      setEvidence(allEvidence);
    } catch (err) {
      setError(err.message || "Unable to load verification data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVerificationData();
  }, []);

  async function handleAIVerify(evidenceId) {
    try {
      setVerifyingId(evidenceId);
      setError("");

      await verifyEvidenceWithAI(evidenceId, token);

      await loadVerificationData();
    } catch (err) {
      setError(err.message || "AI verification failed.");
    } finally {
      setVerifyingId("");
    }
  }

  const filteredEvidence = useMemo(() => {
    const query = search.trim().toLowerCase();

    return evidence.filter((item) => {
      const taskTitle =
        item.taskInfo?.title?.toLowerCase() || "";

      const description =
        item.description?.toLowerCase() || "";

      const submitter =
        item.submittedBy?.name?.toLowerCase() || "";

      const matchesSearch =
        !query ||
        taskTitle.includes(query) ||
        description.includes(query) ||
        submitter.includes(query);

      const matchesFilter =
        filter === "all" ||
        item.verificationStatus === filter;

      return matchesSearch && matchesFilter;
    });
  }, [evidence, search, filter]);

  const pendingCount = evidence.filter(
    (item) => item.verificationStatus === "pending"
  ).length;

  const verifiedCount = evidence.filter(
    (item) => item.verificationStatus === "verified"
  ).length;

  const rejectedCount = evidence.filter(
    (item) => item.verificationStatus === "rejected"
  ).length;

  const averageScore =
    evidence.length > 0
      ? Math.round(
          evidence.reduce(
            (sum, item) =>
              sum + Number(item.verificationScore || 0),
            0
          ) / evidence.length
        )
      : 0;

  return (
    <div className="min-h-screen bg-[#f6f8fc]">
      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
              Proof Intelligence
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              Verification Center
            </h1>
          </div>

          <div className="hidden items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 sm:flex">
            <ShieldCheck size={17} />
            Verification Engine Active
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
                AI Evidence Verification
              </div>

              <h2 className="mt-3 max-w-3xl text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
                Turn submitted proof into trusted work.
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                ProofFlow compares task requirements with submitted
                evidence and uses AI to identify verified, pending and
                rejected work.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric
                label="Pending"
                value={pendingCount}
                type="pending"
              />

              <Metric
                label="Verified"
                value={verifiedCount}
                type="verified"
              />

              <Metric
                label="Rejected"
                value={rejectedCount}
                type="rejected"
              />

              <Metric
                label="Avg. Score"
                value={`${averageScore}%`}
                type="score"
              />
            </div>
          </div>
        </section>

        {/* TOOLBAR */}
        <section className="mt-7 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Evidence Queue
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {evidence.length} submitted proof
              {evidence.length === 1 ? "" : "s"}
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
                placeholder="Search evidence..."
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
                <option value="all">All evidence</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <section className="mt-6 grid gap-5 xl:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </section>
        )}

        {/* EVIDENCE */}
        {!loading && filteredEvidence.length > 0 && (
          <section className="mt-6 grid gap-5 xl:grid-cols-2">
            {filteredEvidence.map((item) => (
              <EvidenceCard
                key={item._id}
                item={item}
                verifying={verifyingId === item._id}
                onVerify={() => handleAIVerify(item._id)}
              />
            ))}
          </section>
        )}

        {/* EMPTY */}
        {!loading && filteredEvidence.length === 0 && (
          <section className="mt-6 flex min-h-[340px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <FileCheck2 size={26} />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-950">
              {search || filter !== "all"
                ? "No matching evidence"
                : "No evidence submitted yet"}
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              {search || filter !== "all"
                ? "Try another search or verification filter."
                : "Submit proof from a task and it will appear here for AI verification."}
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

function EvidenceCard({ item, verifying, onVerify }) {
  const status = item.verificationStatus || "pending";
  const score = Number(item.verificationScore || 0);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-indigo-200 hover:shadow-md">
      <div className="p-5">
        {/* TOP */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <ShieldCheck size={20} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Task evidence
              </p>

              <h3 className="mt-1 truncate font-bold text-slate-950">
                {item.taskInfo?.title || "Unknown task"}
              </h3>
            </div>
          </div>

          <VerificationStatus status={status} />
        </div>

        {/* DESCRIPTION */}
        <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Submitted proof
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {item.description || "No description provided."}
          </p>
        </div>

        {/* LINKS */}
        <div className="mt-4 flex flex-wrap gap-2">
          {item.githubUrl && (
            <EvidenceLink
              href={item.githubUrl}
              label="GitHub proof"
            />
          )}

          {item.deployedUrl && (
            <EvidenceLink
              href={item.deployedUrl}
              label="Live deployment"
            />
          )}

          {item.fileUrl && (
            <EvidenceLink
              href={item.fileUrl}
              label="Uploaded file"
            />
          )}

          {item.githubCommitSha && (
            <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
              Commit {item.githubCommitSha.slice(0, 8)}
            </span>
          )}
        </div>

        {/* AI RESULT */}
        <div className="mt-5 rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BrainCircuit
                size={17}
                className="text-indigo-600"
              />

              <p className="text-sm font-bold text-slate-900">
                AI Verification
              </p>
            </div>

            <p className="text-lg font-bold text-indigo-600">
              {score}%
            </p>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{
                width: `${Math.min(100, Math.max(0, score))}%`,
              }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              Confidence
            </span>

            <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold capitalize text-slate-700">
              {item.verificationConfidence || "low"}
            </span>
          </div>

          {item.verificationReason && (
            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold text-slate-400">
                AI reasoning
              </p>

              <p className="mt-1 text-sm leading-5 text-slate-600">
                {item.verificationReason}
              </p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-slate-400">
              Submitted by
            </p>

            <p className="mt-0.5 text-sm font-semibold text-slate-700">
              {item.submittedBy?.name || "Project member"}
            </p>
          </div>

          <button
            type="button"
            disabled={verifying}
            onClick={onVerify}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {verifying ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                {status === "pending"
                  ? "Verify with AI"
                  : "Run AI Again"}
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value, type }) {
  const styles = {
    pending: "bg-amber-50 border-amber-100 text-amber-700",
    verified:
      "bg-emerald-50 border-emerald-100 text-emerald-700",
    rejected: "bg-red-50 border-red-100 text-red-700",
    score: "bg-indigo-50 border-indigo-100 text-indigo-700",
  };

  return (
    <div
      className={`min-w-[105px] rounded-xl border px-4 py-3 ${
        styles[type] || styles.score
      }`}
    >
      <p className="text-xs font-semibold opacity-75">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold">
        {value}
      </p>
    </div>
  );
}

function VerificationStatus({ status }) {
  const config = {
    verified: {
      style: "bg-emerald-50 text-emerald-700",
      icon: <CheckCircle2 size={13} />,
      label: "Verified",
    },

    rejected: {
      style: "bg-red-50 text-red-700",
      icon: <XCircle size={13} />,
      label: "Rejected",
    },

    pending: {
      style: "bg-amber-50 text-amber-700",
      icon: <Clock3 size={13} />,
      label: "Pending",
    },
  };

  const current = config[status] || config.pending;

  return (
    <span
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${current.style}`}
    >
      {current.icon}
      {current.label}
    </span>
  );
}

function EvidenceLink({ href, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
    >
      {label}
      <ExternalLink size={12} />
    </a>
  );
}