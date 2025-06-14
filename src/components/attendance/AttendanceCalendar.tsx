
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay } from "date-fns";
import { AttendanceRecord, Student } from "@/types";

interface AttendanceCalendarProps {
  attendanceRecords: AttendanceRecord[];
  students: Student[];
}

export const AttendanceCalendar = ({ attendanceRecords, students }: AttendanceCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get attendance data for a specific date
  const getAttendanceForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayRecords = attendanceRecords.filter(record => record.date === dateStr);
    const presentCount = dayRecords.filter(record => record.status === 'present').length;
    const absentCount = dayRecords.filter(record => record.status === 'absent').length;
    const totalRecords = dayRecords.length;
    
    return {
      present: presentCount,
      absent: absentCount,
      total: totalRecords,
      percentage: totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0
    };
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

  // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = getDay(monthStart);
  
  // Create empty cells for days before the month starts
  const emptyCells = Array.from({ length: firstDayOfWeek }, (_, i) => (
    <div key={`empty-${i}`} className="h-24 border border-gray-100"></div>
  ));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Attendance Calendar</CardTitle>
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
      </CardHeader>
      <CardContent>
        {/* Calendar Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="h-8 flex items-center justify-center font-semibold text-sm text-gray-600">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {emptyCells}
          {monthDays.map(day => {
            const attendance = getAttendanceForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);
            
            return (
              <div
                key={day.toISOString()}
                className={`h-24 border border-gray-200 p-1 ${
                  !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
                } ${isTodayDate ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 ${isTodayDate ? 'text-blue-600' : ''}`}>
                  {format(day, 'd')}
                </div>
                
                {attendance.total > 0 && isCurrentMonth && (
                  <div className="space-y-1">
                    <div className="text-xs">
                      <span className="text-green-600 font-medium">{attendance.present}P</span>
                      {attendance.absent > 0 && (
                        <span className="text-red-600 font-medium ml-1">{attendance.absent}A</span>
                      )}
                    </div>
                    <div className="text-xs">
                      <div 
                        className={`inline-block px-1 py-0.5 rounded text-white text-xs ${
                          attendance.percentage >= 75 
                            ? 'bg-green-500' 
                            : attendance.percentage >= 60 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                        }`}
                      >
                        {attendance.percentage}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <span className="text-green-600 font-medium">P</span> = Present
          </div>
          <div className="flex items-center gap-1">
            <span className="text-red-600 font-medium">A</span> = Absent
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>≥75% attendance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>60-74% attendance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>&lt;60% attendance</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceCalendar;
