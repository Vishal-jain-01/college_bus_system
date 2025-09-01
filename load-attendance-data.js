// Script to load sample attendance data into localStorage
// Copy and paste this into browser console when testing

console.log("🔧 Loading Enhanced Sample Attendance Data into localStorage...");

const sampleAttendanceData = {
  "attendanceRecords": [
    // August 1, 2025 - Full day present
    {
      "id": "1725091200000",
      "driverId": "driver1",
      "driverName": "Rajesh Kumar",
      "busId": "66d0123456a1b2c3d4e5f601",
      "date": "2025-08-01",
      "time": "8:30:00 AM",
      "timestamp": "2025-08-01T08:30:00.000Z",
      "tripType": "home-to-campus",
      "presentStudents": [
        {
          "rollNo": "2021001",
          "name": "Amit Sharma",
          "email": "amit@example.com"
        }
      ],
      "absentStudents": [
        {
          "rollNo": "2021002",
          "name": "Priya Singh",
          "email": "priya@example.com"
        }
      ],
      "totalStudents": 2,
      "route": "Route A - City Center to College"
    },
    {
      "id": "1725091260000",
      "driverId": "driver1",
      "driverName": "Rajesh Kumar",
      "busId": "66d0123456a1b2c3d4e5f601",
      "date": "2025-08-01",
      "time": "5:30:00 PM",
      "timestamp": "2025-08-01T17:30:00.000Z",
      "tripType": "campus-to-home",
      "presentStudents": [
        {
          "rollNo": "2021001",
          "name": "Amit Sharma",
          "email": "amit@example.com"
        }
      ],
      "absentStudents": [
        {
          "rollNo": "2021002",
          "name": "Priya Singh",
          "email": "priya@example.com"
        }
      ],
      "totalStudents": 2,
      "route": "Route A - City Center to College"
    },
    // August 2, 2025 - Present in morning, absent in evening
    {
      "id": "1725177600000",
      "driverId": "driver1",
      "driverName": "Rajesh Kumar",
      "busId": "66d0123456a1b2c3d4e5f601",
      "date": "2025-08-02",
      "time": "8:35:00 AM",
      "timestamp": "2025-08-02T08:35:00.000Z",
      "tripType": "home-to-campus",
      "presentStudents": [
        {
          "rollNo": "2021001",
          "name": "Amit Sharma",
          "email": "amit@example.com"
        }
      ],
      "absentStudents": [
        {
          "rollNo": "2021002",
          "name": "Priya Singh",
          "email": "priya@example.com"
        }
      ],
      "totalStudents": 2,
      "route": "Route A - City Center to College"
    },
    {
      "id": "1725177660000",
      "driverId": "driver1",
      "driverName": "Rajesh Kumar",
      "busId": "66d0123456a1b2c3d4e5f601",
      "date": "2025-08-02",
      "time": "5:25:00 PM",
      "timestamp": "2025-08-02T17:25:00.000Z",
      "tripType": "campus-to-home",
      "presentStudents": [
        {
          "rollNo": "2021002",
          "name": "Priya Singh",
          "email": "priya@example.com"
        }
      ],
      "absentStudents": [
        {
          "rollNo": "2021001",
          "name": "Amit Sharma",
          "email": "amit@example.com"
        }
      ],
      "totalStudents": 2,
      "route": "Route A - City Center to College"
    },
    // August 3, 2025 - Absent in morning, present in evening
    {
      "id": "1725264000000",
      "driverId": "driver1",
      "driverName": "Rajesh Kumar",
      "busId": "66d0123456a1b2c3d4e5f601",
      "date": "2025-08-03",
      "time": "8:30:00 AM",
      "timestamp": "2025-08-03T08:30:00.000Z",
      "tripType": "home-to-campus",
      "presentStudents": [
        {
          "rollNo": "2021002",
          "name": "Priya Singh",
          "email": "priya@example.com"
        }
      ],
      "absentStudents": [
        {
          "rollNo": "2021001",
          "name": "Amit Sharma",
          "email": "amit@example.com"
        }
      ],
      "totalStudents": 2,
      "route": "Route A - City Center to College"
    },
    {
      "id": "1725264060000",
      "driverId": "driver1",
      "driverName": "Rajesh Kumar",
      "busId": "66d0123456a1b2c3d4e5f601",
      "date": "2025-08-03",
      "time": "5:15:00 PM",
      "timestamp": "2025-08-03T17:15:00.000Z",
      "tripType": "campus-to-home",
      "presentStudents": [
        {
          "rollNo": "2021001",
          "name": "Amit Sharma",
          "email": "amit@example.com"
        }
      ],
      "absentStudents": [
        {
          "rollNo": "2021002",
          "name": "Priya Singh",
          "email": "priya@example.com"
        }
      ],
      "totalStudents": 2,
      "route": "Route A - City Center to College"
    },
    // August 4, 2025 - Only morning record (student came to school but no evening record)
    {
      "id": "1725350400000",
      "driverId": "driver1",
      "driverName": "Rajesh Kumar",
      "busId": "66d0123456a1b2c3d4e5f601",
      "date": "2025-08-04",
      "time": "8:40:00 AM",
      "timestamp": "2025-08-04T08:40:00.000Z",
      "tripType": "home-to-campus",
      "presentStudents": [
        {
          "rollNo": "2021001",
          "name": "Amit Sharma",
          "email": "amit@example.com"
        }
      ],
      "absentStudents": [],
      "totalStudents": 1,
      "route": "Route A - City Center to College"
    },
    // August 5, 2025 - Full day absent
    {
      "id": "1725436800000",
      "driverId": "driver1",
      "driverName": "Rajesh Kumar",
      "busId": "66d0123456a1b2c3d4e5f601",
      "date": "2025-08-05",
      "time": "8:30:00 AM",
      "timestamp": "2025-08-05T08:30:00.000Z",
      "tripType": "home-to-campus",
      "presentStudents": [],
      "absentStudents": [
        {
          "rollNo": "2021001",
          "name": "Amit Sharma",
          "email": "amit@example.com"
        }
      ],
      "totalStudents": 1,
      "route": "Route A - City Center to College"
    },
    {
      "id": "1725436860000",
      "driverId": "driver1", 
      "driverName": "Rajesh Kumar",
      "busId": "66d0123456a1b2c3d4e5f601",
      "date": "2025-08-05",
      "time": "5:20:00 PM",
      "timestamp": "2025-08-05T17:20:00.000Z",
      "tripType": "campus-to-home",
      "presentStudents": [],
      "absentStudents": [
        {
          "rollNo": "2021001",
          "name": "Amit Sharma",
          "email": "amit@example.com"
        }
      ],
      "totalStudents": 1,
      "route": "Route A - City Center to College"
    },
    // September 1, 2025 - Recent record
    {
      "id": "1725523200000",
      "driverId": "driver1",
      "driverName": "Rajesh Kumar",
      "busId": "66d0123456a1b2c3d4e5f601",
      "date": "2025-09-01",
      "time": "8:30:00 AM",
      "timestamp": "2025-09-01T08:30:00.000Z",
      "tripType": "home-to-campus",
      "presentStudents": [
        {
          "rollNo": "2021001",
          "name": "Amit Sharma",
          "email": "amit@example.com"
        }
      ],
      "absentStudents": [],
      "totalStudents": 1,
      "route": "Route A - City Center to College"
    }
  ],
  "lastUpdated": "2025-09-01T08:30:00.000Z"
};

// Load into localStorage
localStorage.setItem('attendanceDB', JSON.stringify(sampleAttendanceData));

console.log("✅ Enhanced sample attendance data loaded!");
console.log("📊 Data summary for Amit Sharma (2021001):");

const amitRecords = sampleAttendanceData.attendanceRecords.filter(r => 
  r.presentStudents.some(s => s.rollNo === '2021001') || 
  r.absentStudents.some(s => s.rollNo === '2021001')
);

console.log(`  - Total records: ${amitRecords.length}`);
console.log(`  - August 2025: 8 records (5 days with varying patterns)`);
console.log(`  - September 2025: 1 record`);

console.log("\n🎯 Test Scenarios Included:");
console.log("  📅 Aug 1: ✅ Morning Present, ✅ Evening Present (Full Day)");
console.log("  📅 Aug 2: ✅ Morning Present, ❌ Evening Absent (Partial)");
console.log("  📅 Aug 3: ❌ Morning Absent, ✅ Evening Present (Partial)");
console.log("  📅 Aug 4: ✅ Morning Present, ⚪ No Evening Record (Partial)");
console.log("  📅 Aug 5: ❌ Morning Absent, ❌ Evening Absent (Full Day Absent)");
console.log("  📅 Sep 1: ✅ Morning Present, ⚪ No Evening Record (Partial)");

console.log("\n🎨 New Features to Test:");
console.log("  🌅 Morning Present count");
console.log("  🌆 Evening Present count");
console.log("  📅 Full Day Present count"); 
console.log("  ⚡ Partial Present count");
console.log("  📋 Daily view with morning/evening breakdown");
console.log("  📅 PRESENT DATES SECTION - Shows exact dates when present!");

console.log("\n📱 How to Test Present Dates:");
console.log("1. Go to 'My Attendance' tab");
console.log("2. Select August 2025 to see varied patterns");
console.log("3. Scroll to 'Dates When You Were Present' section");
console.log("4. Toggle between Grid View and List View");
console.log("5. See exactly which dates you were present!");
console.log("6. Check August: 4 present dates, September: 1 present date");
