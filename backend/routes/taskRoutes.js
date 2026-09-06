const express = require("express");
const Task = require("../models/Task");
const Project = require("../models/Project");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.body.projectId,
      owner: req.user.userId,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or access denied",
      });
    }

    const task = await Task.create({
      title: req.body.title,
      description: req.body.description,
      project: req.body.projectId,
      assignedTo: req.body.assignedTo || null,
      deadline: req.body.deadline,
    });

    res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create task",
      error: error.message,
    });
  }
});
router.get("/:projectId", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.projectId,
      owner: req.user.userId,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or access denied",
      });
    }

    const tasks = await Task.find({
      project: req.params.projectId,
    });

    res.json({
      message: "Tasks fetched successfully",
      tasks,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch tasks",
      error: error.message,
    });
  }
});
router.patch("/:taskId/status", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    const project = await Project.findOne({
      _id: task.project,
      owner: req.user.userId,
    });

    if (!project) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    task.status = req.body.status;
    await task.save();

    res.json({
      message: "Task status updated successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update task status",
      error: error.message,
    });
  }
});
module.exports = router;