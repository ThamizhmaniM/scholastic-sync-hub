
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search, Save } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay } from "date-fns";
import { AttendanceRecord, Student } from "@/types";
import { toast } from "sonner";

interface StudentAttendanceGridProps {
  attendanceRecords: AttendanceRecord[];
  students: Student[];
  onMarkAttendance?: (studentIds: string[], date: string, status: 'present' | 'absent') => void;
  onRemoveAttendance?: (studentId: string, date: string) => void;
}

interface PendingChange {
  studentId: string;
  date: string;
  action: 'mark' | 'remove';
  status?: 'present' | 'absent';
}

// Helper function to format date for IST without timezone issues
const formatDateForIST = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const StudentAttendanceGrid = ({ attendanceRecords, students, onMarkAttendance, onRemoveAttendance }: StudentAttendanceGridProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [localAttendanceState, setLocalAttendanceState] = useState<{[key: string]: 'present' | 'absent' | null}>({});

  console.log('StudentAttendanceGrid - Attendance Records:', attendanceRecords);
  console.log('StudentAttendanceGrid - Students:', students);

  // Initialize local state from attendance records
  useEffect(() => {
    const initialState: {[key: string]: 'present' | 'absent' | null} = {};
    attendanceRecords.forEach(record => {
      const key = `${record.studentId}-${record.date}`;
      initialState[key] = record.status as 'present' | 'absent';
    });
    setLocalAttendanceState(initialState);
  }, [attendanceRecords]);

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

  // Get attendance status for a specific student and date from local state
  const getAttendanceStatus = (studentId: string, date: Date) => {
    const dateStr = formatDateForIST(date);
    const key = `${studentId}-${dateStr}`;
    return localAttendanceState[key] || null;
  };

  // Handle marking attendance directly in the grid
  const handleCellClick = (studentId: string, date: Date) => {
    if (!onMarkAttendance || !onRemoveAttendance) return;
    
    const dateStr = formatDateForIST(date);
    const key = `${studentId}-${dateStr}`;
    const currentStatus = localAttendanceState[key];
    
    let newStatus: 'present' | 'absent' | null;
    let action: 'mark' | 'remove';
    
    // Cycle through: null -> present -> absent -> null (not marked)
    if (!currentStatus) {
      // Not marked -> Present
      newStatus = 'present';
      action = 'mark';
    } else if (currentStatus === 'present') {
      // Present -> Absent
      newStatus = 'absent';
      action = 'mark';
    } else {
      // Absent -> Not marked (remove attendance)
      newStatus = null;
      action = 'remove';
    }

    // Update local state immediately for UI responsiveness
    setLocalAttendanceState(prev => ({
      ...prev,
      [key]: newStatus
    }));

    // Add to pending changes
    const pendingChange: PendingChange = {
      studentId,
      date: dateStr,
      action,
      status: newStatus === null ? undefined : newStatus
    };

    setPendingChanges(prev => {
      // Remove any existing change for this student-date combination
      const filtered = prev.filter(change => 
        !(change.studentId === studentId && change.date === dateStr)
      );
      return [...filtered, pendingChange];
    });
  };

  // Save all pending changes
  const handleSaveChanges = async () => {
    if (pendingChanges.length === 0) {
      toast.info("No changes to save");
      return;
    }

    try {
      // Group changes by action type
      const markChanges = pendingChanges.filter(change => change.action === 'mark');
      const removeChanges = pendingChanges.filter(change => change.action === 'remove');

      // Process mark changes
      for (const change of markChanges) {
        if (change.status && onMarkAttendance) {
          await onMarkAttendance([change.studentId], change.date, change.status);
        }
      }

      // Process remove changes
      for (const change of removeChanges) {
        if (onRemoveAttendance) {
          await onRemoveAttendance(change.studentId, change.date);
        }
      }

      // Clear pending changes
      setPendingChanges([]);
      toast.success(`Saved ${pendingChanges.length} attendance changes`);
    } catch (error) {
      console.error('Error saving attendance changes:', error);
      toast.error("Failed to save attendance changes");
    }
  };

  // Calculate monthly stats for a student
  const getStudentMonthlyStats = (studentId: string) => {
    const monthStartStr = formatDateForIST(monthStart);
    const monthEndStr = formatDateForIST(monthEnd);
    
    // Use local state for current stats
    const studentRecords = monthDays.map(day => {
      const dateStr = formatDateForIST(day);
      const key = `${studentId}-${dateStr}`;
      return {
        date: dateStr,
        status: localAttendanceState[key]
      };
    }).filter(record => record.status !== null);
    
    const presentDays = studentRecords.filter(record => record.status === 'present').length;
    const absentDays = studentRecords.filter(record => record.status === 'absent').length;
    const totalMarked = studentRecords.length;
    const percentage = totalMarked > 0 ? Math.round((presentDays / totalMarked) * 100) : 0;
    
    return { presentDays, absentDays, totalMarked, percentage };
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (pendingChanges.length > 0) {
      toast.warning("Please save your changes before changing months");
      return;
    }
    
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
            {pendingChanges.length > 0 && (
              <Button onClick={handleSaveChanges} className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                Save Changes ({pendingChanges.length})
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Instructions */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
          <div className="font-medium mb-1">How to mark attendance:</div>
          <div>Click on any cell to mark attendance. Click again to cycle: Not Marked → Present → Absent → Not Marked</div>
          {pendingChanges.length > 0 && (
            <div className="mt-2 font-medium text-orange-600">
              You have {pendingChanges.length} unsaved changes. Click "Save Changes" to save them.
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mb-4 flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded cursor-pointer"></div>
            <span>Present (P)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded cursor-pointer"></div>
            <span>Absent (A)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded cursor-pointer"></div>
            <span>Not Marked (-)</span>
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
                      const dateStr = formatDateForIST(day);
                      const hasPendingChange = pendingChanges.some(change => 
                        change.studentId === student.id && change.date === dateStr
                      );
                      
                      return (
                        <td
                          key={`${student.id}-${day.toISOString()}`}
                          className={`border border-gray-300 p-1 text-center ${
                            isTodayDate ? 'bg-blue-50' : ''
                          } ${onMarkAttendance ? 'cursor-pointer hover:bg-gray-100' : ''} ${
                            hasPendingChange ? 'ring-2 ring-orange-300' : ''
                          }`}
                          onClick={() => onMarkAttendance && handleCellClick(student.id, day)}
                          title={onMarkAttendance ? 'Click to cycle: Not Marked → Present → Absent → Not Marked' : ''}
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
          {pendingChanges.length > 0 && (
            <span className="ml-4 text-orange-600 font-medium">
              • {pendingChanges.length} unsaved changes
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentAttendanceGrid;
