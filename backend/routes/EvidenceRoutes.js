const express = require("express");
const { Readable } = require("stream");

const Evidence = require("../models/Evidence");
const Task = require("../models/Task");
const Project = require("../models/Project");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

// Upload file buffer to Cloudinary
function uploadToCloudinary(fileBuffer) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "proofflow/evidence",
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    Readable.from(fileBuffer).pipe(uploadStream);
  });
}

// Submit Evidence
router.post(
  "/",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
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

      let uploadedFileUrl = "";

      // Upload file to Cloudinary if user submitted one
    if (req.file) {
  console.log("File received:", req.file.originalname);

  const uploadedFile = await uploadToCloudinary(
    req.file.buffer
  );

  uploadedFileUrl = uploadedFile.secure_url;

  console.log("Cloudinary upload successful:", uploadedFileUrl);
} else {
  console.log("No file received");
}
      const evidence = await Evidence.create({
        task: req.body.taskId,
        submittedBy: req.user.userId,
        description: req.body.description,
        githubUrl: req.body.githubUrl || "",
        githubCommitSha: req.body.githubCommitSha || "",
        deployedUrl: req.body.deployedUrl || "",
        fileUrl: uploadedFileUrl,
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
  }
);

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
router.patch(
  "/:evidenceId/verify",
  authMiddleware,
  async (req, res) => {
    try {
      const { status, score } = req.body;

      if (!["verified", "rejected"].includes(status)) {
        return res.status(400).json({
          message: "Status must be verified or rejected",
        });
      }

      const evidence = await Evidence.findById(
        req.params.evidenceId
      );

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

      if (score !== undefined) {
        evidence.verificationScore = score;
      }

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
  }
);

module.exports = router;