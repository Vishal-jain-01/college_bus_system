// models/Driver.js
import mongoose from "mongoose";

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  bus: { type: mongoose.Schema.Types.ObjectId, ref: "Bus" }
  // licenseNo: { type: String, required: true, unique: true },
});

export default mongoose.model("Driver", driverSchema);