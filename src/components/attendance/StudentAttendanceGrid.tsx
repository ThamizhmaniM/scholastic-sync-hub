
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay } from "date-fns";
import { AttendanceRecord, Student } from "@/types";

interface StudentAttendanceGridProps {
  attendanceRecords: AttendanceRecord[];
  students: Student[];
  onMarkAttendance?: (studentIds: string[], date: string, status: 'present' | 'absent') => void;
}

// Helper function to format date for IST without timezone issues
const formatDateForIST = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const StudentAttendanceGrid = ({ attendanceRecords, students, onMarkAttendance }: StudentAttendanceGridProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");

  console.log('StudentAttendanceGrid - Attendance Records:', attendanceRecords);
  console.log('StudentAttendanceGrid - Students:', students);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get unique classes from students
  const uniqueClasses = Array.from(new Set(students.map(student => student.class))).sort();

  // Filter students by search query and class
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === "all" || student.class === selectedClass;
    return matchesSearch && matchesClass;
  });

  // Get attendance status for a specific student and date
  const getAttendanceStatus = (studentId: string, date: Date) => {
    const dateStr = formatDateForIST(date);
    console.log(`Looking for attendance - Student: ${studentId}, Date: ${dateStr}`);
    
    // Use only studentId field as per the type definition
    const record = attendanceRecords.find(
      record => record.studentId === studentId && record.date === dateStr
    );
    
    console.log(`Attendance status for ${studentId} on ${dateStr}:`, record?.status || 'not found');
    return record?.status || null;
  };

  // Handle marking attendance directly in the grid
  const handleCellClick = (studentId: string, date: Date) => {
    if (!onMarkAttendance) return;
    
    const currentStatus = getAttendanceStatus(studentId, date);
    const dateStr = formatDateForIST(date);
    
    // Cycle through: null -> present -> absent -> null
    let newStatus: 'present' | 'absent' | null = null;
    if (!currentStatus) {
      newStatus = 'present';
    } else if (currentStatus === 'present') {
      newStatus = 'absent';
    } else {
      newStatus = 'present'; // Reset to present instead of null for better UX
    }
    
    if (newStatus) {
      onMarkAttendance([studentId], dateStr, newStatus);
    }
  };

  // Calculate monthly stats for a student
  const getStudentMonthlyStats = (studentId: string) => {
    const studentRecords = attendanceRecords.filter(
      record => record.studentId === studentId &&
        record.date >= formatDateForIST(monthStart) &&
        record.date <= formatDateForIST(monthEnd)
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
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {uniqueClasses.map(cls => (
                  <SelectItem key={cls} value={cls}>Class {cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        {/* Instructions */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
          <div className="font-medium mb-1">How to mark attendance:</div>
          <div>Click on any cell to mark attendance. Click again to cycle between Present → Absent → Present</div>
        </div>

        {/* Legend */}
        <div className="mb-4 flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded cursor-pointer"></div>
            <span>Present (P) - Click to mark</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded cursor-pointer"></div>
            <span>Absent (A) - Click to mark</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded cursor-pointer"></div>
            <span>Not Marked (-) - Click to mark</span>
          </div>
        </div>

        {/* Attendance Grid */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            {/* Header with dates */}
            <thead>
              <tr>
                <th className="sticky left-0 bg-white border border-gray-300 p-2 text-left font-semibold min-w-[200px] z-10">
                  Student Name
                </th>
                <th className="border border-gray-300 p-2 text-center font-semibold min-w-[80px]">
                  Stats
                </th>
                {monthDays.map(day => (
                  <th
                    key={day.toISOString()}
                    className={`border border-gray-300 p-1 text-center font-semibold min-w-[40px] ${
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
                    <td className="sticky left-0 bg-white border border-gray-300 p-2 font-medium z-10">
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
                          } ${onMarkAttendance ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                          onClick={() => onMarkAttendance && handleCellClick(student.id, day)}
                          title={onMarkAttendance ? 'Click to mark/change attendance' : ''}
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
            No students found matching your search criteria.
          </div>
        )}

        {/* Summary */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredStudents.length} students 
          {selectedClass !== "all" && ` from Class ${selectedClass}`} 
          for {format(currentDate, 'MMMM yyyy')}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentAttendanceGrid;
