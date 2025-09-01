// server.js (or index.js)
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import Student from "./models/Student.js";
import Bus from "./models/Bus.js";
import authRoutes from "./routes/auth.js";
import connectDB from "./config/database.js";

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],  // frontend URLs
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
})); 

app.use(express.json());

app.use("/api/auth", authRoutes);

// Connect to DB
connectDB();

// API: Get all students
app.get("/api/students", async (req, res) => {
  const students = await Student.find().populate("bus");
  res.json(students);
});

// API: Get all buses
app.get("/api/buses", async (req, res) => {
  const buses = await Bus.find();
  res.json(buses);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));