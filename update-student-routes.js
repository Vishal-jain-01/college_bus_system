#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function updateStudentRoutes() {
  console.log("🔄 Updating student routes...");
  
  // Read the current file
  const filePath = path.resolve(__dirname, 'public/student.json');
  const students = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  console.log(`📚 Found ${students.length} students`);
  
  // Update students with bus ID 66d0123456a1b2c3d4e5f601
  const updatedStudents = students.map(student => {
    if (student.bus && student.bus.$oid === '66d0123456a1b2c3d4e5f601') {
      return {
        ...student,
        bus: {
          ...student.bus,
          route: "MIET to Muzaffarnagar",
          stops: [
            "MIET Campus",
            "rohta bypass", 
            "Meerut Cantt",
            "modipuram"
          ]
        }
      };
    }
    return student;
  });
  
  // Write back to file
  fs.writeFileSync(filePath, JSON.stringify(updatedStudents, null, 2));
  
  // Also update dist file
  const distPath = path.resolve(__dirname, 'dist/student.json');
  if (fs.existsSync(distPath)) {
    fs.writeFileSync(distPath, JSON.stringify(updatedStudents, null, 2));
    console.log("✅ Updated dist/student.json");
  }
  
  console.log("✅ Updated public/student.json");
  
  // Verify the changes
  const verifyStudents = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const firstBus601Student = verifyStudents.find(s => s.bus.$oid === '66d0123456a1b2c3d4e5f601');
  
  console.log("\n🔍 Verification:");
  console.log(`Route: ${firstBus601Student.bus.route}`);
  console.log(`Stops: ${firstBus601Student.bus.stops.join(' → ')}`);
}

updateStudentRoutes();
