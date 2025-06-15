
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WeeklyTestMark, Student } from "@/types";
import { Edit, Trash2, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WeeklyMarksListProps {
  marks: any[];
  students: Student[];
  onEdit: (mark: WeeklyTestMark) => void;
  onDelete: (id: string) => void;
  onFilter: (filters: { studentId?: string; weekNumber?: number; year?: number; subject?: string }) => void;
}

const WeeklyMarksList = ({ marks, students, onEdit, onDelete, onFilter }: WeeklyMarksListProps) => {
  const [filters, setFilters] = useState({
    studentId: "",
    weekNumber: "",
    year: new Date().getFullYear().toString(),
    subject: "",
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Apply filters
    const filterObj: any = {};
    if (newFilters.studentId && newFilters.studentId !== '_all_') {
      filterObj.studentId = newFilters.studentId;
    }
    if (newFilters.weekNumber) {
      filterObj.weekNumber = parseInt(newFilters.weekNumber);
    }
    if (newFilters.year) {
      filterObj.year = parseInt(newFilters.year);
    }
    if (newFilters.subject && newFilters.subject !== '_all_') {
      filterObj.subject = newFilters.subject;
    }
    
    onFilter(filterObj);
  };

  const clearFilters = () => {
    setFilters({
      studentId: "",
      weekNumber: "",
      year: new Date().getFullYear().toString(),
      subject: "",
    });
    onFilter({});
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : 'Unknown Student';
  };

  const getGrade = (obtained: number, total: number) => {
    const percentage = (obtained / total) * 100;
    if (percentage >= 90) return { grade: 'A+', color: 'bg-green-500' };
    if (percentage >= 80) return { grade: 'A', color: 'bg-green-400' };
    if (percentage >= 70) return { grade: 'B+', color: 'bg-blue-500' };
    if (percentage >= 60) return { grade: 'B', color: 'bg-blue-400' };
    if (percentage >= 50) return { grade: 'C', color: 'bg-yellow-500' };
    if (percentage >= 40) return { grade: 'D', color: 'bg-orange-500' };
    return { grade: 'F', color: 'bg-red-500' };
  };

  // Get unique subjects from all students
  const allSubjects = Array.from(new Set(students.flatMap(s => s.subjects)));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Weekly Test Marks
        </CardTitle>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4">
          <div>
            <Label htmlFor="filter-student">Student</Label>
            <Select value={filters.studentId} onValueChange={(value) => handleFilterChange('studentId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All students" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all_">All students</SelectItem>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="filter-subject">Subject</Label>
            <Select value={filters.subject} onValueChange={(value) => handleFilterChange('subject', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all_">All subjects</SelectItem>
                {allSubjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="filter-week">Week Number</Label>
            <Input
              id="filter-week"
              type="number"
              min="1"
              max="52"
              placeholder="Week"
              value={filters.weekNumber}
              onChange={(e) => handleFilterChange('weekNumber', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="filter-year">Year</Label>
            <Input
              id="filter-year"
              type="number"
              min="2020"
              max="2030"
              value={filters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <Button variant="outline" onClick={clearFilters} className="w-full">
              Clear Filters
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {marks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No test marks found. Add some marks to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Week</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Test Date</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marks.map((mark) => {
                  const percentage = ((mark.marks_obtained / mark.total_marks) * 100).toFixed(1);
                  const gradeInfo = getGrade(mark.marks_obtained, mark.total_marks);
                  
                  return (
                    <TableRow key={mark.id}>
                      <TableCell className="font-medium">
                        {getStudentName(mark.student_id)}
                      </TableCell>
                      <TableCell>{mark.subject}</TableCell>
                      <TableCell>{mark.week_number}</TableCell>
                      <TableCell>{mark.year}</TableCell>
                      <TableCell>
                        {mark.marks_obtained}/{mark.total_marks}
                      </TableCell>
                      <TableCell>{percentage}%</TableCell>
                      <TableCell>
                        <Badge className={`text-white ${gradeInfo.color}`}>
                          {gradeInfo.grade}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(mark.test_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {mark.remarks || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit({
                              id: mark.id,
                              studentId: mark.student_id,
                              subject: mark.subject,
                              weekNumber: mark.week_number,
                              year: mark.year,
                              marksObtained: mark.marks_obtained,
                              totalMarks: mark.total_marks,
                              testDate: mark.test_date,
                              remarks: mark.remarks,
                            })}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDelete(mark.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklyMarksList;
