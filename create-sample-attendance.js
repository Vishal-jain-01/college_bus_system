// Script to create sample attendance data for testing
import fs from 'fs';

// Sample attendance data for the current month
const sampleAttendanceData = {
  attendanceRecords: [
    // August 2025 - Morning trips
    {
      id: "1725091200000",
      driverId: "driver1",
      driverName: "Rajesh Kumar",
      busId: "66d0123456a1b2c3d4e5f601",
      date: "2025-08-01",
      time: "8:30:00 AM",
      timestamp: "2025-08-01T08:30:00.000Z",
      tripType: "home-to-campus",
      presentStudents: [
        { rollNo: "2021001", name: "Amit Sharma", email: "amit@example.com" },
        { rollNo: "2021002", name: "Priya Singh", email: "priya@example.com" }
      ],
      absentStudents: [
        { rollNo: "2021003", name: "Rohit Kumar", email: "rohit@example.com" }
      ],
      totalStudents: 3,
      route: "Route A - City Center to College",
      notes: "Morning attendance"
    },
    {
      id: "1725091260000",
      driverId: "driver1", 
      driverName: "Rajesh Kumar",
      busId: "66d0123456a1b2c3d4e5f601",
      date: "2025-08-01",
      time: "5:30:00 PM",
      timestamp: "2025-08-01T17:30:00.000Z",
      tripType: "campus-to-home",
      presentStudents: [
        { rollNo: "2021001", name: "Amit Sharma", email: "amit@example.com" },
        { rollNo: "2021003", name: "Rohit Kumar", email: "rohit@example.com" }
      ],
      absentStudents: [
        { rollNo: "2021002", name: "Priya Singh", email: "priya@example.com" }
      ],
      totalStudents: 3,
      route: "Route A - City Center to College",
      notes: "Evening attendance"
    },
    // August 2025 - More days
    {
      id: "1725177600000",
      driverId: "driver1",
      driverName: "Rajesh Kumar", 
      busId: "66d0123456a1b2c3d4e5f601",
      date: "2025-08-02",
      time: "8:35:00 AM",
      timestamp: "2025-08-02T08:35:00.000Z",
      tripType: "home-to-campus",
      presentStudents: [
        { rollNo: "2021001", name: "Amit Sharma", email: "amit@example.com" },
        { rollNo: "2021002", name: "Priya Singh", email: "priya@example.com" },
        { rollNo: "2021003", name: "Rohit Kumar", email: "rohit@example.com" }
      ],
      absentStudents: [],
      totalStudents: 3,
      route: "Route A - City Center to College",
      notes: "Morning attendance"
    },
    {
      id: "1725177660000",
      driverId: "driver1",
      driverName: "Rajesh Kumar",
      busId: "66d0123456a1b2c3d4e5f601", 
      date: "2025-08-02",
      time: "5:25:00 PM",
      timestamp: "2025-08-02T17:25:00.000Z",
      tripType: "campus-to-home",
      presentStudents: [
        { rollNo: "2021001", name: "Amit Sharma", email: "amit@example.com" },
        { rollNo: "2021002", name: "Priya Singh", email: "priya@example.com" }
      ],
      absentStudents: [
        { rollNo: "2021003", name: "Rohit Kumar", email: "rohit@example.com" }
      ],
      totalStudents: 3,
      route: "Route A - City Center to College", 
      notes: "Evening attendance"
    },
    // September 2025 - Current month
    {
      id: "1725177720000",
      driverId: "driver1",
      driverName: "Rajesh Kumar",
      busId: "66d0123456a1b2c3d4e5f601",
      date: "2025-09-01",
      time: "8:30:00 AM", 
      timestamp: "2025-09-01T08:30:00.000Z",
      tripType: "home-to-campus",
      presentStudents: [
        { rollNo: "2021001", name: "Amit Sharma", email: "amit@example.com" }
      ],
      absentStudents: [
        { rollNo: "2021002", name: "Priya Singh", email: "priya@example.com" },
        { rollNo: "2021003", name: "Rohit Kumar", email: "rohit@example.com" }
      ],
      totalStudents: 3,
      route: "Route A - City Center to College",
      notes: "Morning attendance - September start"
    }
  ],
  lastUpdated: "2025-09-01T08:30:00.000Z"
};

// Save to a file that can be imported into localStorage
console.log("📊 Sample Attendance Data Created");
console.log("==================================");
console.log(`Total records: ${sampleAttendanceData.attendanceRecords.length}`);
console.log("Records for Amit Sharma (2021001):");

sampleAttendanceData.attendanceRecords.forEach(record => {
  const amitPresent = record.presentStudents.some(s => s.rollNo === "2021001");
  const amitAbsent = record.absentStudents.some(s => s.rollNo === "2021001");
  
  if (amitPresent || amitAbsent) {
    console.log(`  ${record.date} ${record.tripType}: ${amitPresent ? '✅ Present' : '❌ Absent'}`);
  }
});

// Write to file for manual import
fs.writeFileSync('sample-attendance-data.json', JSON.stringify(sampleAttendanceData, null, 2));
console.log("\n✅ Sample data saved to 'sample-attendance-data.json'");
console.log("\nTo test the attendance feature:");
console.log("1. Start the app: npm run dev");
console.log("2. Login as student: amit@example.com / password1");
console.log("3. Go to 'My Attendance' tab");
console.log("4. Check August 2025 and September 2025 records");
