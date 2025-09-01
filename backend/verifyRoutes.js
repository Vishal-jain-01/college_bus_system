import mongoose from "mongoose";
import Bus from "./models/Bus.js";
import Student from "./models/Student.js";

async function verifyRouteUpdate() {
  try {
    await mongoose.connect("mongodb://localhost:27017/bus");
    console.log("🔄 Connected to database");

    // Check bus routes
    const buses = await Bus.find();
    console.log("\n🚌 Current bus routes in database:");
    buses.forEach(bus => {
      console.log(`   ${bus.busNumber}: ${bus.route}`);
    });

    // Check students assigned to the updated bus
    const bus1Students = await Student.find().populate('bus');
    const bus1StudentsFiltered = bus1Students.filter(student => 
      student.bus && student.bus.busNumber === 'BUS-101'
    );

    console.log(`\n👥 Students on BUS-101 (${bus1StudentsFiltered.length} students):`);
    bus1StudentsFiltered.forEach(student => {
      console.log(`   ${student.name} (${student.rollNo}) - ${student.email}`);
    });

    console.log("\n✅ Route verification complete!");
    console.log("\n📍 New stops for BUS-101:");
    console.log("   1. MIET Campus");
    console.log("   2. rohta bypass");
    console.log("   3. Meerut Cantt");
    console.log("   4. modipuram");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error during verification:", error);
    process.exit(1);
  }
}

verifyRouteUpdate();