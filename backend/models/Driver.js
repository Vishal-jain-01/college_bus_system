// models/Driver.js
import mongoose from "mongoose";

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  licenseNo: { type: String, required: true, unique: true },
  phone: { type: String },
});

export default mongoose.model("Driver", driverSchema);