import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import AttendanceForm from "@/components/attendance/AttendanceForm";
import AttendanceSummaryComponent from "@/components/attendance/AttendanceSummary";
import AttendanceCalendar from "@/components/attendance/AttendanceCalendar";
import StudentAttendanceGrid from "@/components/attendance/StudentAttendanceGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { getStudents, markAttendanceInDb, getAttendanceSummaryFromDb, getAttendanceRecords, supabase } from "@/lib/supabase";
import { AttendanceSummary, Student, AttendanceRecord } from "@/types";
import { toast } from "sonner";
import { exportAttendanceToPDF, exportAttendanceToExcel, exportAttendanceGridToPDF, exportAttendanceGridToExcel, exportIndividualStudentAttendanceToPDF, exportIndividualStudentAttendanceToExcel, exportAttendanceSummaryToPDF, exportAttendanceSummaryToExcel } from "@/utils/exportUtils";
import { FileDown, FileSpreadsheet, Download } from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Attendance = () => {
  const [activeTab, setActiveTab] = useState<string>("mark");
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentForExport, setSelectedStudentForExport] = useState<string>("");

  useEffect(() => {
    loadDataFromDatabase();
  }, []);

  const loadDataFromDatabase = async () => {
    try {
      setLoading(true);
      const students = await getStudents();
      setStudentList(students);
      
      // Get initial attendance summary
      const summary = await getAttendanceSummaryFromDb();
      setAttendanceSummary(summary);

      // Get recent attendance records
      const records = await getAttendanceRecords();
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error loading attendance data:', error);
      toast.error("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  // Mark attendance for selected students
  const handleMarkAttendance = async (studentIds: string[], date: string, status: 'present' | 'absent') => {
    try {
      // Mark attendance for each student
      const promises = studentIds.map(studentId => 
        markAttendanceInDb({
          studentId,
          date,
          status
        })
      );
      
      await Promise.all(promises);
      
      // Update attendance summary and records
      const [summary, records] = await Promise.all([
        getAttendanceSummaryFromDb(),
        getAttendanceRecords()
      ]);
      
      setAttendanceSummary(summary);
      setAttendanceRecords(records);
      
      toast.success("Attendance marked successfully");
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error("Failed to mark attendance");
    }
  };

  // Remove attendance for a student on a specific date
  const handleRemoveAttendance = async (studentId: string, date: string) => {
    try {
      // Find and remove the attendance record
      const recordToRemove = attendanceRecords.find(
        record => record.studentId === studentId && record.date === date
      );
      
      if (recordToRemove) {
        // You might need to add a delete function to your supabase library
        // For now, we'll use the supabase client directly
        const { error } = await supabase
          .from('attendance_records')
          .delete()
          .eq('student_id', studentId)
          .eq('date', date);
          
        if (error) {
          throw error;
        }
        
        // Update attendance summary and records
        const [summary, records] = await Promise.all([
          getAttendanceSummaryFromDb(),
          getAttendanceRecords()
        ]);
        
        setAttendanceSummary(summary);
        setAttendanceRecords(records);
        
        toast.success("Attendance removed successfully");
      }
    } catch (error) {
      console.error('Error removing attendance:', error);
      toast.error("Failed to remove attendance");
    }
  };

  const handleExportAttendancePDF = () => {
    const currentMonth = format(new Date(), 'MMMM');
    const currentYear = format(new Date(), 'yyyy');
    exportAttendanceToPDF(attendanceRecords, studentList, currentMonth, currentYear);
    toast.success("Attendance report exported as PDF");
  };

  const handleExportAttendanceExcel = () => {
    const currentMonth = format(new Date(), 'MMMM');
    const currentYear = format(new Date(), 'yyyy');
    exportAttendanceToExcel(attendanceRecords, studentList, currentMonth, currentYear);
    toast.success("Attendance report exported as Excel");
  };

  const handleExportGridPDF = () => {
    const currentMonth = format(new Date(), 'MMMM');
    const currentYear = format(new Date(), 'yyyy');
    exportAttendanceGridToPDF(attendanceRecords, studentList, currentMonth, currentYear);
    toast.success("Attendance grid exported as PDF");
  };

  const handleExportGridExcel = () => {
    const currentMonth = format(new Date(), 'MMMM');
    const currentYear = format(new Date(), 'yyyy');
    exportAttendanceGridToExcel(attendanceRecords, studentList, currentMonth, currentYear);
    toast.success("Attendance grid exported as Excel");
  };

  const handleExportIndividualStudentPDF = () => {
    if (!selectedStudentForExport) {
      toast.error("Please select a student first");
      return;
    }
    const student = studentList.find(s => s.id === selectedStudentForExport);
    if (student) {
      const currentMonth = format(new Date(), 'MMMM');
      const currentYear = format(new Date(), 'yyyy');
      exportIndividualStudentAttendanceToPDF(attendanceRecords, student, currentMonth, currentYear);
      toast.success(`${student.name}'s attendance exported as PDF`);
    }
  };

  const handleExportIndividualStudentExcel = () => {
    if (!selectedStudentForExport) {
      toast.error("Please select a student first");
      return;
    }
    const student = studentList.find(s => s.id === selectedStudentForExport);
    if (student) {
      const currentMonth = format(new Date(), 'MMMM');
      const currentYear = format(new Date(), 'yyyy');
      exportIndividualStudentAttendanceToExcel(attendanceRecords, student, currentMonth, currentYear);
      toast.success(`${student.name}'s attendance exported as Excel`);
    }
  };

  const handleExportSummaryPDF = () => {
    const currentMonth = format(new Date(), 'MMMM');
    const currentYear = format(new Date(), 'yyyy');
    exportAttendanceSummaryToPDF(attendanceRecords, studentList, currentMonth, currentYear);
    toast.success("Attendance summary exported as PDF");
  };

  const handleExportSummaryExcel = () => {
    const currentMonth = format(new Date(), 'MMMM');
    const currentYear = format(new Date(), 'yyyy');
    exportAttendanceSummaryToExcel(attendanceRecords, studentList, currentMonth, currentYear);
    toast.success("Attendance summary exported as Excel");
  };

  const getAttendanceStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = attendanceRecords.filter(record => record.date === today);
    const presentToday = todayRecords.filter(record => record.status === 'present').length;
    const totalStudents = studentList.length;
    const attendanceRate = totalStudents > 0 ? Math.round((presentToday / totalStudents) * 100) : 0;

    return {
      totalStudents,
      presentToday,
      absentToday: totalStudents - presentToday,
      attendanceRate
    };
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading attendance data...</div>
        </div>
      </Layout>
    );
  }

  const stats = getAttendanceStats();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Brainiacs HSC</h1>
          <div className="flex gap-2 flex-wrap">
            {/* Basic Export Options */}
            <Button onClick={handleExportAttendancePDF} variant="outline" className="flex items-center gap-2">
              <FileDown className="h-4 w-4" />
              Export PDF
            </Button>
            <Button onClick={handleExportAttendanceExcel} variant="outline" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </Button>
            
            {/* Grid Export Options */}
            <Button onClick={handleExportGridPDF} variant="outline" className="flex items-center gap-2">
              <FileDown className="h-4 w-4" />
              Grid PDF
            </Button>
            <Button onClick={handleExportGridExcel} variant="outline" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Grid Excel
            </Button>
            
            {/* Summary Export Options */}
            <Button onClick={handleExportSummaryPDF} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Summary PDF
            </Button>
            <Button onClick={handleExportSummaryExcel} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Summary Excel
            </Button>
          </div>
        </div>

        {/* Individual Student Export Section */}
        <Card>
          <CardHeader>
            <CardTitle>Individual Student Export</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Select value={selectedStudentForExport} onValueChange={setSelectedStudentForExport}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student to export individual attendance" />
                  </SelectTrigger>
                  <SelectContent>
                    {studentList.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} - Class {student.class}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleExportIndividualStudentPDF} 
                variant="outline" 
                disabled={!selectedStudentForExport}
                className="flex items-center gap-2"
              >
                <FileDown className="h-4 w-4" />
                PDF
              </Button>
              <Button 
                onClick={handleExportIndividualStudentExcel} 
                variant="outline" 
                disabled={!selectedStudentForExport}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.presentToday}</div>
              <p className="text-sm text-muted-foreground">Present Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.absentToday}</div>
              <p className="text-sm text-muted-foreground">Absent Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.attendanceRate}%</div>
              <p className="text-sm text-muted-foreground">Attendance Rate</p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
            <TabsTrigger value="grid">Student Grid</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="summary">Attendance Summary</TabsTrigger>
          </TabsList>
          
          <TabsContent value="mark" className="mt-6">
            <AttendanceForm
              students={studentList}
              onMarkAttendance={handleMarkAttendance}
            />
          </TabsContent>
          
          <TabsContent value="grid" className="mt-6">
            <StudentAttendanceGrid 
              attendanceRecords={attendanceRecords}
              students={studentList}
              onMarkAttendance={handleMarkAttendance}
              onRemoveAttendance={handleRemoveAttendance}
            />
          </TabsContent>
          
          <TabsContent value="calendar" className="mt-6">
            <AttendanceCalendar 
              attendanceRecords={attendanceRecords}
              students={studentList}
            />
          </TabsContent>
          
          <TabsContent value="summary" className="mt-6">
            <AttendanceSummaryComponent summaries={attendanceSummary} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Attendance;
