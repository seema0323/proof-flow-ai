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

function buildFallbackReport(tasks, evidence) {
  const now = new Date();

  const verifiedWork = [];
  const blockers = [];
  const nextPriorities = [];

  let overdue = 0;
  let verified = 0;
  let unassigned = 0;

  for (const task of tasks) {
    const taskEvidence = evidence.filter(
      (item) =>
        item.task?.toString() === task._id.toString()
    );

    const latest = getLatestEvidence(taskEvidence);

    if (latest?.verificationStatus === "verified") {
      verified++;

      verifiedWork.push(
        `${task.title} — verified with ${latest.verificationScore || 0}% evidence score.`
      );
    }

    if (!task.assignedTo) {
      unassigned++;

      blockers.push(
        `${task.title} currently has no assigned owner.`
      );
    }

    if (
      task.deadline &&
      task.status !== "completed" &&
      new Date(task.deadline) < now
    ) {
      overdue++;

      blockers.push(
        `${task.title} is overdue and still ${task.status}.`
      );
    }

    if (
      task.completionClaimed &&
      latest?.verificationStatus !== "verified"
    ) {
      blockers.push(
        `${task.title} has a completion claim without latest verified evidence.`
      );
    }
  }

  if (overdue > 0) {
    nextPriorities.push(
      "Review overdue tasks and update their owners, deadlines or status."
    );
  }

  if (unassigned > 0) {
    nextPriorities.push(
      "Assign clear owners to all unassigned work."
    );
  }

  if (verified < tasks.length) {
    nextPriorities.push(
      "Collect and verify evidence for remaining project work."
    );
  }

  if (nextPriorities.length === 0) {
    nextPriorities.push(
      "Continue monitoring verified progress and upcoming deadlines."
    );
  }

  let overallStatus = "on-track";

  if (overdue >= 2) {
    overallStatus = "critical";
  } else if (
    overdue === 1 ||
    unassigned > 0 ||
    blockers.length > 0
  ) {
    overallStatus = "at-risk";
  }

  return {
    executiveSummary:
      `The project contains ${tasks.length} tasks. ` +
      `${verified} currently have latest verified evidence, ` +
      `${overdue} are overdue and ${unassigned} are unassigned.`,

    verifiedWork: verifiedWork.slice(0, 3),
    blockers: blockers.slice(0, 3),
    nextPriorities: nextPriorities.slice(0, 3),
    overallStatus,
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

      const latest = getLatestEvidence(taskEvidence);

      return {
        title: task.title,
        status: task.status,
        assignedTo:
          task.assignedTo?.name || "Unassigned",
        deadline: task.deadline,
        completionClaimed:
          task.completionClaimed || false,
        verificationStatus:
          latest?.verificationStatus || "no-evidence",
        verificationScore:
          latest?.verificationScore || 0,
      };
    });

    const prompt = `
You are generating a concise ProofFlow AI project status report.

Use ONLY the supplied project data.
Do not invent completed work, blockers, evidence or people.
A task is verified only when its latest evidence status is "verified".

Project data:
${JSON.stringify(
  {
    name: project.name,
    status: project.status,
    tasks: taskSummary,
  },
  null,
  2
)}

Return ONLY valid JSON:

{
  "executiveSummary": "short factual summary",
  "verifiedWork": ["item"],
  "blockers": ["item"],
  "nextPriorities": ["item"],
  "overallStatus": "on-track"
}

Rules:
- overallStatus must be on-track, at-risk or critical.
- Maximum 3 items in each array.
- Do not count an unverified completion claim as verified work.
- Overdue and unassigned work should affect status.
- Keep output concise and factual.
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

        const allowedStatuses = [
          "on-track",
          "at-risk",
          "critical",
        ];

        const overallStatus = allowedStatuses.includes(
          parsed.overallStatus
        )
          ? parsed.overallStatus
          : "at-risk";

        return res.json({
          executiveSummary:
            parsed.executiveSummary ||
            "Project status report generated.",

          verifiedWork: Array.isArray(parsed.verifiedWork)
            ? parsed.verifiedWork.slice(0, 3)
            : [],

          blockers: Array.isArray(parsed.blockers)
            ? parsed.blockers.slice(0, 3)
            : [],

          nextPriorities: Array.isArray(
            parsed.nextPriorities
          )
            ? parsed.nextPriorities.slice(0, 3)
            : [],

          overallStatus,
          source: "ai",
        });
      } catch (error) {
        lastError = error;

        console.log(
          `REPORT AI ATTEMPT ${attempt} FAILED:`,
          error.status || error.message
        );

        if (attempt < 3) {
          await sleep(attempt * 1500);
        }
      }
    }

    console.log(
      "Gemini unavailable. Using report fallback:",
      lastError?.status || lastError?.message
    );

    return res.json(
      buildFallbackReport(tasks, evidence)
    );
  } catch (error) {
    console.error("REPORT ERROR:", error);

    return res.status(500).json({
      message: "Failed to generate AI project report",
    });
  }
});

module.exports = router;