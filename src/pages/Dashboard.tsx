
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import StatsCard from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { students, generateGroups, getAttendanceSummary, generateWeekendTests } from "@/lib/mock-data";
import { Users, BookOpen, CalendarDays, Calendar } from "lucide-react";

const Dashboard = () => {
  const [groups, setGroups] = useState(generateGroups());
  const [attendanceSummary, setAttendanceSummary] = useState(getAttendanceSummary());
  const [tests, setTests] = useState(generateWeekendTests(groups));

  // Calculate average attendance
  const avgAttendance = attendanceSummary.length > 0
    ? attendanceSummary.reduce((acc, curr) => acc + curr.percentage, 0) / attendanceSummary.length
    : 0;

  // Get upcoming tests (for the next 7 days)
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  
  const upcomingTests = tests.filter(test => {
    const testDate = new Date(test.date);
    return testDate >= today && testDate <= nextWeek;
  });

  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Students"
            value={students.length}
            icon={<Users className="h-4 w-4" />}
          />
          <StatsCard
            title="Student Groups"
            value={groups.length}
            icon={<BookOpen className="h-4 w-4" />}
          />
          <StatsCard
            title="Average Attendance"
            value={`${avgAttendance.toFixed(1)}%`}
            icon={<CalendarDays className="h-4 w-4" />}
            trend={
              avgAttendance > 75
                ? { value: "Good", positive: true }
                : { value: "Needs Improvement", positive: false }
            }
          />
          <StatsCard
            title="Upcoming Tests"
            value={upcomingTests.length}
            icon={<Calendar className="h-4 w-4" />}
            description="In the next 7 days"
          />
        </div>
        
        {/* Recent Activity and Info Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-2 rounded border">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Users className="h-4 w-4 text-blue-700" />
                </div>
                <div>
                  <p className="text-sm font-medium">New Student Added</p>
                  <p className="text-xs text-muted-foreground">Today at 10:30 AM</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 rounded border">
                <div className="bg-green-100 p-2 rounded-full">
                  <CalendarDays className="h-4 w-4 text-green-700" />
                </div>
                <div>
                  <p className="text-sm font-medium">Attendance Updated</p>
                  <p className="text-xs text-muted-foreground">Yesterday at 4:15 PM</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 rounded border">
                <div className="bg-yellow-100 p-2 rounded-full">
                  <Calendar className="h-4 w-4 text-yellow-700" />
                </div>
                <div>
                  <p className="text-sm font-medium">Weekend Test Scheduled</p>
                  <p className="text-xs text-muted-foreground">2 days ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Class 11 Statistics</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm">Students:</div>
                  <div className="text-sm font-medium">{students.filter(s => s.class === '11').length}</div>
                  <div className="text-sm">Groups:</div>
                  <div className="text-sm font-medium">{groups.filter(g => g.class === '11').length}</div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Class 12 Statistics</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm">Students:</div>
                  <div className="text-sm font-medium">{students.filter(s => s.class === '12').length}</div>
                  <div className="text-sm">Groups:</div>
                  <div className="text-sm font-medium">{groups.filter(g => g.class === '12').length}</div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Popular Subject Combinations</h3>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {groups.slice(0, 3).map(group => (
                    <li key={group.id}>
                      {group.name}: {group.students.length} students
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
