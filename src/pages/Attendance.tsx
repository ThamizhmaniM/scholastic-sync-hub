
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import AttendanceForm from "@/components/attendance/AttendanceForm";
import AttendanceSummaryComponent from "@/components/attendance/AttendanceSummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getStudents, markAttendanceInDb, getAttendanceSummaryFromDb } from "@/lib/supabase";
import { AttendanceSummary, Student } from "@/types";
import { toast } from "sonner";

const Attendance = () => {
  const [activeTab, setActiveTab] = useState<string>("mark");
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary[]>([]);
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
      
      // Update attendance summary
      const summary = await getAttendanceSummaryFromDb();
      setAttendanceSummary(summary);
      
      toast.success("Attendance marked successfully");
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error("Failed to mark attendance");
    }
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

  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Attendance</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
            <TabsTrigger value="summary">Attendance Summary</TabsTrigger>
          </TabsList>
          
          <TabsContent value="mark" className="mt-4">
            <AttendanceForm
              students={studentList}
              onMarkAttendance={handleMarkAttendance}
            />
          </TabsContent>
          
          <TabsContent value="summary" className="mt-4">
            <AttendanceSummaryComponent summaries={attendanceSummary} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Attendance;
