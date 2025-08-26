// models/Bus.js
import mongoose from "mongoose";

const busSchema = new mongoose.Schema({
  busNumber: { type: String, required: true, unique: true },
  route: { type: String },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
});

export default mongoose.model("Bus", busSchema);