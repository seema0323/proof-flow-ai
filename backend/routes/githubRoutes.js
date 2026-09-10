const express = require("express");
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
module.exports = router;