const express = require("express");
const axios = require("axios");
const ai = require("../config/gemini");
const Evidence = require("../models/Evidence");
const Task = require("../models/Task");
const Project = require("../models/Project");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
const MODEL = "gemini-3.8-flash";

function responseText(response) {
  if (typeof response?.text === "string") return response.text;
  if (typeof response?.text === "function") return response.text();
  return "";
}

function parseModelResult(raw) {
  const json = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const parsed = JSON.parse(json);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid AI result shape");
  }

  const score = Number(parsed.score);
  const hasValidScore = parsed.score !== null && parsed.score !== "" && Number.isFinite(score);
  const statuses = ["verified", "rejected", "pending"];
  const confidences = ["low", "medium", "high"];

  return {
    score: hasValidScore ? Math.max(0, Math.min(100, Math.round(score))) : 0,
    status: hasValidScore && statuses.includes(parsed.status) ? parsed.status : "pending",
    confidence: confidences.includes(parsed.confidence) ? parsed.confidence : "low",
    reason: typeof parsed.reason === "string" && parsed.reason.trim()
      ? parsed.reason.trim().slice(0, 1000)
      : "Evidence could not be assessed confidently.",
  };
}

async function checkCommit(project, sha) {
  if (!sha) return null;
  if (!/^[a-f\d]{7,40}$/i.test(sha)) {
    return { valid: false, reason: "The supplied commit SHA has an invalid format." };
  }
  if (!project.githubOwner || !project.githubRepoName) return null;

  const headers = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const response = await axios.get(
      `https://api.github.com/repos/${encodeURIComponent(project.githubOwner)}/${encodeURIComponent(project.githubRepoName)}/commits/${encodeURIComponent(sha)}`,
      { headers, timeout: 8000 }
    );
    return { valid: true, sha: response.data.sha, url: response.data.html_url };
  } catch (error) {
    if (error.response?.status === 404) {
      return { valid: false, reason: "The supplied commit was not found in the connected repository." };
    }
    if (error.response?.status === 401 || error.response?.status === 403) {
      return null;
    }
    throw error;
  }
}

router.patch("/verify-evidence/:evidenceId", authMiddleware, async (req, res) => {
  let lockedEvidenceId = null;

  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.evidenceId)) {
      return res.status(400).json({ message: "Invalid evidence ID" });
    }

    const evidence = await Evidence.findById(req.params.evidenceId);
    if (!evidence) return res.status(404).json({ message: "Evidence not found" });

    const task = await Task.findById(evidence.task);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const userId = String(req.user.userId);
    const isOwner = String(project.owner) === userId;
    const isMember = project.members.some((member) => String(member.user) === userId);
    if (!isOwner && !isMember) return res.status(403).json({ message: "Access denied" });

    if (!evidence.description?.trim() && !evidence.githubUrl && !evidence.githubCommitSha && !evidence.deployedUrl && !evidence.fileUrl) {
      return res.status(400).json({ message: "Evidence is missing a description and supporting material." });
    }

    const acquired = await Evidence.findOneAndUpdate(
      { _id: evidence._id, verificationInProgress: { $ne: true } },
      { $set: { verificationInProgress: true } },
      { new: true }
    );
    if (!acquired) return res.status(409).json({ message: "Verification is already running for this evidence." });
    lockedEvidenceId = evidence._id;

    let githubSignal = null;
    try {
      githubSignal = await checkCommit(project, evidence.githubCommitSha);
    } catch {
      githubSignal = null;
    }

    const prompt = `
You are an AI work verification system. Evaluate whether the submitted evidence reasonably supports the task completion claim. Do not assume that a URL or commit proves completion by itself.

TASK:
Title: ${task.title}
Description: ${task.description || "No description"}

SUBMITTED EVIDENCE:
Description: ${evidence.description}
GitHub URL: ${evidence.githubUrl || "Not provided"}
GitHub Commit SHA: ${evidence.githubCommitSha || "Not provided"}
Deployed URL: ${evidence.deployedUrl || "Not provided"}
File URL: ${evidence.fileUrl || "Not provided"}

Return ONLY JSON: {"score":0,"confidence":"low","status":"pending","reason":"short explanation"}
Score must be 0-100; confidence low/medium/high; status verified/rejected/pending. Use pending when support is insufficient. Irrelevant evidence should be rejected.
`;

    const contents = [{ text: prompt }];
    if (evidence.fileUrl) {
      const imageResponse = await axios.get(evidence.fileUrl, {
        responseType: "arraybuffer",
        timeout: 10000,
        maxContentLength: 5 * 1024 * 1024,
        maxBodyLength: 5 * 1024 * 1024,
      });
      const mimeType = String(imageResponse.headers["content-type"] || "").split(";")[0].toLowerCase();
      if (mimeType.startsWith("image/")) {
        contents.push({
          inlineData: {
            mimeType,
            data: Buffer.from(imageResponse.data).toString("base64"),
          },
        });
      }
    }

    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: { responseMimeType: "application/json" },
    });

    let result;
    try {
      result = parseModelResult(await responseText(response));
    } catch {
      result = {
        score: 0,
        confidence: "low",
        status: "pending",
        reason: "AI returned an unreadable result; evidence remains pending review.",
      };
    }

    if (githubSignal && !githubSignal.valid) {
      result = {
        score: 0,
        confidence: "high",
        status: "rejected",
        reason: githubSignal.reason,
      };
    } else if (githubSignal?.valid && result.status === "pending") {
      result.reason = `${result.reason} The commit exists in the connected repository, but that alone does not establish task completion.`;
    }

    evidence.verificationScore = result.score;
    evidence.verificationStatus = result.status;
    evidence.verificationConfidence = result.confidence;
    evidence.verificationReason = result.reason;
    await evidence.save();

    return res.json({
      message: "AI verification completed",
      confidence: result.confidence,
      evidence,
      githubSignal: githubSignal?.valid ? { verified: true, commit: githubSignal.sha, url: githubSignal.url } : undefined,
    });
  } catch (error) {
    console.error("AI verification failed:", error.response?.status || error.name || "unknown error");
    const status = error.response?.status === 404 ? 422 : 503;
    return res.status(status).json({
      message: status === 422 ? "Evidence file could not be retrieved." : "AI verification is temporarily unavailable. Please try again.",
    });
  } finally {
    if (lockedEvidenceId) {
      await Evidence.updateOne(
        { _id: lockedEvidenceId },
        { $set: { verificationInProgress: false } }
      ).catch(() => {});
    }
  }
});

module.exports = router;