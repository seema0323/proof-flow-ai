const express = require("express");
const Project = require("../models/Project");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Create Project
router.post("/", authMiddleware, async (req, res) => {
  try {
    const project = await Project.create({
      name: req.body.name,
      description: req.body.description,
      owner: req.user.userId,
    });

    res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create project",
      error: error.message,
    });
  }
});

// Get Projects where user is owner OR member
router.get("/", authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user.userId },
        { "members.user": req.user.userId },
      ],
    })
      .populate("owner", "name email")
      .populate("members.user", "name email");

    res.json({
      message: "Projects fetched successfully",
      projects,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch projects",
      error: error.message,
    });
  }
});

// Get Project Members
router.get("/:projectId/members", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.projectId,
      $or: [
        { owner: req.user.userId },
        { "members.user": req.user.userId },
      ],
    })
      .populate("owner", "name email")
      .populate("members.user", "name email");

    if (!project) {
      return res.status(404).json({
        message: "Project not found or access denied",
      });
    }

    const validMembers = project.members.filter(
      (member) => member.user
    );

    res.json({
      message: "Members fetched successfully",
      owner: project.owner,
      members: validMembers,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch members",
      error: error.message,
    });
  }
});

// Add Member to Project
router.post("/:projectId/members", authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const userExists = await User.findById(userId);

    if (!userExists) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const project = await Project.findOne({
      _id: req.params.projectId,
      owner: req.user.userId,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or access denied",
      });
    }

    if (project.owner.toString() === userId) {
      return res.status(400).json({
        message: "User is already the project owner",
      });
    }

    const alreadyMember = project.members.some(
      (member) =>
        member.user &&
        member.user.toString() === userId
    );

    if (alreadyMember) {
      return res.status(400).json({
        message: "User is already a member of this project",
      });
    }

    project.members.push({
      user: userId,
      role: role || "member",
    });

    await project.save();

    res.json({
      message: "Member added successfully",
      project,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to add member",
      error: error.message,
    });
  }
});
// Get Project Health / Progress
router.get("/:projectId/health", authMiddleware, async (req, res) => {
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

    const Task = require("../models/Task");
    const Evidence = require("../models/Evidence");

    const tasks = await Task.find({ project: req.params.projectId });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (task) => task.status === "completed"
    ).length;

    const inProgressTasks = tasks.filter(
      (task) => task.status === "in-progress"
    ).length;

    const claimedTasks = tasks.filter(
      (task) => task.completionClaimed === true
    ).length;

    const taskIds = tasks.map((task) => task._id);

    const verifiedEvidence = await Evidence.countDocuments({
      task: { $in: taskIds },
      verificationStatus: "verified",
    });

    const progress =
      totalTasks === 0
        ? 0
        : Math.round((completedTasks / totalTasks) * 100);

    res.json({
      message: "Project health fetched successfully",
      health: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        claimedTasks,
        verifiedEvidence,
        progress,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch project health",
      error: error.message,
    });
  }
});

module.exports = router;