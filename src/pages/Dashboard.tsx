
import React, { useEffect } from "react";
import Layout from "@/components/Layout";
import StatsCard from "@/components/dashboard/StatsCard";
import { initDatabase } from "@/lib/db-init";
import { toast } from "sonner";

const Dashboard = () => {
  useEffect(() => {
    // Initialize the database when the dashboard loads
    initDatabase().catch(error => {
      console.error('Failed to initialize database:', error);
      toast.error('Failed to connect to database. Please check your Supabase connection.');
    });
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Students"
            value="4"
            description="Enrolled in various subjects"
            trend={{ value: "2", positive: true }}
          />
          
          <StatsCard
            title="Active Groups"
            value="3"
            description="Based on subject combinations"
            trend={{ value: "1", positive: true }}
          />
          
          <StatsCard
            title="Attendance Rate"
            value="85%"
            description="Weekly average"
            trend={{ value: "3", positive: false }}
          />
          
          <StatsCard
            title="Upcoming Tests"
            value="8"
            description="Scheduled this weekend"
            trend={{ value: "2", positive: true }}
          />
        </div>
        
        {/* Welcome message */}
        <div className="bg-card border rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Welcome to EduSchedule!</h2>
          <p className="text-muted-foreground">
            This dashboard helps you manage students, groups, timetables, and track attendance.
            Use the sidebar navigation to access different features.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
