// models/Student.js
import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNo: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },   
  bus: { type: mongoose.Schema.Types.ObjectId, ref: "Bus" },
});

export default mongoose.model("Student", studentSchema);