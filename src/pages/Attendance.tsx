
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import AttendanceForm from "@/components/attendance/AttendanceForm";
import AttendanceSummaryComponent from "@/components/attendance/AttendanceSummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { students, markBulkAttendance, getAttendanceSummary } from "@/lib/mock-data";
import { AttendanceSummary } from "@/types";

const Attendance = () => {
  const [activeTab, setActiveTab] = useState<string>("mark");
  const [studentList, setStudentList] = useState([...students]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary[]>([]);

  useEffect(() => {
    // Get initial attendance summary
    const summary = getAttendanceSummary();
    setAttendanceSummary(summary);
  }, []);

  // Mark attendance for selected students
  const handleMarkAttendance = (studentIds: string[], date: string, status: 'present' | 'absent') => {
    markBulkAttendance(studentIds, date, status);
    
    // Update attendance summary
    const summary = getAttendanceSummary();
    setAttendanceSummary(summary);
  };

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
