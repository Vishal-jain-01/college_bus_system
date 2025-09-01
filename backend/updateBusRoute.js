import mongoose from "mongoose";
import Bus from "./models/Bus.js";

async function updateBusRoute() {
  try {
    await mongoose.connect("mongodb://localhost:27017/bus");
    console.log("🔄 Connected to database");

    // Update bus route for bus ID 66d0123456a1b2c3d4e5f601
    const busId = "66d0123456a1b2c3d4e5f601";
    const newRoute = "MIET to Muzaffarnagar";
    const newStops = [
      "MIET Campus",
      "rohta bypass", 
      "Meerut Cantt",
      "modipuram"
    ];

    // First, let's find the bus by number since we're using ObjectId in the database
    const bus = await Bus.findOne({ busNumber: "BUS-101" });
    
    if (!bus) {
      console.log("❌ Bus BUS-101 not found");
      process.exit(1);
    }

    console.log(`📍 Found bus: ${bus.busNumber} with ID: ${bus._id}`);
    console.log(`📍 Current route: ${bus.route}`);

    // Update the route description
    await Bus.findByIdAndUpdate(bus._id, {
      route: newRoute
    });

    console.log(`✅ Updated bus route to: ${newRoute}`);
    console.log(`✅ New stops: ${newStops.join(" → ")}`);

    // Note: The stops are stored in the frontend student.json file
    // and in the location service for real-time tracking

    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating bus route:", error);
    process.exit(1);
  }
}

updateBusRoute();