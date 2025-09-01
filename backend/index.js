// server.js (or index.js)
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

import Student from "./models/Student.js";
import Bus from "./models/Bus.js";
import authRoutes from "./routes/auth.js";

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173", 
    "http://localhost:5174",
    "https://bus-tracking-system-bice.vercel.app",
    process.env.FRONTEND_URL
  ].filter(Boolean),  // Remove undefined values
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
})); 

app.use(express.json());

app.use("/api/auth", authRoutes);

// Connect to DB
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/bus';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

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