// routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Student from "../models/student.js";

const router = express.Router();

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