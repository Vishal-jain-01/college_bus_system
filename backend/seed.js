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
  await mongoose.connect("mongodb://localhost:27017/bus");

  console.log("🔄 Starting database seeding...");

  // Clear old data
  await Student.deleteMany();
  await Bus.deleteMany();
  await Admin.deleteMany();
  await Driver.deleteMany();

  console.log("🗑️  Cleared existing data");

  // Create 2 buses
  const bus1 = await Bus.create({ busNumber: "BUS-101", route: "MIET to Muzaffarnagar" });
  const bus2 = await Bus.create({ busNumber: "BUS-102", route: "MIET to Delhi" });

  console.log(`🚌 Created buses: ${bus1.busNumber} (${bus1._id}) and ${bus2.busNumber} (${bus2._id})`);


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
  await Driver.insertMany(driversToInsert);
  console.log(`✅ Inserted ${driversToInsert.length} drivers`);

  console.log("✅ Database seeded successfully!");
  process.exit();
}

seedData().catch(err => console.error(err));