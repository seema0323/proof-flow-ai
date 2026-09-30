import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FolderKanban,
  GitCommitHorizontal,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  Upload,
  UsersRound,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useProject } from "../context/ProjectContext";
import {
  getEvidence,
  getGitHubCommits,
  getGitHubContributors,
  getProjectHealth,
  getProjectInsights,
  getProjectReport,
  getProjects,
  getTasks,
  submitEvidence,
} from "../services/api";

export default function Dashboard() {
  const { selectedProjectId } = useProject();
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [health, setHealth] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [commits, setCommits] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [newEvidence, setNewEvidence] = useState({
    description: "",
    githubUrl: "",
    githubCommitSha: "",
    deployedUrl: "",
    file: null,
  });

  useEffect(() => {
    let isCurrent = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");
      setInsights(null);
      setReport(null);
      setHealth(null);
      setTasks([]);
      setCommits([]);
      setContributors([]);
      setSelectedTask(null);
      setVerificationResult(null);
      setNewEvidence({ description: "", githubUrl: "", githubCommitSha: "", deployedUrl: "", file: null });

      try {
        if (!selectedProjectId) {
          const projectData = await getProjects(token);
          if (isCurrent) setProjects(projectData.projects || projectData);
          return;
        }

        const healthData = await getProjectHealth(selectedProjectId, token);
        if (!isCurrent) return;
        setHealth(healthData.health);

        const projectData = await getProjects(token);
        if (!isCurrent) return;
        const projectList = projectData.projects || projectData;
        setProjects(projectList);
        const currentProject = projectList.find((item) => item._id === selectedProjectId);
        if (!currentProject) throw new Error("Selected project is unavailable or access was denied.");

        const taskData = await getTasks(selectedProjectId, token);
        if (!isCurrent) return;
        setTasks(taskData.tasks || taskData);

        if (currentProject.githubOwner && currentProject.githubRepoName) {
          const [commitResult, contributorResult] = await Promise.allSettled([
            getGitHubCommits(selectedProjectId, token),
            getGitHubContributors(selectedProjectId, token),
          ]);
          if (!isCurrent) return;
          if (commitResult.status === "fulfilled") {
            const commitData = commitResult.value;
            setCommits(commitData.commits || commitData);
          }
          if (contributorResult.status === "fulfilled") {
            const contributorData = contributorResult.value;
            setContributors(contributorData.contributors || contributorData);
          }
          if (commitResult.status === "rejected" || contributorResult.status === "rejected") {
            setError("Some GitHub activity could not be loaded. Project health and tasks are current.");
          }
        }
      } catch (loadError) {
        if (isCurrent) setError(loadError.message || "Unable to load project data.");
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      isCurrent = false;
    };
  }, [selectedProjectId, token]);

  const project = projects.find((item) => item._id === selectedProjectId);
  const progressGap = health?.progressGap;

  async function loadInsights() {
    if (!selectedProjectId) return;
    try {
      setInsightsLoading(true);
      setError("");
      const data = await getProjectInsights(selectedProjectId, token);
      setInsights(data.insights);
    } catch (loadError) {
      setError(loadError.message || "Unable to analyze this project.");
    } finally {
      setInsightsLoading(false);
    }
  }

  async function loadReport() {
    if (!selectedProjectId) return;
    try {
      setReportLoading(true);
      setError("");
      const data = await getProjectReport(selectedProjectId, token);
      setReport(data.report);
    } catch (loadError) {
      setError(loadError.message || "Unable to generate the project report.");
    } finally {
      setReportLoading(false);
    }
  }

  async function openEvidenceForm(task) {
    setSelectedTask(task);
    setVerificationResult(null);
    setNewEvidence({ description: "", githubUrl: "", githubCommitSha: "", deployedUrl: "", file: null });

    try {
      const data = await getEvidence(task._id, token);
      const evidence = Array.isArray(data) ? data : data?.evidence || [];
      if (evidence.length) setVerificationResult(evidence[0]);
    } catch (loadError) {
      setError(loadError.message || "Unable to load task evidence.");
    }
  }

  async function handleSubmitEvidence(event) {
    event.preventDefault();
    if (!selectedTask) return;

    const hasProof = newEvidence.githubUrl.trim() || newEvidence.githubCommitSha.trim() || newEvidence.deployedUrl.trim() || newEvidence.file;
    if (!hasProof) {
      setError("Add a GitHub link, commit SHA, deployed URL, or file as supporting proof.");
      return;
    }

    if (newEvidence.file && newEvidence.file.size > 5 * 1024 * 1024) {
      setError("The selected file must be 5 MB or smaller.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const saved = await submitEvidence(
        {
          taskId: selectedTask._id,
          description: newEvidence.description,
          githubUrl: newEvidence.githubUrl,
          githubCommitSha: newEvidence.githubCommitSha,
          deployedUrl: newEvidence.deployedUrl,
          file: newEvidence.file,
        },
        token
      );
      setVerificationResult(saved.evidence);
      setNewEvidence({ description: "", githubUrl: "", githubCommitSha: "", deployedUrl: "", file: null });
      setSelectedTask(null);
    } catch (submitError) {
      setError(submitError.message || "Unable to submit evidence.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!loading && !error && projects.length === 0) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-[#f4f6fb] px-5 py-10 text-slate-900 sm:px-8">
        <section className="mx-auto flex min-h-[420px] max-w-5xl flex-col items-start justify-center rounded-lg border border-slate-200 bg-white px-7 py-10 shadow-sm sm:px-12">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><FolderKanban size={22} /></span>
          <p className="mt-6 text-xs font-bold uppercase tracking-wider text-indigo-600">ProofFlow verification</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-[#0b1020]">Start with a project. Then prove the work.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Create a workspace to connect tasks, submitted evidence, GitHub activity and AI verification in one trusted progress view.</p>
          <Link to="/projects" className="mt-6 inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-offset-4">
            Go to projects <ArrowRight size={16} />
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#f4f6fb] px-5 py-6 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-[1440px]">
        <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Verification command center</p>
            <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-[#0b1020] sm:text-3xl">{project?.name || (selectedProjectId ? "Project overview" : "Your work, verified.")}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">ProofFlow connects claimed progress to submitted evidence and AI review, so project status reflects work that can be proven.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link to="/projects" className="rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">Projects</Link>
            <Link to="/tasks" className="rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">Open tasks</Link>
          </div>
        </header>

        {error && <div role="alert" className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

        {!selectedProjectId ? (
          <section className="mt-6 flex min-h-64 flex-col items-start justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 py-8 sm:px-10">
            <FolderKanban size={24} className="text-indigo-600" />
            <h2 className="mt-4 text-lg font-bold text-[#0b1020]">Choose a project to inspect its proof</h2>
            <p className="mt-1 max-w-lg text-sm leading-6 text-slate-600">Your dashboard follows the selected project across tasks, verification and GitHub activity.</p>
            <Link to="/projects" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-800">Select a project <ArrowRight size={15} /></Link>
          </section>
        ) : (
          <>
            <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <ProgressMetric label="Claimed progress" value={health?.claimedProgress} note={`${health?.claimedTasks ?? "—"} tasks claimed complete`} tone="slate" loading={loading} icon={<Activity size={17} />} />
              <ProgressMetric label="Verified progress" value={health?.verifiedProgress} note="Evidence-backed work" tone="indigo" loading={loading} icon={<ShieldCheck size={17} />} />
              <ProgressMetric label="Progress gap" value={progressGap === undefined ? null : `${Math.abs(progressGap)}%`} note={progressGap === undefined ? "Claimed vs. verified" : progressGap > 0 ? "Claimed work awaiting proof" : progressGap < 0 ? "Verified progress leads claims" : "Claims match verified work"} tone={progressGap > 0 ? "amber" : "emerald"} loading={loading} icon={<AlertTriangle size={17} />} />
              <ProgressMetric label="Project health" value={health?.progress} note={`${health?.completedTasks ?? "—"} of ${health?.totalTasks ?? "—"} tasks completed`} tone="emerald" loading={loading} icon={<CheckCircle2 size={17} />} />
            </section>

            <section className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-bold text-[#0b1020]">Project risk</h2>
                    <p className="mt-1 text-sm text-slate-500">Based on current task and progress signals</p>
                  </div>
                  <RiskBadge level={health?.riskLevel} />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                  <div><p className="text-xs font-medium text-slate-500">Overdue tasks</p><p className="mt-1 text-xl font-bold text-[#0b1020]">{loading ? "—" : health?.overdueTasks ?? 0}</p></div>
                  <div><p className="text-xs font-medium text-slate-500">Contributors</p><p className="mt-1 text-xl font-bold text-[#0b1020]">{loading ? "—" : contributors.length}</p></div>
                </div>
              </div>
              <div className="rounded-lg border border-[#202844] bg-[#0b1020] p-5 text-white shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Evidence pipeline</p><h2 className="mt-1 font-bold">From claim to confidence</h2></div>
                  <ShieldCheck size={20} className="text-emerald-400" />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <PipelineStep icon={<CheckCircle2 size={16} />} label="Claimed work" />
                  <PipelineStep icon={<Upload size={16} />} label="Evidence" />
                  <PipelineStep icon={<Sparkles size={16} />} label="AI verification" />
                  <PipelineStep icon={<ShieldCheck size={16} />} label="Verified work" />
                </div>
              </div>
            </section>

            <section className="mt-3 grid gap-3 xl:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">AI project insights</p><h2 className="mt-1 text-lg font-bold text-[#0b1020]">Signals and next steps</h2></div>
                  <button type="button" onClick={loadInsights} disabled={insightsLoading || loading || !selectedProjectId} className="inline-flex items-center gap-2 rounded-md bg-[#0b1020] px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                    {insightsLoading ? <LoaderCircle size={15} className="animate-spin" /> : <Sparkles size={15} />}{insightsLoading ? "Analyzing" : "Analyze project"}
                  </button>
                </div>
                {insights ? <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <InsightCell label="AI health score" value={`${insights.healthScore ?? "—"}%`} />
                  <InsightCell label="Risk level" value={insights.riskLevel || "Not rated"} />
                  <InsightCell label="Top risk" value={insights.topRisk || "No risk provided"} />
                  <InsightCell label="Next action" value={insights.nextAction || "No action provided"} />
                  <div className="rounded-md bg-indigo-50 p-3 sm:col-span-2"><p className="text-sm leading-6 text-slate-700">{insights.summary}</p>{insights.positiveSignal && <p className="mt-2 flex items-start gap-2 text-sm font-semibold text-emerald-700"><CheckCircle2 size={16} className="mt-0.5 shrink-0" />{insights.positiveSignal}</p>}</div>
                </div> : <p className="mt-5 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">Analyze this project to surface AI-generated risks, positive signals and recommended next actions.</p>}
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">AI generated report</p><h2 className="mt-1 text-lg font-bold text-[#0b1020]">Project status report</h2></div>
                  <button type="button" onClick={loadReport} disabled={reportLoading || loading || !selectedProjectId} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
                    {reportLoading ? <LoaderCircle size={15} className="animate-spin" /> : <FileCheck2 size={15} />}{reportLoading ? "Generating" : "Generate report"}
                  </button>
                </div>
                {report ? <div className="mt-5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700"><Activity size={13} />{report.overallStatus || "Report ready"}</span>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{report.executiveSummary}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <ReportList title="Verified work" items={report.verifiedWork} tone="emerald" />
                    <ReportList title="Blockers" items={report.blockers} tone="amber" />
                    <ReportList title="Next priorities" items={report.nextPriorities} tone="indigo" />
                  </div>
                </div> : <p className="mt-5 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">Generate an evidence-aware summary of verified work, blockers and priorities.</p>}
              </div>
            </section>

            <section className="mt-3 grid gap-3 xl:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2"><GitCommitHorizontal size={18} className="text-slate-500" /><h2 className="font-bold text-[#0b1020]">Recent GitHub activity</h2></div>
                  <Link to="/github" className="text-xs font-semibold text-indigo-700 hover:text-indigo-800">All activity</Link>
                </div>
                {loading ? <LoadingRows /> : commits.length ? <div className="divide-y divide-slate-100">{commits.slice(0, 4).map((commit) => <div key={commit.sha} className="py-3"><p className="line-clamp-2 text-sm font-semibold text-slate-800">{commit.message || "Commit"}</p><p className="mt-1 truncate text-xs text-slate-500">{commit.author || "Unknown author"} <span className="px-1 text-slate-300">·</span>{commit.sha?.slice(0, 8)}</p></div>)}</div> : <InlineEmpty text="No commits available for this project." />}
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2"><UsersRound size={18} className="text-slate-500" /><h2 className="font-bold text-[#0b1020]">Contributors</h2></div>
                  <span className="text-xs font-medium text-slate-500">{loading ? "—" : contributors.length}</span>
                </div>
                {loading ? <LoadingRows /> : contributors.length ? <div className="divide-y divide-slate-100">{contributors.slice(0, 4).map((contributor) => <div key={contributor.username} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">{contributor.avatar ? <img src={contributor.avatar} alt="" className="h-8 w-8 shrink-0 rounded-full border border-slate-200" /> : <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600"><UsersRound size={14} /></span>}<p className="truncate text-sm font-semibold text-slate-800">{contributor.username}</p></div>
                  <span className="shrink-0 text-xs text-slate-500">{contributor.contributions} commits</span>
                </div>)}</div> : <InlineEmpty text="No contributor activity available." />}
              </div>
            </section>

            <section className="mt-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div><h2 className="font-bold text-[#0b1020]">Task pulse</h2><p className="mt-1 text-xs text-slate-500">Claims and deadlines in this project</p></div>
                <Link to="/tasks" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-800">View tasks <ArrowRight size={14} /></Link>
              </div>
              {loading ? <LoadingRows /> : tasks.length ? <div className="divide-y divide-slate-100">{tasks.slice(0, 5).map((task) => <div key={task._id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{task.title}</p><p className="mt-1 truncate text-xs text-slate-500">{task.assignedTo?.name || "Unassigned"}{task.deadline ? ` · Due ${formatDate(task.deadline)}` : " · No deadline"}</p></div>
                <div className="flex shrink-0 items-center gap-2"><TaskState status={task.status} />{task.completionClaimed ? <button type="button" onClick={() => openEvidenceForm(task)} className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"><Upload size={13} />Submit evidence</button> : <Link to="/tasks" className="text-xs font-semibold text-indigo-700 hover:text-indigo-800">Claim in Tasks</Link>}</div>
              </div>)}</div> : <InlineEmpty text="No tasks yet. Create tasks to begin tracking verifiable work." />}
            </section>
          </>
        )}
      </div>

      {verificationResult && !selectedTask && <div role="status" className="fixed bottom-5 right-5 z-40 max-w-sm rounded-lg border border-emerald-200 bg-white p-4 shadow-lg"><div className="flex items-start gap-3"><CheckCircle2 size={18} className="mt-0.5 text-emerald-600" /><div><p className="text-sm font-bold text-slate-900">Evidence {verificationResult.verificationStatus || "submitted"}</p><p className="mt-1 text-xs leading-5 text-slate-600">{verificationResult.verificationStatus === "pending" && !verificationResult.verificationReason ? "Submitted proof is waiting for AI review." : `Score ${verificationResult.verificationScore ?? "—"}% · Confidence ${verificationResult.verificationConfidence || "—"}`}</p><Link to="/verification" className="mt-2 inline-block text-xs font-semibold text-indigo-700">Open Verification</Link></div><button type="button" aria-label="Dismiss evidence status" onClick={() => setVerificationResult(null)} className="ml-2 text-slate-400 hover:text-slate-700"><X size={16} /></button></div></div>}

      {selectedTask && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1020]/55 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) setSelectedTask(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="proof-dialog-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Submit work proof</p><h2 id="proof-dialog-title" className="mt-1 text-lg font-bold text-[#0b1020]">{selectedTask.title}</h2></div><button type="button" aria-label="Close proof form" onClick={() => setSelectedTask(null)} className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X size={19} /></button></div>
          {verificationResult && <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3"><p className="text-sm font-semibold capitalize text-slate-800">Latest proof: {verificationResult.verificationStatus || "submitted"}</p><p className="mt-1 text-xs leading-5 text-slate-600">{verificationResult.verificationReason || "No AI reasoning is available yet."}</p></div>}
          <form onSubmit={handleSubmitEvidence} className="mt-5 space-y-4">
            <Field label="Work description"><textarea required rows={3} value={newEvidence.description} onChange={(event) => setNewEvidence({ ...newEvidence, description: event.target.value })} placeholder="Describe what you completed" className="w-full resize-y rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500" /></Field>
            <Field label="GitHub or commit URL (optional)"><input type="url" value={newEvidence.githubUrl} onChange={(event) => setNewEvidence({ ...newEvidence, githubUrl: event.target.value })} placeholder="https://github.com/..." className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500" /></Field>
            <Field label="Commit SHA (optional)"><input value={newEvidence.githubCommitSha} onChange={(event) => setNewEvidence({ ...newEvidence, githubCommitSha: event.target.value })} placeholder="Commit SHA" className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500" /></Field>
            <Field label="Deployed URL (optional)"><input type="url" value={newEvidence.deployedUrl} onChange={(event) => setNewEvidence({ ...newEvidence, deployedUrl: event.target.value })} placeholder="https://" className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500" /></Field>
            <Field label="Screenshot or file (optional)"><input type="file" accept="image/*,.pdf" onChange={(event) => setNewEvidence({ ...newEvidence, file: event.target.files?.[0] || null })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /><span className="mt-1 block text-xs text-slate-500">Maximum file size: 5 MB</span></Field>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" disabled={submitting} onClick={() => setSelectedTask(null)} className="rounded-md border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button><button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60">{submitting ? <LoaderCircle size={15} className="animate-spin" /> : <Upload size={15} />}{submitting ? "Uploading evidence" : "Submit evidence"}</button></div>
          </form>
        </section>
      </div>}
    </main>
  );
}

function ProgressMetric({ label, value, note, tone, loading, icon }) {
  const tones = {
    slate: { icon: "text-slate-500", bar: "bg-slate-500", surface: "bg-slate-100" },
    indigo: { icon: "text-indigo-600", bar: "bg-indigo-600", surface: "bg-indigo-100" },
    amber: { icon: "text-amber-700", bar: "bg-amber-500", surface: "bg-amber-100" },
    emerald: { icon: "text-emerald-700", bar: "bg-emerald-600", surface: "bg-emerald-100" },
  };
  const style = tones[tone] || tones.slate;
  const numericValue = Number(value);
  const barWidth = Number.isFinite(numericValue) ? Math.min(100, Math.max(0, numericValue)) : 0;

  return <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
    <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-slate-600">{label}</p><span className={`flex h-8 w-8 items-center justify-center rounded-md ${style.surface} ${style.icon}`}>{icon}</span></div>
    <p className="mt-4 text-3xl font-bold tracking-tight text-[#0b1020]">{loading ? "—" : value === null || value === undefined || value === "" ? "—" : typeof value === "number" ? `${value}%` : value}</p>
    <div className={`mt-3 h-1.5 overflow-hidden rounded-full ${style.surface}`}><div className={`h-full rounded-full transition-[width] duration-500 ${style.bar}`} style={{ width: `${barWidth}%` }} /></div>
    <p className="mt-2 truncate text-xs text-slate-500">{note}</p>
  </article>;
}

function PipelineStep({ icon, label }) {
  return <div className="flex min-w-0 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-2.5"><span className="shrink-0 text-indigo-300">{icon}</span><span className="text-xs font-semibold leading-4 text-slate-100">{label}</span></div>;
}

function RiskBadge({ level }) {
  const config = {
    low: { label: "Low risk", icon: <CheckCircle2 size={14} />, style: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    medium: { label: "Medium risk", icon: <AlertTriangle size={14} />, style: "border-amber-200 bg-amber-50 text-amber-800" },
    high: { label: "High risk", icon: <AlertTriangle size={14} />, style: "border-red-200 bg-red-50 text-red-700" },
  };
  const current = config[level] || { label: "Not rated", icon: <Clock3 size={14} />, style: "border-slate-200 bg-slate-50 text-slate-600" };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${current.style}`}>{current.icon}{current.label}</span>;
}

function TaskState({ status }) {
  const states = {
    completed: { label: "Completed", icon: <CheckCircle2 size={13} />, style: "bg-emerald-50 text-emerald-700" },
    "in-progress": { label: "In progress", icon: <Activity size={13} />, style: "bg-indigo-50 text-indigo-700" },
    todo: { label: "To do", icon: <Clock3 size={13} />, style: "bg-slate-100 text-slate-600" },
  };
  const current = states[status] || states.todo;
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${current.style}`}>{current.icon}{current.label}</span>;
}

function InsightCell({ label, value }) {
  return <div className="min-w-0 rounded-md border border-slate-200 p-3"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 break-words text-sm font-semibold capitalize leading-5 text-slate-800">{value}</p></div>;
}

function ReportList({ title, items, tone }) {
  const styles = { emerald: "border-emerald-200 bg-emerald-50", amber: "border-amber-200 bg-amber-50", indigo: "border-indigo-200 bg-indigo-50" };
  const values = Array.isArray(items) ? items : [];
  return <div className={`rounded-md border p-3 ${styles[tone]}`}><h3 className="text-xs font-bold text-slate-800">{title}</h3>{values.length ? <ul className="mt-2 space-y-2">{values.map((item, index) => <li key={`${title}-${index}`} className="text-xs leading-5 text-slate-700">{item}</li>)}</ul> : <p className="mt-2 text-xs text-slate-500">None reported</p>}</div>;
}

function Field({ label, children }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}<span className="mt-1.5 block">{children}</span></label>;
}

function LoadingRows() {
  return <div className="divide-y divide-slate-100" aria-label="Loading project activity"><div className="h-14 animate-pulse bg-slate-50" /><div className="h-14 animate-pulse bg-slate-50" /><div className="h-14 animate-pulse bg-slate-50" /></div>;
}

function InlineEmpty({ text }) {
  return <p className="py-7 text-center text-sm text-slate-500">{text}</p>;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(new Date(date));
}