import React, { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import StatsCard from "@/components/dashboard/StatsCard";
import { initDatabase } from "@/lib/db-init";
import { getDashboardStats } from "@/lib/supabase";
import { toast } from "sonner";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeGroups: 0,
    attendanceRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAndLoadData = async () => {
      try {
        // Initialize the database when the dashboard loads
        await initDatabase();
        
        // Load dashboard statistics
        const dashboardStats = await getDashboardStats();
        setStats(dashboardStats);
      } catch (error) {
        console.error('Failed to initialize or load data:', error);
        toast.error('Failed to connect to database. Please check your Supabase connection.');
      } finally {
        setLoading(false);
      }
    };

    initializeAndLoadData();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatsCard
            title="Total Students"
            value={stats.totalStudents.toString()}
            description="Enrolled in various subjects"
            trend={{ value: "2", positive: true }}
          />
          
          <StatsCard
            title="Active Groups"
            value={stats.activeGroups.toString()}
            description="Based on subject combinations"
            trend={{ value: "1", positive: true }}
          />
          
          <StatsCard
            title="Attendance Rate"
            value={`${stats.attendanceRate}%`}
            description="Weekly average"
            trend={{ value: "3", positive: stats.attendanceRate >= 80 }}
          />
        </div>
        
        {/* Welcome message */}
        <div className="bg-card border rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Welcome to EduSchedule!</h2>
          <p className="text-muted-foreground">
            This dashboard helps you manage students, groups, timetables, and track attendance.
            Use the sidebar navigation to access different features.
            {stats.totalStudents === 0 && (
              <span className="block mt-2 text-amber-600">
                Start by adding some students to see live statistics.
              </span>
            )}
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
