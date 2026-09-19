const express = require("express");
const router = express.Router();

const Project = require("../models/Project");
const Task = require("../models/Task");
const Evidence = require("../models/Evidence");
const authMiddleware = require("../middleware/authMiddleware");
const ai = require("../config/gemini");

const MODEL = "gemini-3.8-flash";

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function hasProjectAccess(project, userId) {
  const uid = String(userId);

  const ownerId = String(
    project.owner?._id || project.owner || ""
  );

  const isOwner = ownerId === uid;

  const isMember = (project.members || []).some((member) => {
    const memberId =
      member?.user?._id ||
      member?.user ||
      member?._id ||
      member;

    return String(memberId || "") === uid;
  });

  return isOwner || isMember;
}

function getLatestEvidence(taskEvidence = []) {
  return [...taskEvidence].sort(
    (a, b) =>
      new Date(b.createdAt || 0) -
      new Date(a.createdAt || 0)
  )[0];
}

function buildFallbackInsights(tasks, evidence) {
  const now = new Date();

  let completed = 0;
  let overdue = 0;
  let claimed = 0;
  let verified = 0;
  let unassigned = 0;

  for (const task of tasks) {
    if (task.status === "completed") completed++;

    if (task.completionClaimed) claimed++;

    if (!task.assignedTo) unassigned++;

    if (
      task.deadline &&
      task.status !== "completed" &&
      new Date(task.deadline) < now
    ) {
      overdue++;
    }

    const taskEvidence = evidence.filter(
      (item) =>
        item.task?.toString() === task._id.toString()
    );

    const latest = getLatestEvidence(taskEvidence);

    if (latest?.verificationStatus === "verified") {
      verified++;
    }
  }

  const total = tasks.length;

  const completionRate =
    total > 0 ? (completed / total) * 100 : 0;

  const verifiedRate =
    total > 0 ? (verified / total) * 100 : 0;

  let healthScore = Math.round(
    completionRate * 0.4 + verifiedRate * 0.6
  );

  healthScore -= overdue * 10;
  healthScore -= unassigned * 5;

  healthScore = Math.max(
    0,
    Math.min(100, healthScore)
  );

  let riskLevel = "low";

  if (overdue >= 2 || healthScore < 40) {
    riskLevel = "high";
  } else if (
    overdue === 1 ||
    healthScore < 70 ||
    unassigned > 0
  ) {
    riskLevel = "medium";
  }

  let topRisk = "No major project risk detected.";

  if (overdue > 0) {
    topRisk = `${overdue} overdue task${
      overdue === 1 ? "" : "s"
    } need attention.`;
  } else if (unassigned > 0) {
    topRisk = `${unassigned} task${
      unassigned === 1 ? "" : "s"
    } currently ${
      unassigned === 1 ? "has" : "have"
    } no assigned owner.`;
  } else if (claimed > verified) {
    topRisk =
      "Some completion claims are not backed by verified evidence.";
  }

  let nextAction =
    "Continue tracking work and attach evidence to completed tasks.";

  if (overdue > 0) {
    nextAction =
      "Review overdue tasks, update their status and assign clear owners.";
  } else if (unassigned > 0) {
    nextAction =
      "Assign owners to unassigned tasks before continuing execution.";
  } else if (claimed > verified) {
    nextAction =
      "Verify the evidence behind outstanding completion claims.";
  }

  const positiveSignal =
    verified > 0
      ? `${verified} task${
          verified === 1 ? " has" : "s have"
        } verified evidence recorded.`
      : "The project verification workflow is active and ready for evidence.";

  return {
    summary:
      `Project currently has ${total} tasks, ` +
      `${completed} completed, ${verified} backed by latest verified evidence, ` +
      `and ${overdue} overdue.`,

    healthScore,
    riskLevel,
    topRisk,
    nextAction,
    positiveSignal,
    source: "fallback",
  };
}

router.get("/:projectId", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(
      req.params.projectId
    );

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

   if (
  !hasProjectAccess(
    project,
    req.user.id || req.user.userId || req.user._id
  )
) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const tasks = await Task.find({
      project: project._id,
    }).populate("assignedTo", "name email");

    const taskIds = tasks.map((task) => task._id);

    const evidence = taskIds.length
      ? await Evidence.find({
          task: { $in: taskIds },
        }).sort({ createdAt: -1 })
      : [];

    const taskSummary = tasks.map((task) => {
      const taskEvidence = evidence.filter(
        (item) =>
          item.task.toString() === task._id.toString()
      );

      const latestEvidence =
        getLatestEvidence(taskEvidence);

      return {
        title: task.title,
        status: task.status,
        deadline: task.deadline,
        completionClaimed:
          task.completionClaimed || false,
        assignedTo:
          task.assignedTo?.name || "Unassigned",
        verificationStatus:
          latestEvidence?.verificationStatus ||
          "no-evidence",
        verificationScore:
          latestEvidence?.verificationScore || 0,
      };
    });

    const prompt = `
You are the project intelligence engine for ProofFlow AI.

Analyze ONLY the supplied project data.
Do not invent work, people, progress or evidence.
A completion claim is not verified work unless the latest evidence is verified.

Project:
${JSON.stringify(
  {
    name: project.name,
    status: project.status,
    tasks: taskSummary,
  },
  null,
  2
)}

Return ONLY valid JSON with exactly this structure:

{
  "summary": "short factual project summary",
  "healthScore": 0,
  "riskLevel": "low",
  "topRisk": "single most important risk",
  "nextAction": "single most useful next action",
  "positiveSignal": "single positive factual signal"
}

Rules:
- healthScore must be an integer from 0 to 100.
- riskLevel must be low, medium or high.
- Overdue or incomplete tasks should reduce health.
- Unverified claims must not be treated as verified work.
- Keep every text field concise.
`;

    let lastError = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: MODEL,
          contents: prompt,
        });

        const raw = response.text
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();

        const parsed = JSON.parse(raw);

        const healthScore = Math.max(
          0,
          Math.min(
            100,
            Math.round(
              Number(parsed.healthScore) || 0
            )
          )
        );

        const allowedRisk = [
          "low",
          "medium",
          "high",
        ];

        const riskLevel = allowedRisk.includes(
          parsed.riskLevel
        )
          ? parsed.riskLevel
          : "medium";

        return res.json({
          summary:
            parsed.summary ||
            "Project analysis generated.",
          healthScore,
          riskLevel,
          topRisk:
            parsed.topRisk ||
            "No major risk identified.",
          nextAction:
            parsed.nextAction ||
            "Continue monitoring project progress.",
          positiveSignal:
            parsed.positiveSignal ||
            "Project activity is being tracked.",
          source: "ai",
        });
      } catch (error) {
        lastError = error;

        console.log(
          `INSIGHT AI ATTEMPT ${attempt} FAILED:`,
          error.status || error.message
        );

        if (attempt < 3) {
          await sleep(attempt * 1500);
        }
      }
    }

    console.log(
      "Gemini unavailable. Using insight fallback:",
      lastError?.status || lastError?.message
    );

    return res.json(
      buildFallbackInsights(tasks, evidence)
    );
  } catch (error) {
    console.error("INSIGHT ERROR:", error);

    return res.status(500).json({
      message: "Failed to generate AI project insights",
    });
  }
});

module.exports = router;