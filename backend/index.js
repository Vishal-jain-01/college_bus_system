// server.js (or index.js)
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import Student from "./models/Student.js";
import Bus from "./models/Bus.js";
import authRoutes from "./routes/auth.js";

const app = express();

app.use(cors({
  origin: "http://localhost:5173",  // frontend URL
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
})); 

app.use(express.json());

app.use("/api/auth", authRoutes);

// Connect to DB
mongoose.connect("mongodb://localhost:27017/bus");

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

app.listen(3001, () => console.log("Server running on http://localhost:3001"));