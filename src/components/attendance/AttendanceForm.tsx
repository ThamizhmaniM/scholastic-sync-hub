
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Student } from "@/types";
import { toast } from "sonner";

interface AttendanceFormProps {
  students: Student[];
  onMarkAttendance: (studentIds: string[], date: string, status: 'present' | 'absent') => void;
}

export const AttendanceForm = ({ students, onMarkAttendance }: AttendanceFormProps) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(student => student.id));
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

  // Mark selected students as present
  const markPresent = () => {
    if (selectedStudents.length === 0) {
      toast.error("No students selected");
      return;
    }
    
    onMarkAttendance(selectedStudents, date, 'present');
    toast.success(`Marked ${selectedStudents.length} students as present for ${date}`);
    
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
    
    onMarkAttendance(selectedStudents, date, 'absent');
    toast.success(`Marked ${selectedStudents.length} students as absent for ${date}`);
    
    // Reset selection after marking
    setSelectedStudents([]);
    setSelectAll(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mark Attendance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <label htmlFor="attendance-date" className="text-sm font-medium">
            Date:
          </label>
          <input
            id="attendance-date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border rounded px-2 py-1"
            max={new Date().toISOString().split('T')[0]} // Can't select future dates
          />
        </div>

        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted">
                <th className="py-2 px-4 text-left">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all"
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                    <label htmlFor="select-all" className="text-sm font-medium">Select All</label>
                  </div>
                </th>
                <th className="py-2 px-4 text-left">Student</th>
                <th className="py-2 px-4 text-left">Class</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-4">
                    <Checkbox
                      id={`student-${student.id}`}
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={() => handleSelectStudent(student.id)}
                    />
                  </td>
                  <td className="py-2 px-4 font-medium">{student.name}</td>
                  <td className="py-2 px-4">{student.class}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={markAbsent}>
            Mark Absent
          </Button>
          <Button onClick={markPresent}>Mark Present</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceForm;
