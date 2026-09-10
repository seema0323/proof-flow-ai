const express = require("express");
const Evidence = require("../models/Evidence");
const axios = require("axios");
const Project = require("../models/Project");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get GitHub Commits
router.get("/:projectId/commits", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.projectId,
      $or: [
        { owner: req.user.userId },
        { "members.user": req.user.userId },
      ],
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or access denied",
      });
    }

    if (!project.githubOwner || !project.githubRepoName) {
      return res.status(400).json({
        message: "GitHub repository is not connected",
      });
    }

    const response = await axios.get(
      `https://api.github.com/repos/${project.githubOwner}/${project.githubRepoName}/commits`,
      {
        params: {
          per_page: 20,
        },
        headers: {
          Accept: "application/vnd.github+json",
        },
      }
    );

    const commits = response.data.map((item) => ({
      sha: item.sha,
      message: item.commit.message,
      author: item.commit.author?.name || "Unknown",
      date: item.commit.author?.date,
      url: item.html_url,
    }));

    res.json({
      message: "GitHub commits fetched successfully",
      total: commits.length,
      commits,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch GitHub commits",
      error: error.response?.data?.message || error.message,
    });
  }
});
// Get GitHub Contributors
router.get("/:projectId/contributors", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.projectId,
      $or: [
        { owner: req.user.userId },
        { "members.user": req.user.userId },
      ],
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or access denied",
      });
    }

    if (!project.githubOwner || !project.githubRepoName) {
      return res.status(400).json({
        message: "GitHub repository is not connected",
      });
    }

    const response = await axios.get(
      `https://api.github.com/repos/${project.githubOwner}/${project.githubRepoName}/contributors`,
      {
        params: {
          per_page: 100,
        },
        headers: {
          Accept: "application/vnd.github+json",
        },
      }
    );

    const contributors = response.data.map((user) => ({
      username: user.login,
      avatar: user.avatar_url,
      profile: user.html_url,
      contributions: user.contributions,
    }));

    res.json({
      message: "GitHub contributors fetched successfully",
      totalContributors: contributors.length,
      contributors,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch GitHub contributors",
      error: error.response?.data?.message || error.message,
    });
  }
});
// Verify GitHub Commit
router.get("/:projectId/verify-commit/:sha", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.projectId,
      $or: [
        { owner: req.user.userId },
        { "members.user": req.user.userId },
      ],
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or access denied",
      });
    }

    if (!project.githubOwner || !project.githubRepoName) {
      return res.status(400).json({
        message: "GitHub repository is not connected",
      });
    }

    const response = await axios.get(
      `https://api.github.com/repos/${project.githubOwner}/${project.githubRepoName}/commits/${req.params.sha}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
        },
      }
    );

    res.json({
      message: "Commit verified successfully",
      verified: true,
      commit: {
        sha: response.data.sha,
        message: response.data.commit.message,
        author: response.data.commit.author?.name || "Unknown",
        date: response.data.commit.author?.date,
        url: response.data.html_url,
      },
    });
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({
        message: "Commit not found in connected repository",
        verified: false,
      });
    }

    res.status(500).json({
      message: "Failed to verify GitHub commit",
      error: error.response?.data?.message || error.message,
    });
  }
});
// Auto verify evidence using GitHub commit
router.patch("/evidence/:evidenceId/auto-verify", authMiddleware, async (req, res) => {
  try {
    const evidence = await Evidence.findById(req.params.evidenceId);

    if (!evidence) {
      return res.status(404).json({
        message: "Evidence not found",
      });
    }

    if (!evidence.githubCommitSha) {
      return res.status(400).json({
        message: "No GitHub commit SHA found in evidence",
      });
    }

    const task = await require("../models/Task").findById(evidence.task);

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

    const isOwner = project.owner.toString() === req.user.userId;

    if (!isOwner) {
      return res.status(403).json({
        message: "Only project owner can verify evidence",
      });
    }

    await axios.get(
      `https://api.github.com/repos/${project.githubOwner}/${project.githubRepoName}/commits/${evidence.githubCommitSha}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
        },
      }
    );

    evidence.verificationStatus = "verified";
    evidence.verificationScore = 100;
    evidence.verificationReason =
      "Commit exists in the connected GitHub repository";

    await evidence.save();

    res.json({
      message: "Evidence automatically verified",
      evidence,
    });
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({
        message: "GitHub commit not found",
        verified: false,
      });
    }

    res.status(500).json({
      message: "Automatic verification failed",
      error: error.message,
    });
  }
});
module.exports = router;