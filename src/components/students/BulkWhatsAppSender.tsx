import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageCircle, Send, Filter, FileText, Download } from "lucide-react";
import { Student } from "@/types";
import { getAttendanceSummaryFromDb, getWeeklyTestMarks, getAttendanceRecords } from "@/lib/supabase";
import { generateWhatsAppMessage, openWhatsApp } from "@/utils/whatsappUtils";
import { exportStudentSummaryToPDF } from "@/utils/exportUtils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface BulkWhatsAppSenderProps {
  students: Student[];
}

interface StudentWithAttendance extends Student {
  attendancePercentage: number;
  hasPhoneNumber: boolean;
}

export const BulkWhatsAppSender = ({ students }: BulkWhatsAppSenderProps) => {
  const { toast } = useToast();
  const [studentsWithAttendance, setStudentsWithAttendance] = useState<StudentWithAttendance[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithAttendance[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [classFilter, setClassFilter] = useState<string>("all");
  const [attendanceFilter, setAttendanceFilter] = useState<string>("all");
  const [minAttendance, setMinAttendance] = useState<number>(0);
  const [maxAttendance, setMaxAttendance] = useState<number>(100);

  useEffect(() => {
    loadStudentsWithAttendance();
  }, [students]);

  useEffect(() => {
    applyFilters();
  }, [studentsWithAttendance, classFilter, attendanceFilter, minAttendance, maxAttendance]);

  const loadStudentsWithAttendance = async () => {
    try {
      const attendanceSummaries = await getAttendanceSummaryFromDb();
      
      const studentsWithData = students.map(student => {
        const attendance = attendanceSummaries.find(a => a.studentId === student.id);
        return {
          ...student,
          attendancePercentage: attendance?.percentage || 0,
          hasPhoneNumber: !!student.parent_phone
        };
      });
      
      setStudentsWithAttendance(studentsWithData);
    } catch (error) {
      console.error('Error loading attendance data:', error);
      toast({
        title: "Error",
        description: "Failed to load attendance data",
        variant: "destructive",
      });
    }
  };

  const applyFilters = () => {
    let filtered = [...studentsWithAttendance];

    // Class filter
    if (classFilter !== "all") {
      filtered = filtered.filter(student => student.class === classFilter);
    }

    // Attendance filter
    if (attendanceFilter === "low") {
      filtered = filtered.filter(student => student.attendancePercentage < 75);
    } else if (attendanceFilter === "medium") {
      filtered = filtered.filter(student => student.attendancePercentage >= 75 && student.attendancePercentage < 90);
    } else if (attendanceFilter === "high") {
      filtered = filtered.filter(student => student.attendancePercentage >= 90);
    } else if (attendanceFilter === "custom") {
      filtered = filtered.filter(student => 
        student.attendancePercentage >= minAttendance && 
        student.attendancePercentage <= maxAttendance
      );
    }

    // Only include students with phone numbers
    filtered = filtered.filter(student => student.hasPhoneNumber);

    setFilteredStudents(filtered);
    setSelectedStudents([]);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(filteredStudents.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    }
  };

  const sendBulkMessages = async () => {
    if (selectedStudents.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one student",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const studentId of selectedStudents) {
      const student = filteredStudents.find(s => s.id === studentId);
      if (!student) continue;

      try {
        // Get attendance summary
        const attendanceSummary = await getAttendanceSummaryFromDb(student.id);
        const studentAttendance = attendanceSummary.find(a => a.studentId === student.id);
        
        // Get recent test marks
        const allMarks = await getWeeklyTestMarks(student.id);
        const recentMarks = allMarks.slice(0, 5);
        
        // Generate WhatsApp message
        const message = generateWhatsAppMessage(
          student,
          studentAttendance || { totalDays: 0, presentDays: 0, percentage: 0 },
          recentMarks
        );
        
        // Open WhatsApp (with a small delay to avoid rate limiting)
        setTimeout(() => {
          openWhatsApp(student.parent_phone!, message);
        }, successCount * 2000); // 2 second delay between each message
        
        successCount++;
      } catch (error) {
        console.error(`Error sending message for ${student.name}:`, error);
        errorCount++;
      }
    }

    setLoading(false);
    toast({
      title: "Bulk Messages Sent",
      description: `Successfully sent ${successCount} messages${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
    });
  };

  const generateBulkPDFs = async () => {
    if (selectedStudents.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one student",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      toast({
        title: "Generating PDFs",
        description: `Preparing ${selectedStudents.length} student reports...`,
      });

      // Get attendance records once for all students
      const attendanceRecords = await getAttendanceRecords();

      for (const studentId of selectedStudents) {
        const student = filteredStudents.find(s => s.id === studentId);
        if (!student) continue;

        try {
          // Get all test marks for the student
          const allMarks = await getWeeklyTestMarks(student.id);
          
          // Generate PDF with a small delay to prevent browser hanging
          setTimeout(() => {
            exportStudentSummaryToPDF(
              student,
              attendanceRecords,
              allMarks,
              `Academic Year ${new Date().getFullYear()}`
            );
          }, successCount * 500); // 500ms delay between each PDF generation
          
          successCount++;
        } catch (error) {
          console.error(`Error generating PDF for ${student.name}:`, error);
          errorCount++;
        }
      }

      // Show completion message after a delay
      setTimeout(() => {
        toast({
          title: "PDFs Generated",
          description: `Successfully generated ${successCount} PDF reports${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        });
      }, selectedStudents.length * 500 + 1000);

    } catch (error) {
      console.error('Error in bulk PDF generation:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uniqueClasses = Array.from(new Set(students.map(s => s.class))).sort();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Bulk WhatsApp Sender
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <Label htmlFor="class-filter">Filter by Class</Label>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {uniqueClasses.map(cls => (
                  <SelectItem key={cls} value={cls}>Class {cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="attendance-filter">Filter by Attendance</Label>
            <Select value={attendanceFilter} onValueChange={setAttendanceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All attendance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                <SelectItem value="low">Low (&lt; 75%)</SelectItem>
                <SelectItem value="medium">Medium (75-90%)</SelectItem>
                <SelectItem value="high">High (&gt;= 90%)</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {attendanceFilter === "custom" && (
            <>
              <div>
                <Label htmlFor="min-attendance">Min Attendance %</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={minAttendance}
                  onChange={(e) => setMinAttendance(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="max-attendance">Max Attendance %</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={maxAttendance}
                  onChange={(e) => setMaxAttendance(Number(e.target.value))}
                />
              </div>
            </>
          )}
        </div>

        {/* Student Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all" className="font-medium">
                Select All ({filteredStudents.length} students)
              </Label>
            </div>
            <Badge variant="outline">
              {selectedStudents.length} selected
            </Badge>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Filter className="h-8 w-8 mx-auto mb-2" />
                <p>No students match the current filters</p>
              </div>
            ) : (
              filteredStudents.map(student => (
                <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={`student-${student.id}`}
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                    />
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Class {student.class} • {student.parent_phone}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={student.attendancePercentage >= 90 ? "default" : 
                            student.attendancePercentage >= 75 ? "secondary" : "destructive"}
                  >
                    {student.attendancePercentage.toFixed(1)}% attendance
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button
            onClick={generateBulkPDFs}
            disabled={selectedStudents.length === 0 || loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            {loading ? 'Generating...' : `Generate ${selectedStudents.length} PDFs`}
          </Button>
          <Button
            onClick={sendBulkMessages}
            disabled={selectedStudents.length === 0 || loading}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {loading ? 'Sending...' : `Send to ${selectedStudents.length} Parents`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkWhatsAppSender;