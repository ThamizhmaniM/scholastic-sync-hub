
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay } from "date-fns";
import { AttendanceRecord, Student } from "@/types";

interface StudentAttendanceGridProps {
  attendanceRecords: AttendanceRecord[];
  students: Student[];
}

// Helper function to format date for IST without timezone issues
const formatDateForIST = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const StudentAttendanceGrid = ({ attendanceRecords, students }: StudentAttendanceGridProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");

  console.log('StudentAttendanceGrid - Attendance Records:', attendanceRecords);
  console.log('StudentAttendanceGrid - Students:', students);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Filter students by search query
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get attendance status for a specific student and date
  const getAttendanceStatus = (studentId: string, date: Date) => {
    const dateStr = formatDateForIST(date);
    console.log(`Looking for attendance - Student: ${studentId}, Date: ${dateStr}`);
    
    // Handle both studentId and student_id field names from database
    const record = attendanceRecords.find(
      record => {
        const recordStudentId = record.studentId || record.student_id;
        const isMatch = recordStudentId === studentId && record.date === dateStr;
        if (isMatch) {
          console.log(`Found matching record:`, record);
        }
        return isMatch;
      }
    );
    
    console.log(`Attendance status for ${studentId} on ${dateStr}:`, record?.status || 'not found');
    return record?.status || null;
  };

  // Calculate monthly stats for a student
  const getStudentMonthlyStats = (studentId: string) => {
    const studentRecords = attendanceRecords.filter(
      record => {
        const recordStudentId = record.studentId || record.student_id;
        return recordStudentId === studentId &&
        record.date >= formatDateForIST(monthStart) &&
        record.date <= formatDateForIST(monthEnd);
      }
    );
    
    const presentDays = studentRecords.filter(record => record.status === 'present').length;
    const absentDays = studentRecords.filter(record => record.status === 'absent').length;
    const totalMarked = studentRecords.length;
    const percentage = totalMarked > 0 ? Math.round((presentDays / totalMarked) * 100) : 0;
    
    return { presentDays, absentDays, totalMarked, percentage };
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Individual Student Attendance</CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold min-w-[200px] text-center">
                {format(currentDate, 'MMMM yyyy')}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Debug Information */}
        <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
          <div>Total Students: {students.length}</div>
          <div>Total Attendance Records: {attendanceRecords.length}</div>
          <div>Current Month: {format(currentDate, 'MMMM yyyy')}</div>
        </div>

        {/* Legend */}
        <div className="mb-4 flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Present (P)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Absent (A)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <span>Not Marked (-)</span>
          </div>
        </div>

        {/* Attendance Grid */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            {/* Header with dates */}
            <thead>
              <tr>
                <th className="sticky left-0 bg-white border border-gray-300 p-2 text-left font-semibold min-w-[200px]">
                  Student Name
                </th>
                <th className="border border-gray-300 p-2 text-center font-semibold min-w-[80px]">
                  Stats
                </th>
                {monthDays.map(day => (
                  <th
                    key={day.toISOString()}
                    className={`border border-gray-300 p-1 text-center font-semibold min-w-[30px] ${
                      isToday(day) ? 'bg-blue-100' : ''
                    }`}
                  >
                    <div className="text-xs">{format(day, 'EEE')}</div>
                    <div className="text-sm">{format(day, 'd')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => {
                const stats = getStudentMonthlyStats(student.id);
                return (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="sticky left-0 bg-white border border-gray-300 p-2 font-medium">
                      <div>{student.name}</div>
                      <div className="text-xs text-gray-500">Class {student.class}</div>
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      <div className="text-xs">
                        <div className="text-green-600 font-medium">{stats.presentDays}P</div>
                        <div className="text-red-600 font-medium">{stats.absentDays}A</div>
                        <div className={`font-medium ${
                          stats.percentage >= 75 ? 'text-green-600' : 
                          stats.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {stats.percentage}%
                        </div>
                      </div>
                    </td>
                    {monthDays.map(day => {
                      const status = getAttendanceStatus(student.id, day);
                      const isTodayDate = isToday(day);
                      
                      return (
                        <td
                          key={`${student.id}-${day.toISOString()}`}
                          className={`border border-gray-300 p-1 text-center ${
                            isTodayDate ? 'bg-blue-50' : ''
                          }`}
                        >
                          {status === 'present' && (
                            <div className="w-6 h-6 bg-green-500 rounded text-white text-xs flex items-center justify-center mx-auto">
                              P
                            </div>
                          )}
                          {status === 'absent' && (
                            <div className="w-6 h-6 bg-red-500 rounded text-white text-xs flex items-center justify-center mx-auto">
                              A
                            </div>
                          )}
                          {!status && (
                            <div className="w-6 h-6 bg-gray-200 rounded text-gray-500 text-xs flex items-center justify-center mx-auto">
                              -
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No students found matching your search.
          </div>
        )}

        {/* Summary */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredStudents.length} students for {format(currentDate, 'MMMM yyyy')}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentAttendanceGrid;
