const express = require("express");
const Evidence = require("../models/Evidence");
const Task = require("../models/Task");
const Project = require("../models/Project");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Submit Evidence
router.post("/", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.body.taskId);

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

    const evidence = await Evidence.create({
      task: req.body.taskId,
      submittedBy: req.user.userId,
      description: req.body.description,
      githubUrl: req.body.githubUrl || "",
      deployedUrl: req.body.deployedUrl || "",
      fileUrl: req.body.fileUrl || "",
    });

    res.status(201).json({
      message: "Evidence submitted successfully",
      evidence,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to submit evidence",
      error: error.message,
    });
  }
});

// Get Evidence of a Task
router.get("/:taskId", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

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

    const evidence = await Evidence.find({
      task: req.params.taskId,
    }).populate("submittedBy", "name email");

    res.json({
      message: "Evidence fetched successfully",
      evidence,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch evidence",
      error: error.message,
    });
  }
});

// Verify or Reject Evidence
router.patch("/:evidenceId/verify", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be verified or rejected",
      });
    }

    const evidence = await Evidence.findById(req.params.evidenceId);

    if (!evidence) {
      return res.status(404).json({
        message: "Evidence not found",
      });
    }

    const task = await Task.findById(evidence.task);
    const project = await Project.findById(task.project);

    if (project.owner.toString() !== req.user.userId) {
      return res.status(403).json({
        message: "Only project owner can verify evidence",
      });
    }

    evidence.verificationStatus = status;
    await evidence.save();

    res.json({
      message: `Evidence ${status} successfully`,
      evidence,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to verify evidence",
      error: error.message,
    });
  }
});

module.exports = router;