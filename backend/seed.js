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


  // Clear old data
  await Student.deleteMany();
  await Bus.deleteMany();
  await Admin.deleteMany();
  await Driver.deleteMany();

  // Create 2 buses
  const bus1 = await Bus.create({ busNumber: "BUS-101", route: "Meerut → Campus" });
  const bus2 = await Bus.create({ busNumber: "BUS-102", route: "Modinagar → Campus" });


  // Read students from student.json
  const studentsPath = path.resolve(__dirname, "../student.json");
  const studentsRaw = fs.readFileSync(studentsPath, "utf-8");
  const students = JSON.parse(studentsRaw);

  // Read admins from admin.json
  const adminsPath = path.resolve(__dirname, "../../admin.json");
  const adminsRaw = fs.readFileSync(adminsPath, "utf-8");
  const admins = JSON.parse(adminsRaw);

  // Read drivers from driver.json
  const driversPath = path.resolve(__dirname, "../../driver.json");
  const driversRaw = fs.readFileSync(driversPath, "utf-8");
  const drivers = JSON.parse(driversRaw);

  // Map bus OIDs in student.json to actual bus _ids
  const busMap = {
    "66d0123456a1b2c3d4e5f601": bus1._id,
    "66d0123456a1b2c3d4e5f602": bus2._id
  };

  // Hash each student's password and assign correct bus
  const studentsToInsert = await Promise.all(students.map(async (student) => {
    const hashedPassword = await bcrypt.hash(student.password, 10);
    return {
      name: student.name,
      rollNo: student.rollNo,
      email: student.email,
      password: hashedPassword,
      bus: busMap[student.bus.$oid] || bus1._id
    };
  }));
  await Student.insertMany(studentsToInsert);

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

  // Hash each driver's password and assign correct bus
  const driversToInsert = await Promise.all(drivers.map(async (driver) => {
    const hashedPassword = await bcrypt.hash(driver.password, 10);
    return {
      name: driver.name,
      email: driver.email,
      password: hashedPassword,
      phone: driver.phone,
      bus: busMap[driver.bus.$oid] || bus1._id
    };
  }));
  await Driver.insertMany(driversToInsert);

  console.log("✅ Database seeded successfully!");
  process.exit();
}

seedData().catch(err => console.error(err));