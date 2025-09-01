// Attendance Database Utility Functions

export class AttendanceDB {
  static async saveAttendance(attendanceData) {
    try {
      // Get existing records
      const existingData = await this.getAttendanceRecords();
      
      // Create new attendance record with trip type
      const newRecord = {
        id: Date.now().toString(),
        driverId: attendanceData.driverId,
        driverName: attendanceData.driverName,
        busId: attendanceData.busId,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        time: new Date().toLocaleTimeString(),
        timestamp: new Date().toISOString(),
        tripType: attendanceData.tripType || 'home-to-campus', // 'home-to-campus' or 'campus-to-home'
        presentStudents: attendanceData.presentStudents,
        absentStudents: attendanceData.absentStudents,
        totalStudents: attendanceData.totalStudents,
        route: attendanceData.route || '',
        notes: attendanceData.notes || ''
      };

      // Check if there's already a record for this bus, date, and trip type
      const existingRecordIndex = existingData.attendanceRecords.findIndex(record => 
        record.busId === newRecord.busId && 
        record.date === newRecord.date && 
        record.tripType === newRecord.tripType
      );

      if (existingRecordIndex !== -1) {
        // Update existing record
        existingData.attendanceRecords[existingRecordIndex] = newRecord;
      } else {
        // Add new record
        existingData.attendanceRecords.unshift(newRecord);
      }
      
      existingData.lastUpdated = new Date().toISOString();

      // Save to localStorage (simulating database)
      localStorage.setItem('attendanceDB', JSON.stringify(existingData));
      
      return { success: true, recordId: newRecord.id, data: newRecord };
    } catch (error) {
      console.error('Error saving attendance:', error);
      return { success: false, error: error.message };
    }
  }

  static async getAttendanceRecords() {
    try {
      const stored = localStorage.getItem('attendanceDB');
      if (stored) {
        return JSON.parse(stored);
      }
      return { attendanceRecords: [], lastUpdated: null };
    } catch (error) {
      console.error('Error getting attendance records:', error);
      return { attendanceRecords: [], lastUpdated: null };
    }
  }

  static async getAttendanceByDate(date) {
    try {
      const data = await this.getAttendanceRecords();
      return data.attendanceRecords.filter(record => record.date === date);
    } catch (error) {
      console.error('Error getting attendance by date:', error);
      return [];
    }
  }

  static async getAttendanceByDriver(driverId) {
    try {
      const data = await this.getAttendanceRecords();
      return data.attendanceRecords.filter(record => record.driverId === driverId);
    } catch (error) {
      console.error('Error getting driver attendance:', error);
      return [];
    }
  }

  static async getAttendanceByBusAndDate(busId, date, tripType = null) {
    try {
      const data = await this.getAttendanceRecords();
      let filtered = data.attendanceRecords.filter(record => 
        record.busId === busId && record.date === date
      );
      
      if (tripType) {
        filtered = filtered.filter(record => record.tripType === tripType);
      }
      
      return filtered;
    } catch (error) {
      console.error('Error getting attendance by bus and date:', error);
      return [];
    }
  }

  static async deleteAttendanceRecord(recordId) {
    try {
      const data = await this.getAttendanceRecords();
      data.attendanceRecords = data.attendanceRecords.filter(record => record.id !== recordId);
      data.lastUpdated = new Date().toISOString();
      
      localStorage.setItem('attendanceDB', JSON.stringify(data));
      return { success: true };
    } catch (error) {
      console.error('Error deleting attendance record:', error);
      return { success: false, error: error.message };
    }
  }

  static async getAttendanceStats() {
    try {
      const data = await this.getAttendanceRecords();
      const records = data.attendanceRecords;
      
      const stats = {
        totalRecords: records.length,
        uniqueDates: [...new Set(records.map(r => r.date))].length,
        uniqueDrivers: [...new Set(records.map(r => r.driverId))].length,
        uniqueBuses: [...new Set(records.map(r => r.busId))].length,
        averageAttendance: records.length > 0 ? 
          records.reduce((acc, r) => acc + r.presentStudents.length, 0) / records.length : 0,
        lastRecordDate: records.length > 0 ? records[0].date : null
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting attendance stats:', error);
      return null;
    }
  }

  static async getStudentAttendance(rollNo) {
    try {
      const data = await this.getAttendanceRecords();
      const studentRecords = [];
      
      data.attendanceRecords.forEach(record => {
        // Check if student was present
        const isPresent = record.presentStudents.some(student => student.rollNo === rollNo);
        
        // Check if student was absent
        const isAbsent = record.absentStudents.some(student => student.rollNo === rollNo);
        
        // Only include records where this student was tracked
        if (isPresent || isAbsent) {
          studentRecords.push({
            id: record.id,
            date: record.date,
            time: record.time,
            tripType: record.tripType,
            status: isPresent ? 'present' : 'absent',
            driverName: record.driverName,
            busId: record.busId,
            route: record.route
          });
        }
      });
      
      // Sort by date descending (newest first)
      studentRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      return studentRecords;
    } catch (error) {
      console.error('Error getting student attendance:', error);
      return [];
    }
  }

  static async getStudentAttendanceByMonth(rollNo, year, month) {
    try {
      const allRecords = await this.getStudentAttendance(rollNo);
      
      // Filter by year and month
      const monthRecords = allRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getFullYear() === year && recordDate.getMonth() === month;
      });
      
      return monthRecords;
    } catch (error) {
      console.error('Error getting student attendance by month:', error);
      return [];
    }
  }
}
