const express = require("express");
const axios = require("axios");
const ai = require("../config/gemini");
const Evidence = require("../models/Evidence");
const Task = require("../models/Task");
const Project = require("../models/Project");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.patch(
  "/verify-evidence/:evidenceId",
  authMiddleware,
  async (req, res) => {
    try {
      const evidence = await Evidence.findById(
        req.params.evidenceId
      );

      if (!evidence) {
        return res.status(404).json({
          message: "Evidence not found",
        });
      }

      const task = await Task.findById(evidence.task);

      if (!task) {
        return res.status(404).json({
          message: "Task not found",
        });
      }

      const project = await Project.findById(task.project);

      if (!project) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      const isOwner =
        project.owner.toString() === req.user.userId;

      const isMember = project.members.some(
        (member) =>
          member.user &&
          member.user.toString() === req.user.userId
      );

      if (!isOwner && !isMember) {
        return res.status(403).json({
          message: "Access denied",
        });
      }

      const prompt = `
You are an AI work verification system.

Evaluate whether the submitted evidence reasonably supports
the claim that the task was completed.

TASK:
Title: ${task.title}
Description: ${task.description || "No description"}

SUBMITTED EVIDENCE:
Description: ${evidence.description}
GitHub Commit SHA: ${evidence.githubCommitSha || "Not provided"}
Deployed URL: ${evidence.deployedUrl || "Not provided"}
File URL: ${evidence.fileUrl || "Not provided"}

Return ONLY valid JSON in this exact structure:

{
  "score": 0,
  "confidence": "low",
  "status": "pending",
  "reason": "short explanation"
}

Rules:
- score must be between 0 and 100.
- confidence must be low, medium, or high.
- status must be verified, rejected, or pending.
- Do not assume that a URL or commit proves completion by itself.
- If evidence is insufficient, use pending rather than inventing facts.
`;

    let contents = [{ text: prompt }];

if (evidence.fileUrl) {
  const imageResponse = await axios.get(evidence.fileUrl, {
    responseType: "arraybuffer",
  });

  const base64Image = Buffer.from(
    imageResponse.data
  ).toString("base64");

  const mimeType =
    imageResponse.headers["content-type"] || "image/png";

  contents.push({
    inlineData: {
      mimeType,
      data: base64Image,
    },
  });
}

const response = await ai.models.generateContent({
  model: "gemini-3.8-flash",
  contents,
  config: {
    responseMimeType: "application/json",
  },
});

      const result = JSON.parse(response.text);

      evidence.verificationScore = Math.max(
        0,
        Math.min(100, Number(result.score) || 0)
      );

      evidence.verificationStatus = [
        "verified",
        "rejected",
        "pending",
      ].includes(result.status)
        ? result.status
        : "pending";
        evidence.verificationConfidence =
  ["low", "medium", "high"].includes(result.confidence)
    ? result.confidence
    : "low";

      evidence.verificationReason =
        result.reason || "AI verification completed.";

      await evidence.save();

      res.json({
        message: "AI verification completed",
        confidence: result.confidence || "low",
        evidence,
      });
    } catch (error) {
        console.error("AI ERROR:", error);
      res.status(500).json({
        message: "AI verification failed",
        error: error.message,
      });
    }
  }
);

module.exports = router;