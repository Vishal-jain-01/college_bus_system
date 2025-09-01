// Excel Export Utility for Attendance Data
import * as XLSX from 'xlsx';

export class ExcelExportService {
  /**
   * Export attendance data to Excel file
   * @param {Array} attendanceRecords - Array of attendance records
   * @param {string} filename - Optional filename (default: attendance_YYYY-MM-DD.xlsx)
   */
  static exportAttendanceToExcel(attendanceRecords, filename = null) {
    try {
      if (!filename) {
        const today = new Date().toISOString().split('T')[0];
        filename = `attendance_${today}.xlsx`;
      }

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Prepare data for Excel
      const excelData = this.prepareAttendanceData(attendanceRecords);

      // Create worksheet for summary
      const summarySheet = XLSX.utils.json_to_sheet(excelData.summary);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Attendance Summary');

      // Create worksheet for detailed present students
      const presentSheet = XLSX.utils.json_to_sheet(excelData.presentStudents);
      XLSX.utils.book_append_sheet(workbook, presentSheet, 'Present Students');

      // Create worksheet for detailed absent students
      const absentSheet = XLSX.utils.json_to_sheet(excelData.absentStudents);
      XLSX.utils.book_append_sheet(workbook, absentSheet, 'Absent Students');

      // Create worksheet for all students (combined)
      const allStudentsSheet = XLSX.utils.json_to_sheet(excelData.allStudents);
      XLSX.utils.book_append_sheet(workbook, allStudentsSheet, 'All Students Details');

      // Create worksheet for daily statistics
      const statsSheet = XLSX.utils.json_to_sheet(excelData.dailyStats);
      XLSX.utils.book_append_sheet(workbook, statsSheet, 'Daily Statistics');

      // Create worksheet for student attendance summary
      const studentSummarySheet = XLSX.utils.json_to_sheet(excelData.studentAttendanceSummary);
      XLSX.utils.book_append_sheet(workbook, studentSummarySheet, 'Student Attendance Summary');

      // Write file
      XLSX.writeFile(workbook, filename);

      return { success: true, filename, recordCount: attendanceRecords.length };
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Prepare attendance data for Excel export
   * @param {Array} records - Attendance records
   * @returns {Object} Formatted data object
   */
  static prepareAttendanceData(records) {
    const summary = [];
    const presentStudents = [];
    const absentStudents = [];
    const allStudents = [];
    const dailyStats = [];
    const studentAttendanceSummary = [];

    // Keep track of all unique students
    const uniqueStudents = new Map();

    // Group records by date
    const recordsByDate = records.reduce((groups, record) => {
      if (!groups[record.date]) groups[record.date] = [];
      groups[record.date].push(record);
      return groups;
    }, {});

    Object.entries(recordsByDate).forEach(([date, dayRecords]) => {
      dayRecords.forEach(record => {
        // Summary data
        summary.push({
          'Date': record.date,
          'Day': new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' }),
          'Time': record.time,
          'Trip Type': record.tripType === 'home-to-campus' ? 'Home to Campus' : 'Campus to Home',
          'Bus ID': record.busId,
          'Bus Number': `BUS-${record.busId.slice(-3)}`,
          'Driver Name': record.driverName,
          'Driver ID': record.driverId,
          'Total Students': record.totalStudents,
          'Present Count': record.presentStudents.length,
          'Absent Count': record.absentStudents.length,
          'Attendance Rate (%)': Math.round((record.presentStudents.length / record.totalStudents) * 100),
          'Route': record.route,
          'Notes': record.notes || '',
          'Submitted At': record.timestamp
        });

        // Present students details with complete information
        record.presentStudents.forEach(student => {
          const studentDetail = {
            'Date': record.date,
            'Day': new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' }),
            'Time': record.time,
            'Trip Type': record.tripType === 'home-to-campus' ? 'Home to Campus' : 'Campus to Home',
            'Bus ID': record.busId,
            'Bus Number': `BUS-${record.busId.slice(-3)}`,
            'Student Name': student.name,
            'Roll Number': student.rollNo,
            'Email': student.email,
            'Student ID': student.studentId || student.rollNo,
            'Phone': student.phone || 'N/A',
            'Address': student.address || 'N/A',
            'Parent Contact': student.parentContact || 'N/A',
            'Emergency Contact': student.emergencyContact || 'N/A',
            'Department': student.department || 'N/A',
            'Year': student.year || 'N/A',
            'Section': student.section || 'N/A',
            'Status': 'Present',
            'Driver Name': record.driverName,
            'Driver ID': record.driverId,
            'Route': record.route,
            'Bus Route Details': student.busRoute || 'N/A',
            'Boarding Point': student.boardingPoint || (student.bus?.stops?.[0] || 'N/A'),
            'Drop Point': student.dropPoint || (student.bus?.stops?.[student.bus.stops.length - 1] || 'N/A'),
            'All Bus Stops': student.bus?.stops?.join(' → ') || 'N/A',
            'Attendance Timestamp': record.timestamp,
            'Academic Year': new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
          };
          
          presentStudents.push(studentDetail);
          allStudents.push(studentDetail);

          // Track for student summary
          const studentKey = `${student.rollNo}_${record.date}`;
          if (!uniqueStudents.has(studentKey)) {
            uniqueStudents.set(studentKey, {
              ...student,
              date: record.date,
              busId: record.busId,
              morningStatus: record.tripType === 'home-to-campus' ? 'Present' : 'N/A',
              eveningStatus: record.tripType === 'campus-to-home' ? 'Present' : 'N/A'
            });
          } else {
            const existing = uniqueStudents.get(studentKey);
            if (record.tripType === 'home-to-campus') existing.morningStatus = 'Present';
            if (record.tripType === 'campus-to-home') existing.eveningStatus = 'Present';
          }
        });

        // Absent students details with complete information
        record.absentStudents.forEach(student => {
          const studentDetail = {
            'Date': record.date,
            'Day': new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' }),
            'Time': record.time,
            'Trip Type': record.tripType === 'home-to-campus' ? 'Home to Campus' : 'Campus to Home',
            'Bus ID': record.busId,
            'Bus Number': `BUS-${record.busId.slice(-3)}`,
            'Student Name': student.name,
            'Roll Number': student.rollNo,
            'Email': student.email,
            'Student ID': student.studentId || student.rollNo,
            'Phone': student.phone || 'N/A',
            'Address': student.address || 'N/A',
            'Parent Contact': student.parentContact || 'N/A',
            'Emergency Contact': student.emergencyContact || 'N/A',
            'Department': student.department || 'N/A',
            'Year': student.year || 'N/A',
            'Section': student.section || 'N/A',
            'Status': 'Absent',
            'Driver Name': record.driverName,
            'Driver ID': record.driverId,
            'Route': record.route,
            'Bus Route Details': student.busRoute || 'N/A',
            'Boarding Point': student.boardingPoint || (student.bus?.stops?.[0] || 'N/A'),
            'Drop Point': student.dropPoint || (student.bus?.stops?.[student.bus.stops.length - 1] || 'N/A'),
            'All Bus Stops': student.bus?.stops?.join(' → ') || 'N/A',
            'Absent Reason': student.absentReason || 'Not specified',
            'Attendance Timestamp': record.timestamp,
            'Academic Year': new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
          };
          
          absentStudents.push(studentDetail);
          allStudents.push(studentDetail);

          // Track for student summary
          const studentKey = `${student.rollNo}_${record.date}`;
          if (!uniqueStudents.has(studentKey)) {
            uniqueStudents.set(studentKey, {
              ...student,
              date: record.date,
              busId: record.busId,
              morningStatus: record.tripType === 'home-to-campus' ? 'Absent' : 'N/A',
              eveningStatus: record.tripType === 'campus-to-home' ? 'Absent' : 'N/A'
            });
          } else {
            const existing = uniqueStudents.get(studentKey);
            if (record.tripType === 'home-to-campus') existing.morningStatus = 'Absent';
            if (record.tripType === 'campus-to-home') existing.eveningStatus = 'Absent';
          }
        });
      });

      // Daily statistics
      const homeToCampus = dayRecords.find(r => r.tripType === 'home-to-campus');
      const campusToHome = dayRecords.find(r => r.tripType === 'campus-to-home');

      dailyStats.push({
        'Date': date,
        'Day': new Date(date).toLocaleDateString('en-US', { weekday: 'long' }),
        'Morning Trip Present': homeToCampus ? homeToCampus.presentStudents.length : 0,
        'Morning Trip Absent': homeToCampus ? homeToCampus.absentStudents.length : 0,
        'Morning Attendance Rate (%)': homeToCampus ? Math.round((homeToCampus.presentStudents.length / homeToCampus.totalStudents) * 100) : 0,
        'Evening Trip Present': campusToHome ? campusToHome.presentStudents.length : 0,
        'Evening Trip Absent': campusToHome ? campusToHome.absentStudents.length : 0,
        'Evening Attendance Rate (%)': campusToHome ? Math.round((campusToHome.presentStudents.length / campusToHome.totalStudents) * 100) : 0,
        'Total Unique Students': this.getUniqueStudentCount(dayRecords),
        'Morning Driver': homeToCampus ? homeToCampus.driverName : 'N/A',
        'Evening Driver': campusToHome ? campusToHome.driverName : 'N/A',
        'Morning Bus': homeToCampus ? `BUS-${homeToCampus.busId.slice(-3)}` : 'N/A',
        'Evening Bus': campusToHome ? `BUS-${campusToHome.busId.slice(-3)}` : 'N/A'
      });
    });

    // Create student attendance summary
    uniqueStudents.forEach((student, key) => {
      studentAttendanceSummary.push({
        'Date': student.date,
        'Day': new Date(student.date).toLocaleDateString('en-US', { weekday: 'long' }),
        'Student Name': student.name,
        'Roll Number': student.rollNo,
        'Email': student.email,
        'Student ID': student.studentId || student.rollNo,
        'Phone': student.phone || 'N/A',
        'Department': student.department || 'N/A',
        'Year': student.year || 'N/A',
        'Section': student.section || 'N/A',
        'Bus Number': `BUS-${student.busId.slice(-3)}`,
        'Bus Route': student.bus?.route || 'N/A',
        'Boarding Point': student.boardingPoint || (student.bus?.stops?.[0] || 'N/A'),
        'Drop Point': student.dropPoint || (student.bus?.stops?.[student.bus.stops?.length - 1] || 'N/A'),
        'Morning Trip Status': student.morningStatus,
        'Evening Trip Status': student.eveningStatus,
        'Overall Status': (student.morningStatus === 'Present' || student.eveningStatus === 'Present') ? 'Present' : 'Absent',
        'Attendance Count': (student.morningStatus === 'Present' ? 1 : 0) + (student.eveningStatus === 'Present' ? 1 : 0),
        'Total Trips Available': (student.morningStatus !== 'N/A' ? 1 : 0) + (student.eveningStatus !== 'N/A' ? 1 : 0),
        'Attendance Percentage': Math.round(((student.morningStatus === 'Present' ? 1 : 0) + (student.eveningStatus === 'Present' ? 1 : 0)) / ((student.morningStatus !== 'N/A' ? 1 : 0) + (student.eveningStatus !== 'N/A' ? 1 : 0)) * 100) || 0,
        'Parent Contact': student.parentContact || 'N/A',
        'Emergency Contact': student.emergencyContact || 'N/A',
        'Academic Year': new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
      });
    });

    return {
      summary,
      presentStudents,
      absentStudents,
      allStudents,
      dailyStats,
      studentAttendanceSummary
    };
  }

  /**
   * Get unique student count across all trips for a day
   * @param {Array} dayRecords - Records for a specific day
   * @returns {number} Unique student count
   */
  static getUniqueStudentCount(dayRecords) {
    const allStudents = new Set();
    dayRecords.forEach(record => {
      record.presentStudents.forEach(s => allStudents.add(s.rollNo));
      record.absentStudents.forEach(s => allStudents.add(s.rollNo));
    });
    return allStudents.size;
  }

  /**
   * Export today's attendance to Excel
   * @returns {Object} Export result
   */
  static async exportTodayAttendance() {
    try {
      // Import here to avoid circular dependency
      const { AttendanceDB } = await import('./attendanceDB.js');
      
      const today = new Date().toISOString().split('T')[0];
      const todayRecords = await AttendanceDB.getAttendanceByDate(today);
      
      if (todayRecords.length === 0) {
        return { success: false, error: 'No attendance records found for today' };
      }

      const filename = `attendance_${today}.xlsx`;
      return ExcelExportService.exportAttendanceToExcel(todayRecords, filename);
    } catch (error) {
      console.error('Error exporting today attendance:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Export attendance for a specific date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Object} Export result
   */
  static async exportDateRangeAttendance(startDate, endDate) {
    try {
      const { AttendanceDB } = await import('./attendanceDB.js');
      
      const allRecords = await AttendanceDB.getAttendanceRecords();
      const filteredRecords = allRecords.attendanceRecords.filter(record => {
        return record.date >= startDate && record.date <= endDate;
      });
      
      if (filteredRecords.length === 0) {
        return { success: false, error: `No attendance records found between ${startDate} and ${endDate}` };
      }

      const filename = `attendance_${startDate}_to_${endDate}.xlsx`;
      return ExcelExportService.exportAttendanceToExcel(filteredRecords, filename);
    } catch (error) {
      console.error('Error exporting date range attendance:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Export all attendance records to Excel
   * @returns {Object} Export result
   */
  static async exportAllAttendance() {
    try {
      const { AttendanceDB } = await import('./attendanceDB.js');
      
      const allData = await AttendanceDB.getAttendanceRecords();
      const records = allData.attendanceRecords;
      
      if (records.length === 0) {
        return { success: false, error: 'No attendance records found' };
      }

      const filename = `all_attendance_records_${new Date().toISOString().split('T')[0]}.xlsx`;
      return ExcelExportService.exportAttendanceToExcel(records, filename);
    } catch (error) {
      console.error('Error exporting all attendance:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Auto-save attendance to Excel when driver submits
   * @param {Object} attendanceRecord - Single attendance record
   * @returns {Object} Save result
   */
  static async autoSaveAttendance(attendanceRecord) {
    try {
      const date = attendanceRecord.date;
      const tripType = attendanceRecord.tripType;
      const busId = attendanceRecord.busId;
      
      // Create filename with bus and trip info
      const filename = `bus_${busId.slice(-3)}_${tripType}_${date}.xlsx`;
      
      // Prepare single record for export
      const singleRecordData = ExcelExportService.prepareAttendanceData([attendanceRecord]);
      
      // Create workbook with single record
      const workbook = XLSX.utils.book_new();
      
      // Create summary sheet
      const summarySheet = XLSX.utils.json_to_sheet(singleRecordData.summary);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Attendance Summary');
      
      // Create present students sheet with complete details
      const presentSheet = XLSX.utils.json_to_sheet(singleRecordData.presentStudents);
      XLSX.utils.book_append_sheet(workbook, presentSheet, 'Present Students');
      
      // Create absent students sheet with complete details
      const absentSheet = XLSX.utils.json_to_sheet(singleRecordData.absentStudents);
      XLSX.utils.book_append_sheet(workbook, absentSheet, 'Absent Students');
      
      // Create all students sheet
      const allStudentsSheet = XLSX.utils.json_to_sheet(singleRecordData.allStudents);
      XLSX.utils.book_append_sheet(workbook, allStudentsSheet, 'All Students Details');
      
      // Create student summary sheet
      const studentSummarySheet = XLSX.utils.json_to_sheet(singleRecordData.studentAttendanceSummary);
      XLSX.utils.book_append_sheet(workbook, studentSummarySheet, 'Student Summary');
      
      // Write file
      XLSX.writeFile(workbook, filename);
      
      return { success: true, filename, record: attendanceRecord };
    } catch (error) {
      console.error('Error auto-saving attendance:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export utility functions for easier imports
export const exportTodayAttendance = ExcelExportService.exportTodayAttendance;
export const exportAllAttendance = ExcelExportService.exportAllAttendance;
export const exportDateRangeAttendance = ExcelExportService.exportDateRangeAttendance;
export const autoSaveAttendance = ExcelExportService.autoSaveAttendance;