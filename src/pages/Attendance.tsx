
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import AttendanceForm from "@/components/attendance/AttendanceForm";
import AttendanceSummaryComponent from "@/components/attendance/AttendanceSummary";
import AttendanceCalendar from "@/components/attendance/AttendanceCalendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getStudents, markAttendanceInDb, getAttendanceSummaryFromDb, getAttendanceRecords } from "@/lib/supabase";
import { AttendanceSummary, Student, AttendanceRecord } from "@/types";
import { toast } from "sonner";

const Attendance = () => {
  const [activeTab, setActiveTab] = useState<string>("mark");
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

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
        </div>

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
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="summary">Attendance Summary</TabsTrigger>
          </TabsList>
          
          <TabsContent value="mark" className="mt-6">
            <AttendanceForm
              students={studentList}
              onMarkAttendance={handleMarkAttendance}
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
