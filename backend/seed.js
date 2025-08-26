import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Student from "./models/student.js";
import Bus from "./models/bus.js";

async function seedData() {
  await mongoose.connect("mongodb://localhost:27017/busTracking");

  // Clear old data
  await Student.deleteMany();
  await Bus.deleteMany();

  // Create 2 buses
  const bus1 = await Bus.create({ busNumber: "BUS-101", route: "Meerut → Campus" });
  const bus2 = await Bus.create({ busNumber: "BUS-102", route: "Modinagar → Campus" });

  // Hash password once
  const hashedPassword = await bcrypt.hash("student123", 10);

  // Insert 10 students with same password
  await Student.insertMany([
    { name: "Amit Sharma", rollNo: "S101", email: "amit@example.com", password: hashedPassword, bus: bus1._id },
    { name: "Priya Singh", rollNo: "S102", email: "priya@example.com", password: hashedPassword, bus: bus1._id },
    { name: "Ravi Kumar", rollNo: "S103", email: "ravi@example.com", password: hashedPassword, bus: bus1._id },
    { name: "Neha Verma", rollNo: "S104", email: "neha@example.com", password: hashedPassword, bus: bus1._id },
    { name: "Arjun Patel", rollNo: "S105", email: "arjun@example.com", password: hashedPassword, bus: bus1._id },
    { name: "Simran Kaur", rollNo: "S106", email: "simran@example.com", password: hashedPassword, bus: bus2._id },
    { name: "Rahul Yadav", rollNo: "S107", email: "rahul@example.com", password: hashedPassword, bus: bus2._id },
    { name: "Anjali Gupta", rollNo: "S108", email: "anjali@example.com", password: hashedPassword, bus: bus2._id },
    { name: "Manish Rawat", rollNo: "S109", email: "manish@example.com", password: hashedPassword, bus: bus2._id },
    { name: "Pooja Mishra", rollNo: "S110", email: "pooja@example.com", password: hashedPassword, bus: bus2._id }
  ]);

  console.log("✅ Database seeded successfully!");
  process.exit();
}

seedData().catch(err => console.error(err));