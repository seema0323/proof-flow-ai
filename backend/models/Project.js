const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    role: {
      type: String,
      enum: ["owner", "member"],
      default: "member",
    },
  },
],

    status: {
      type: String,
      enum: ["active", "completed", "on-hold"],
      default: "active",
    },

githubRepo: {
  type: String,
  default: "",
},

githubOwner: {
  type: String,
  default: "",
},

githubRepoName: {
  type: String,
  default: "",
},


  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
