import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Student from "./models/Student.js";
import Bus from "./models/Bus.js";
import Admin from "./models/Admin.js";
import Driver from "./models/Driver.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedData() {
  // Use MongoDB Atlas connection string (same as in index.js)
  const mongoUri = process.env.MONGODB_URI || "mongodb+srv://anshul:anshul123@cluster0.0g0lm.mongodb.net/college-bus?retryWrites=true&w=majority&appName=Cluster0";
  
  await mongoose.connect(mongoUri);

  console.log("🔄 Starting database seeding...");
  console.log("🌐 Connected to MongoDB Atlas");

  // Clear old data
  await Student.deleteMany();
  await Bus.deleteMany();
  await Admin.deleteMany();
  await Driver.deleteMany();

  console.log("🗑️  Cleared existing data");

  // Create buses with route stops
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

  console.log(`🚌 Created buses with route data: ${bus1.busNumber} (${bus1._id}) and ${bus2.busNumber} (${bus2._id})`);
  console.log(`📍 Bus 1 has ${bus1.stops.length} stops, Bus 2 has ${bus2.stops.length} stops`);


  // Read students from student.json
  const studentsPath = path.resolve(__dirname, "../student.json");
  const studentsRaw = fs.readFileSync(studentsPath, "utf-8");
  const students = JSON.parse(studentsRaw);

  console.log(`📚 Loaded ${students.length} students from student.json`);

  // Read admins from admin.json
  const adminsPath = path.resolve(__dirname, "../admin.json");
  const adminsRaw = fs.readFileSync(adminsPath, "utf-8");
  const admins = JSON.parse(adminsRaw);

  console.log(`👤 Loaded ${admins.length} admins from admin.json`);

  // Read drivers from driver.json
  const driversPath = path.resolve(__dirname, "../driver.json");
  const driversRaw = fs.readFileSync(driversPath, "utf-8");
  const drivers = JSON.parse(driversRaw);

  console.log(`🚛 Loaded ${drivers.length} drivers from driver.json`);

  // Map bus OIDs in student.json to actual bus _ids
  const busMap = {
    "66d0123456a1b2c3d4e5f601": bus1._id,
    "66d0123456a1b2c3d4e5f602": bus2._id
  };

  // Hash each student's password and assign correct bus
  const studentsToInsert = await Promise.all(students.map(async (student, index) => {
    try {
      const hashedPassword = await bcrypt.hash(student.password, 10);
      const busId = student.bus?.$oid;
      if (!busId) {
        console.warn(`⚠️  Student ${student.name} (index ${index}) has no bus.$oid, assigning to default bus`);
      }
      return {
        name: student.name,
        rollNo: student.rollNo,
        email: student.email,
        password: hashedPassword,
        bus: busMap[busId] || bus1._id
      };
    } catch (error) {
      console.error(`❌ Error processing student ${student.name} (index ${index}):`, error);
      throw error;
    }
  }));
  await Student.insertMany(studentsToInsert);
  console.log(`✅ Inserted ${studentsToInsert.length} students`);

  // Hash each admin's password
  const adminsToInsert = await Promise.all(admins.map(async (admin) => {
    const hashedPassword = await bcrypt.hash(admin.password, 10);
    return {
      name: admin.name,
      email: admin.email,
      password: hashedPassword
    };
  }));
  await Admin.insertMany(adminsToInsert);
  console.log(`✅ Inserted ${adminsToInsert.length} admins`);

  // Hash each driver's password and assign correct bus
  const driversToInsert = await Promise.all(drivers.map(async (driver, index) => {
    try {
      const hashedPassword = await bcrypt.hash(driver.password, 10);
      const busId = driver.bus?.$oid;
      if (!busId) {
        console.warn(`⚠️  Driver ${driver.name} (index ${index}) has no bus.$oid, assigning to default bus`);
      }
      return {
        name: driver.name,
        email: driver.email,
        password: hashedPassword,
        phone: driver.phone,
        bus: busMap[busId] || bus1._id
      };
    } catch (error) {
      console.error(`❌ Error processing driver ${driver.name} (index ${index}):`, error);
      throw error;
    }
  }));
  const createdDrivers = await Driver.insertMany(driversToInsert);
  console.log(`✅ Inserted ${createdDrivers.length} drivers`);

  // Update buses with driver references
  await Bus.findByIdAndUpdate(bus1._id, { driver: createdDrivers[0]._id });
  await Bus.findByIdAndUpdate(bus2._id, { driver: createdDrivers[1]._id });
  console.log(`🔗 Updated buses with driver references`);

  console.log("✅ Database seeded successfully!");
  process.exit();
}

seedData().catch(err => console.error(err));