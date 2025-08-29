// Attendance Database Utility Functions

export class AttendanceDB {
  static async saveAttendance(attendanceData) {
    try {
      // Get existing records
      const existingData = await this.getAttendanceRecords();
      
      // Create new attendance record
      const newRecord = {
        id: Date.now().toString(),
        driverId: attendanceData.driverId,
        driverName: attendanceData.driverName,
        busId: attendanceData.busId,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        time: new Date().toLocaleTimeString(),
        timestamp: new Date().toISOString(),
        presentStudents: attendanceData.presentStudents,
        absentStudents: attendanceData.absentStudents,
        totalStudents: attendanceData.totalStudents,
        route: attendanceData.route || '',
        notes: attendanceData.notes || ''
      };

      // Add to existing records
      existingData.attendanceRecords.unshift(newRecord); // Add to beginning
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
}
