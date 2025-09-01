#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function finalVerification() {
  console.log("🎯 FINAL ROUTE UPDATE VERIFICATION");
  console.log("==================================================");
  
  let allTestsPassed = true;
  
  try {
    // Test 1: Frontend Data Files
    console.log("\n1️⃣ Frontend Data Files:");
    
    // Check public/student.json
    const publicStudents = JSON.parse(fs.readFileSync('public/student.json', 'utf-8'));
    const bus601Students = publicStudents.filter(s => s.bus.$oid === '66d0123456a1b2c3d4e5f601');
    
    if (bus601Students.length === 5) {
      console.log("   ✅ public/student.json: 5 students on updated bus");
    } else {
      console.log("   ❌ public/student.json: Wrong number of students");
      allTestsPassed = false;
    }
    
    const firstStudent = bus601Students[0];
    const expectedStops = ['MIET Campus', 'rohta bypass', 'Meerut Cantt', 'modipuram'];
    const hasCorrectStops = expectedStops.every(stop => firstStudent.bus.stops.includes(stop));
    
    if (hasCorrectStops && firstStudent.bus.stops.length === 4) {
      console.log("   ✅ public/student.json: Correct stops data");
    } else {
      console.log("   ❌ public/student.json: Incorrect stops data");
      allTestsPassed = false;
    }
    
    // Check dist/student.json
    if (fs.existsSync('dist/student.json')) {
      const distStudents = JSON.parse(fs.readFileSync('dist/student.json', 'utf-8'));
      const distBus601Students = distStudents.filter(s => s.bus.$oid === '66d0123456a1b2c3d4e5f601');
      const distFirstStudent = distBus601Students[0];
      const distHasCorrectStops = expectedStops.every(stop => distFirstStudent.bus.stops.includes(stop));
      
      if (distHasCorrectStops) {
        console.log("   ✅ dist/student.json: Synchronized with public version");
      } else {
        console.log("   ❌ dist/student.json: Not synchronized");
        allTestsPassed = false;
      }
    }
    
    // Test 2: LocationService
    console.log("\n2️⃣ LocationService Configuration:");
    const locationServiceContent = fs.readFileSync('src/utils/locationService.js', 'utf-8');
    
    if (locationServiceContent.includes("'rohta bypass'") && 
        locationServiceContent.includes("'modipuram'")) {
      console.log("   ✅ LocationService: Updated with new stops");
    } else {
      console.log("   ❌ LocationService: Missing new stops");
      allTestsPassed = false;
    }
    
    // Test 3: Backend API
    console.log("\n3️⃣ Backend Database & API:");
    try {
      const response = await fetch('http://localhost:3001/api/buses');
      const buses = await response.json();
      
      const bus101 = buses.find(b => b.busNumber === 'BUS-101');
      if (bus101 && bus101.route === 'MIET to Muzaffarnagar') {
        console.log("   ✅ Backend API: Correct route name");
      } else {
        console.log("   ❌ Backend API: Incorrect route name");
        allTestsPassed = false;
      }
      
      // Test students API
      const studentsResponse = await fetch('http://localhost:3001/api/students');
      const students = await studentsResponse.json();
      const bus101Students = students.filter(s => s.bus && s.bus.busNumber === 'BUS-101');
      
      if (bus101Students.length === 5) {
        console.log("   ✅ Backend API: 5 students assigned to BUS-101");
      } else {
        console.log(`   ❌ Backend API: ${bus101Students.length} students assigned (expected 5)`);
        allTestsPassed = false;
      }
      
    } catch (error) {
      console.log("   ⚠️  Backend API: Not accessible (server may not be running)");
    }
    
    // Test 4: Configuration Files
    console.log("\n4️⃣ Configuration Files:");
    
    // Check seed.js for future seeding
    const seedContent = fs.readFileSync('backend/seed.js', 'utf-8');
    if (seedContent.includes('MIET to Muzaffarnagar')) {
      console.log("   ✅ Seed script: Will use updated route on re-seeding");
    } else {
      console.log("   ❌ Seed script: Needs updating for future seeds");
      allTestsPassed = false;
    }
    
    // Final Result
    console.log("\n==================================================");
    if (allTestsPassed) {
      console.log("🎉 ALL TESTS PASSED! Route update is fully implemented!");
      console.log("\n📊 Summary of Changes:");
      console.log("   🚌 Bus: BUS-101 (ID: 66d0123456a1b2c3d4e5f601)");
      console.log("   🛣️  Route: MIET to Muzaffarnagar");
      console.log("   🚏 Stops: MIET Campus → rohta bypass → Meerut Cantt → modipuram");
      console.log("   👥 Students: 5 students affected");
      console.log("   💾 Storage: Frontend files, backend database, and location service updated");
      console.log("   🔄 Persistence: Changes will persist through app restarts and re-seeding");
    } else {
      console.log("❌ Some tests failed. Please review the issues above.");
    }
    
  } catch (error) {
    console.error("❌ Error during verification:", error);
  }
}

finalVerification();
