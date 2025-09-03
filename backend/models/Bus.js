// models/Bus.js
import mongoose from "mongoose";

const stopSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  name: { type: String, required: true },
  order: { type: Number, required: true }
});

const busSchema = new mongoose.Schema({
  busNumber: { type: String, required: true, unique: true },
  route: { type: String, required: true },
  stops: [stopSchema],
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
  capacity: { type: Number, default: 40 },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.model("Bus", busSchema);