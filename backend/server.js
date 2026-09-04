require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");
const User = require("./models/User");

const app = express();

app.use(express.json());

connectDB();

app.get("/", (req, res) => {
  res.send("ProofFlow AI Backend is running");
});

app.post("/user", (req, res) => {
  res.json({
    message: "User data received",
    data: req.body,
  });
});

app.post("/signup", async (req, res) => {
  try {
    const user = await User.create(req.body);

    res.status(201).json({
      message: "User created successfully",
      user: user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Signup failed",
      error: error.message,
    });
  }
});

app.listen(5000, () => {
  console.log("ProofFlow backend running on port 5000");
});