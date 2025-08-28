// Middleware to verify JWT and get student info
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import Student from "../models/Student.js";
import Admin from "../models/Admin.js";
import Driver from "../models/Driver.js";
const router = express.Router();

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, "SECRETKEY");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Get current student info for dashboard
router.get("/students/me", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "student") return res.status(403).json({ message: "Forbidden" });
    const student = await Student.findById(req.user.id).populate({
      path: "bus",
      populate: { path: "driver" }
    });
    if (!student) return res.status(404).json({ message: "Student not found" });
    const bus = student.bus || null;
    const driver = bus && bus.driver ? bus.driver : null;
    // Example alert logic (replace with real logic as needed)
    let alert = "Bus is on time";
    // You can add logic here to set alert based on bus status
    res.json({ student, bus, driver, alert });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin Login
router.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    // Generate JWT
    const token = jwt.sign({ id: admin._id, role: "admin" }, "SECRETKEY", {
      expiresIn: "1h",
    });

    res.json({ token, admin });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Driver Login
router.post("/driver/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const driver = await Driver.findOne({ email });
    if (!driver) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, driver.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    // Generate JWT
    const token = jwt.sign({ id: driver._id, role: "driver" }, "SECRETKEY", {
      expiresIn: "1h",
    });

    res.json({ token, driver });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Student Login
router.post("/student/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const student = await Student.findOne({ email });
    if (!student) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    // Generate JWT
    const token = jwt.sign({ id: student._id, role: "student" }, "SECRETKEY", {
      expiresIn: "1h",
    });

    res.json({ token, student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;