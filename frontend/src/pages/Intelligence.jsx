import { useState } from "react";
import {
  BrainCircuit,
  Sparkles,
  ShieldAlert,
  Target,
  TrendingUp,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
} from "lucide-react";

import {
  getProjectInsights,
  getProjectReport,
} from "../services/api";

const token = import.meta.env.VITE_AUTH_TOKEN;
const PROJECT_ID = "6a9bef510dd60e7bf06339e3";

export default function Intelligence() {
  const [insights, setInsights] = useState(null);
  const [report, setReport] = useState(null);

  const [insightsLoading, setInsightsLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  const [error, setError] = useState("");

  async function analyzeProject() {
    try {
      setInsightsLoading(true);
      setError("");

      const data = await getProjectInsights(PROJECT_ID, token);
      setInsights(data);
    } catch (err) {
      setError(err.message || "Unable to generate AI insights.");
    } finally {
      setInsightsLoading(false);
    }
  }

  async function generateReport() {
    try {
      setReportLoading(true);
      setError("");

      const data = await getProjectReport(PROJECT_ID, token);
      setReport(data);
    } catch (err) {
      setError(err.message || "Unable to generate project report.");
    } finally {
      setReportLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc]">
      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
              AI Decision Support
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              AI Intelligence
            </h1>
          </div>

          <div className="hidden items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 sm:flex">
            <BrainCircuit size={17} />
            Gemini Intelligence
          </div>
        </div>
      </header>

      <main className="px-6 py-7 lg:px-8">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-3xl bg-[#0b1020] p-7 text-white shadow-sm">
          <div className="absolute -right-20 -top-32 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute bottom-[-140px] left-1/3 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-300">
                <Sparkles size={16} />
                ProofFlow Intelligence Engine
              </div>

              <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight md:text-4xl">
                Turn verified project data into actionable intelligence.
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
                Analyze tasks, evidence and project activity to surface risks,
                priorities and an evidence-aware project status report.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
                  <BrainCircuit size={21} />
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Intelligence source
                  </p>
                  <p className="mt-0.5 text-sm font-semibold">
                    Tasks + Evidence + AI
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* ACTION CARDS */}
        <section className="mt-6 grid gap-5 xl:grid-cols-2">
          <ActionCard
            icon={<BrainCircuit size={21} />}
            eyebrow="AI Project Analysis"
            title="Project Intelligence"
            description="Find the most important project risk, next action and positive signal from current project data."
            buttonText={
              insights
                ? "Analyze Again"
                : "Analyze Project"
            }
            loading={insightsLoading}
            onClick={analyzeProject}
          />

          <ActionCard
            icon={<FileText size={21} />}
            eyebrow="Evidence-Aware Reporting"
            title="Project Status Report"
            description="Generate a concise status report that separates verified work from blockers and next priorities."
            buttonText={
              report
                ? "Regenerate Report"
                : "Generate Report"
            }
            loading={reportLoading}
            onClick={generateReport}
          />
        </section>

        {/* INSIGHTS */}
        {insights && (
          <section className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600">
                  Latest Analysis
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  AI Project Insights
                </h2>
              </div>

              <button
                type="button"
                onClick={analyzeProject}
                disabled={insightsLoading}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
              >
                <RefreshCw size={15} />
                Refresh
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <InsightCard
                icon={<TrendingUp size={18} />}
                title="AI Health Score"
                value={`${insights.healthScore ?? 0}%`}
                description="AI assessment of current project execution."
                type="score"
              />

              <InsightCard
                icon={<ShieldAlert size={18} />}
                title="Risk Level"
                value={capitalize(insights.riskLevel || "unknown")}
                description={insights.topRisk || "No risk analysis available."}
                type="risk"
              />

              <InsightCard
                icon={<Target size={18} />}
                title="Next Action"
                value="Priority"
                description={
                  insights.nextAction ||
                  "No next action generated."
                }
                type="action"
              />

              <InsightCard
                icon={<Lightbulb size={18} />}
                title="Positive Signal"
                value="Signal"
                description={
                  insights.positiveSignal ||
                  "No positive signal generated."
                }
                type="positive"
              />
            </div>

            {insights.summary && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <BrainCircuit
                    size={18}
                    className="text-indigo-600"
                  />

                  <h3 className="font-bold text-slate-950">
                    AI Summary
                  </h3>
                </div>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {insights.summary}
                </p>
              </div>
            )}
          </section>
        )}

        {/* REPORT */}
        {report && (
          <section className="mt-7 pb-8">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600">
                Generated Intelligence
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-950">
                Project Status Report
              </h2>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              {/* REPORT HEADER */}
              <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText
                      size={19}
                      className="text-indigo-600"
                    />

                    <h3 className="font-bold text-slate-950">
                      ProofFlow AI Status Report
                    </h3>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    Generated from current project tasks and evidence.
                  </p>
                </div>

                <OverallStatus
                  status={report.overallStatus}
                />
              </div>

              {/* SUMMARY */}
              <div className="border-b border-slate-100 p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Executive Summary
                </p>

                <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-700">
                  {report.executiveSummary ||
                    "No executive summary available."}
                </p>
              </div>

              {/* REPORT COLUMNS */}
              <div className="grid lg:grid-cols-3">
                <ReportColumn
                  title="Verified Work"
                  icon={
                    <CheckCircle2
                      size={17}
                      className="text-emerald-600"
                    />
                  }
                  items={report.verifiedWork}
                  empty="No verified work reported."
                />

                <ReportColumn
                  title="Blockers"
                  icon={
                    <AlertTriangle
                      size={17}
                      className="text-amber-600"
                    />
                  }
                  items={report.blockers}
                  empty="No blockers reported."
                  border
                />

                <ReportColumn
                  title="Next Priorities"
                  icon={
                    <Target
                      size={17}
                      className="text-indigo-600"
                    />
                  }
                  items={report.nextPriorities}
                  empty="No priorities reported."
                  border
                />
              </div>
            </div>
          </section>
        )}

        {/* INITIAL EMPTY STATE */}
        {!insights && !report && (
          <section className="mt-6 flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Sparkles size={25} />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-950">
              Your project intelligence is ready
            </h3>

            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Run an analysis or generate a report to transform your
              project activity and verified evidence into actionable
              insights.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

function ActionCard({
  icon,
  eyebrow,
  title,
  description,
  buttonText,
  loading,
  onClick,
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        {icon}
      </div>

      <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">
        {eyebrow}
      </p>

      <h3 className="mt-1 text-xl font-bold text-slate-950">
        {title}
      </h3>

      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
        {description}
      </p>

      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2
              size={16}
              className="animate-spin"
            />
            Generating...
          </>
        ) : (
          <>
            <Sparkles size={16} />
            {buttonText}
          </>
        )}
      </button>
    </article>
  );
}

function InsightCard({
  icon,
  title,
  value,
  description,
  type,
}) {
  const styles = {
    score: "bg-indigo-50 text-indigo-700",
    risk: "bg-red-50 text-red-700",
    action: "bg-amber-50 text-amber-700",
    positive: "bg-emerald-50 text-emerald-700",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          styles[type] || styles.score
        }`}
      >
        {icon}
      </div>

      <p className="mt-4 text-xs font-semibold text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-xl font-bold text-slate-950">
        {value}
      </p>

      <p className="mt-3 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </article>
  );
}

function OverallStatus({ status = "unknown" }) {
  const normalized = status.toLowerCase();

  const style =
    normalized === "on-track"
      ? "bg-emerald-50 text-emerald-700"
      : normalized === "critical"
        ? "bg-red-50 text-red-700"
        : "bg-amber-50 text-amber-700";

  return (
    <span
      className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${style}`}
    >
      {normalized.replace("-", " ")}
    </span>
  );
}

function ReportColumn({
  title,
  icon,
  items = [],
  empty,
  border = false,
}) {
  return (
    <div
      className={`p-6 ${
        border
          ? "border-t border-slate-100 lg:border-l lg:border-t-0"
          : ""
      }`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <h4 className="font-bold text-slate-900">
          {title}
        </h4>
      </div>

      {Array.isArray(items) && items.length > 0 ? (
        <div className="mt-4 space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600"
            >
              {typeof item === "string"
                ? item
                : item?.title ||
                  item?.description ||
                  JSON.stringify(item)}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-400">
          {empty}
        </p>
      )}
    </div>
  );
}

function capitalize(value) {
  return value
    ? value.charAt(0).toUpperCase() + value.slice(1)
    : "";
}