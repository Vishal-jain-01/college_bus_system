import mongoose from "mongoose";
import Bus from "./models/Bus.js";

async function seedRoutes() {
  try {
    // Use MongoDB Atlas connection string with embedded credentials
    const mongoUri = "mongodb+srv://anshul:anshul123@cluster0.0g0lm.mongodb.net/college-bus?retryWrites=true&w=majority&appName=Cluster0";
    
    await mongoose.connect(mongoUri);
    console.log("🌐 Connected to MongoDB Atlas");
    console.log("🔄 Starting route data seeding...");

    // Clear existing buses to rebuild with route data
    await Bus.deleteMany();
    console.log("🗑️ Cleared existing bus data");

    // Create buses with detailed route stops
    const bus1 = await Bus.create({ 
      busNumber: "BUS-101", 
      route: "MIET to Muzaffarnagar",
      capacity: 50,
      isActive: true,
      stops: [
        { name: 'MIET Campus', lat: 28.9730, lng: 77.6410, order: 1 },
        { name: 'rohta bypass', lat: 28.9954, lng: 77.6456, order: 2 },
        { name: 'Meerut Cantt', lat: 28.9938, lng: 77.6822, order: 3 },
        { name: 'modipuram', lat: 29.0661, lng: 77.7104, order: 4 }
      ]
    });
    
    const bus2 = await Bus.create({ 
      busNumber: "BUS-102", 
      route: "MIET to Delhi",
      capacity: 45,
      isActive: true,
      stops: [
        { name: 'MIET Campus, Meerut', lat: 28.9730, lng: 77.6410, order: 1 },
        { name: 'Meerut Cantt', lat: 28.9938, lng: 77.6822, order: 2 },
        { name: 'Ghaziabad', lat: 28.6692, lng: 77.4538, order: 3 },
        { name: 'Delhi Border', lat: 28.61, lng: 77.23, order: 4 },
        { name: 'ISBT Anand Vihar', lat: 28.6477, lng: 77.3145, order: 5 },
        { name: 'Connaught Place, Delhi', lat: 28.6304, lng: 77.2177, order: 6 }
      ]
    });

    console.log(`🚌 Created buses with route data:`);
    console.log(`   ${bus1.busNumber} (${bus1._id}) - ${bus1.stops.length} stops`);
    console.log(`   ${bus2.busNumber} (${bus2._id}) - ${bus2.stops.length} stops`);
    
    console.log("✅ Route data seeded successfully!");
    
    // Print the bus IDs for reference
    console.log("\n📋 Bus IDs for reference:");
    console.log(`   ${bus1.busNumber}: ${bus1._id}`);
    console.log(`   ${bus2.busNumber}: ${bus2._id}`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding route data:", error);
    process.exit(1);
  }
}

seedRoutes();
