import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Activity,
  Search,
  ExternalLink,
  Sparkles,
  Loader2,
  Code2,
  CheckCircle2,
  GitCommitHorizontal,
  RefreshCw,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";

import {
  getGitHubCommits,
  getGitHubContributors,
} from "../services/api";

const token = import.meta.env.VITE_AUTH_TOKEN;
const PROJECT_ID = "6a9bef510dd60e7bf06339e3";

export default function GitHubActivity() {
  const [commits, setCommits] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadGitHubData(refresh = false) {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      setError("");

      const [commitResponse, contributorResponse] =
        await Promise.all([
          getGitHubCommits(PROJECT_ID, token),
          getGitHubContributors(PROJECT_ID, token),
        ]);

      const commitData = Array.isArray(commitResponse)
        ? commitResponse
        : commitResponse?.commits ||
          commitResponse?.data ||
          [];

      const contributorData = Array.isArray(
        contributorResponse
      )
        ? contributorResponse
        : contributorResponse?.contributors ||
          contributorResponse?.data ||
          [];

      setCommits(commitData);
      setContributors(contributorData);
    } catch (err) {
      console.error(err);
      setError(
        err?.message || "Unable to load GitHub activity."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadGitHubData();
  }, []);

  const filteredCommits = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return commits;

    return commits.filter((commit) => {
      const message = getCommitMessage(commit).toLowerCase();
      const author = getCommitAuthor(commit).toLowerCase();
      const sha = getCommitSha(commit).toLowerCase();

      return (
        message.includes(query) ||
        author.includes(query) ||
        sha.includes(query)
      );
    });
  }, [commits, search]);

  const latestCommit = commits[0];

  return (
    <div className="min-h-screen bg-[#f6f8fc]">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
              Development Intelligence
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              GitHub Activity
            </h1>
          </div>

          <button
            onClick={() => loadGitHubData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      <main className="px-6 py-7 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-indigo-100/70 blur-3xl" />

          <div className="relative flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600">
                <Sparkles size={16} />
                Repository Intelligence
              </div>

              <h2 className="mt-3 max-w-3xl text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">
                See the development activity behind every claim.
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                ProofFlow connects repository activity with
                project work so commits and contributors become
                part of the verification trail.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Metric
                icon={<GitCommitHorizontal size={16} />}
                label="Commits"
                value={commits.length}
              />

              <Metric
                icon={<Users size={16} />}
                label="Contributors"
                value={contributors.length}
              />

              <Metric
                icon={<Activity size={16} />}
                label="Connection"
                value="Live"
                success
              />
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 flex min-h-80 items-center justify-center rounded-3xl border border-slate-200 bg-white">
            <div className="text-center">
              <Loader2
                size={28}
                className="mx-auto animate-spin text-indigo-600"
              />

              <p className="mt-3 text-sm text-slate-500">
                Loading repository activity...
              </p>
            </div>
          </div>
        ) : (
          <>
            <section className="mt-6 grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-[#0b1020] p-5 text-white shadow-sm lg:col-span-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <FaGithub />
                      Connected Repository
                    </div>

                    <h3 className="mt-3 text-xl font-bold">
                      seema0323 / proof-flow-ai
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      GitHub activity is connected to
                      ProofFlow&apos;s evidence verification
                      pipeline.
                    </p>
                  </div>

                  <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
                    <CheckCircle2 size={20} />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <Tag text="REST API connected" />
                  <Tag text="Commit verification" />
                  <Tag text="Contributor tracking" />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Latest Activity
                </p>

                {latestCommit ? (
                  <>
                    <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Code2 size={18} />
                    </div>

                    <p className="mt-4 line-clamp-2 text-sm font-bold leading-5 text-slate-900">
                      {getCommitMessage(latestCommit)}
                    </p>

                    <p className="mt-2 text-xs font-medium text-slate-500">
                      {getCommitAuthor(latestCommit)}
                    </p>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    No commits found.
                  </p>
                )}
              </div>
            </section>

            <section className="mt-6 grid gap-5 xl:grid-cols-[1.7fr_0.8fr]">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-bold text-slate-950">
                      Recent Commits
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {commits.length} recent repository updates
                    </p>
                  </div>

                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      value={search}
                      onChange={(e) =>
                        setSearch(e.target.value)
                      }
                      placeholder="Search commits..."
                      className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 sm:w-64"
                    />
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {filteredCommits.length > 0 ? (
                    filteredCommits.map((commit, index) => (
                      <CommitRow
                        key={getCommitSha(commit) || index}
                        commit={commit}
                      />
                    ))
                  ) : (
                    <div className="p-10 text-center text-sm text-slate-500">
                      No matching commits found.
                    </div>
                  )}
                </div>
              </div>

              <div className="h-fit rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5">
                  <h2 className="font-bold text-slate-950">
                    Contributors
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Repository contribution activity
                  </p>
                </div>

                <div className="space-y-3 p-5">
                  {contributors.length > 0 ? (
                    contributors.map(
                      (contributor, index) => (
                        <Contributor
                          key={
                            contributor?.id ||
                            contributor?.login ||
                            contributor?.username ||
                            index
                          }
                          contributor={contributor}
                        />
                      )
                    )
                  ) : (
                    <p className="py-8 text-center text-sm text-slate-500">
                      No contributors found.
                    </p>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Tag({ text }) {
  return (
    <span className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
      {text}
    </span>
  );
}

function Metric({ icon, label, value, success = false }) {
  return (
    <div className="min-w-[105px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div
        className={`flex items-center gap-1.5 text-xs font-semibold ${
          success
            ? "text-emerald-600"
            : "text-slate-500"
        }`}
      >
        {icon}
        {label}
      </div>

      <p
        className={`mt-2 text-xl font-bold ${
          success
            ? "text-emerald-700"
            : "text-slate-950"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function CommitRow({ commit }) {
  const message = getCommitMessage(commit);
  const sha = getCommitSha(commit);
  const url = getCommitUrl(commit);
  const date = getCommitDate(commit);

  return (
    <div className="group flex items-start gap-4 p-5 transition hover:bg-slate-50/70">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <GitCommitHorizontal size={17} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-5 text-slate-800">
          {message}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-medium">
            {getCommitAuthor(commit)}
          </span>

          {sha && (
            <>
              <span>•</span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">
                {sha.slice(0, 7)}
              </span>
            </>
          )}

          {date && (
            <>
              <span>•</span>
              <span>{formatDate(date)}</span>
            </>
          )}
        </div>
      </div>

      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg p-2 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
        >
          <ExternalLink size={15} />
        </a>
      )}
    </div>
  );
}

function Contributor({ contributor }) {
  const username = getContributorName(contributor);
  const avatar = getContributorAvatar(contributor);
  const profileUrl = getContributorUrl(contributor);
  const contributions = getContributionCount(contributor);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
      {avatar ? (
        <img
          src={avatar}
          alt={username}
          className="h-10 w-10 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-600">
          {username.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-800">
          {username}
        </p>

        <p className="mt-0.5 text-xs text-slate-500">
          {contributions} contributions
        </p>
      </div>

      {profileUrl && (
        <a
          href={profileUrl}
          target="_blank"
          rel="noreferrer"
          className="text-slate-400 transition hover:text-indigo-600"
        >
          <ExternalLink size={15} />
        </a>
      )}
    </div>
  );
}

function getCommitMessage(commit) {
  return (
    commit?.commit?.message ||
    commit?.message ||
    commit?.title ||
    "Repository update"
  );
}

function getCommitAuthor(commit) {
  if (typeof commit?.author === "string") {
    return commit.author;
  }

  if (typeof commit?.user === "string") {
    return commit.user;
  }

  return (
    commit?.author?.login ||
    commit?.author?.name ||
    commit?.user?.login ||
    commit?.user?.name ||
    commit?.login ||
    commit?.username ||
    commit?.committer?.login ||
    commit?.commit?.author?.name ||
    commit?.commit?.committer?.name ||
    "seema0323"
  );
}

function getCommitSha(commit) {
  return (
    commit?.sha ||
    commit?.commitSha ||
    commit?.commit_sha ||
    ""
  );
}

function getCommitUrl(commit) {
  return (
    commit?.html_url ||
    commit?.htmlUrl ||
    commit?.commitUrl ||
    commit?.commit_url ||
    ""
  );
}

function getCommitDate(commit) {
  return (
    commit?.commit?.author?.date ||
    commit?.commit?.committer?.date ||
    commit?.date ||
    commit?.created_at ||
    commit?.createdAt ||
    ""
  );
}

function getContributorName(contributor) {
  if (typeof contributor === "string") {
    return contributor;
  }

  return (
    contributor?.login ||
    contributor?.username ||
    contributor?.name ||
    contributor?.author?.login ||
    contributor?.author?.name ||
    contributor?.user?.login ||
    contributor?.user?.name ||
    "seema0323"
  );
}

function getContributorAvatar(contributor) {
  return (
    contributor?.avatar_url ||
    contributor?.avatarUrl ||
    contributor?.avatar ||
    contributor?.author?.avatar_url ||
    contributor?.user?.avatar_url ||
    ""
  );
}

function getContributorUrl(contributor) {
  return (
    contributor?.html_url ||
    contributor?.htmlUrl ||
    contributor?.profileUrl ||
    contributor?.profile_url ||
    contributor?.author?.html_url ||
    contributor?.user?.html_url ||
    ""
  );
}

function getContributionCount(contributor) {
  return (
    contributor?.contributions ??
    contributor?.commitCount ??
    contributor?.commit_count ??
    contributor?.commits ??
    contributor?.total ??
    0
  );
}

function formatDate(date) {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}