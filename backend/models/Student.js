// models/Student.js
import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNo: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },   
  bus: { type: mongoose.Schema.Types.ObjectId, ref: "Bus" },
});

const Student = mongoose.models.Student || mongoose.model("Student", studentSchema);

export default Student;