
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Student } from "@/types";
import { toast } from "sonner";
import { CLASSES } from "@/lib/mock-data";

interface AttendanceFormProps {
  students: Student[];
  onMarkAttendance: (studentIds: string[], date: string, status: 'present' | 'absent') => void;
}

export const AttendanceForm = ({ students, onMarkAttendance }: AttendanceFormProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>("all");

  // Filter students by selected class
  const filteredStudents = students.filter(
    (student) => selectedClass === "all" || student.class === selectedClass
  );

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(student => student.id));
    }
    setSelectAll(!selectAll);
  };

  // Handle individual student selection
  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Reset selections when class filter changes
  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    setSelectedStudents([]);
    setSelectAll(false);
  };

  // Mark selected students as present
  const markPresent = () => {
    if (selectedStudents.length === 0) {
      toast.error("No students selected");
      return;
    }
    
    const dateStr = selectedDate.toISOString().split('T')[0];
    onMarkAttendance(selectedStudents, dateStr, 'present');
    toast.success(`Marked ${selectedStudents.length} students as present for ${format(selectedDate, 'PPP')}`);
    
    // Reset selection after marking
    setSelectedStudents([]);
    setSelectAll(false);
  };

  // Mark selected students as absent
  const markAbsent = () => {
    if (selectedStudents.length === 0) {
      toast.error("No students selected");
      return;
    }
    
    const dateStr = selectedDate.toISOString().split('T')[0];
    onMarkAttendance(selectedStudents, dateStr, 'absent');
    toast.success(`Marked ${selectedStudents.length} students as absent for ${format(selectedDate, 'PPP')}`);
    
    // Reset selection after marking
    setSelectedStudents([]);
    setSelectAll(false);
  };

  // Mark all filtered students present for selected date
  const markAllPresent = () => {
    const allFilteredStudentIds = filteredStudents.map(student => student.id);
    const dateStr = selectedDate.toISOString().split('T')[0];
    onMarkAttendance(allFilteredStudentIds, dateStr, 'present');
    
    const classText = selectedClass === "all" ? "all" : `Class ${selectedClass}`;
    toast.success(`Marked all students in ${classText} as present for ${format(selectedDate, 'PPP')}`);
    setSelectedStudents([]);
    setSelectAll(false);
  };

  return (
    <div className="space-y-6">
      {/* Calendar Date Picker */}
      <Card>
        <CardHeader>
          <CardTitle>Select Date</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            
            <Button onClick={markAllPresent} variant="default">
              Mark All Present
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Student Selection */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Mark Attendance for {format(selectedDate, 'PPP')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Select students and mark them as present or absent
              </p>
            </div>
            <Select value={selectedClass} onValueChange={handleClassChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {CLASSES.map((c) => (
                  <SelectItem key={c} value={c}>
                    Class {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="py-3 px-4 text-left">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all"
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                      />
                      <label htmlFor="select-all" className="text-sm font-medium">Select All</label>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left font-medium">Student Name</th>
                  <th className="py-3 px-4 text-left font-medium">Class</th>
                  <th className="py-3 px-4 text-left font-medium">Subjects</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <Checkbox
                        id={`student-${student.id}`}
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={() => handleSelectStudent(student.id)}
                      />
                    </td>
                    <td className="py-3 px-4 font-medium">{student.name}</td>
                    <td className="py-3 px-4">{student.class}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {student.subjects.slice(0, 2).map(subject => (
                          <span key={subject} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {subject}
                          </span>
                        ))}
                        {student.subjects.length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            +{student.subjects.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {selectedStudents.length} of {filteredStudents.length} students selected
              {selectedClass !== "all" && ` (Class ${selectedClass})`}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={markAbsent} disabled={selectedStudents.length === 0}>
                Mark Absent ({selectedStudents.length})
              </Button>
              <Button onClick={markPresent} disabled={selectedStudents.length === 0}>
                Mark Present ({selectedStudents.length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceForm;
