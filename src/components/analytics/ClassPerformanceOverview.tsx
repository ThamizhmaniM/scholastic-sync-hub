
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Student } from "@/types";
import { Users, TrendingUp, Award, BookOpen } from "lucide-react";

interface ClassPerformanceOverviewProps {
  students: Student[];
  marks: any[];
}

const ClassPerformanceOverview = ({ students, marks }: ClassPerformanceOverviewProps) => {
  const chartConfig = {
    students: {
      label: "Students",
      color: "hsl(var(--chart-1))",
    },
    percentage: {
      label: "Average %",
      color: "hsl(var(--chart-2))",
    },
  };

  const performanceData = useMemo(() => {
    if (!marks.length || !students.length) return null;

    // Calculate performance by subject
    const subjectPerformance = new Map();
    
    marks.forEach(mark => {
      if (!subjectPerformance.has(mark.subject)) {
        subjectPerformance.set(mark.subject, {
          subject: mark.subject,
          totalMarks: 0,
          totalPossible: 0,
          testCount: 0,
          studentCount: new Set()
        });
      }
      
      const subjectData = subjectPerformance.get(mark.subject);
      subjectData.totalMarks += mark.marks_obtained;
      subjectData.totalPossible += mark.total_marks;
      subjectData.testCount += 1;
      subjectData.studentCount.add(mark.student_id);
    });

    const subjectChartData = Array.from(subjectPerformance.values()).map(data => ({
      subject: data.subject,
      averagePercentage: Math.round((data.totalMarks / data.totalPossible) * 100),
      testCount: data.testCount,
      studentCount: data.studentCount.size
    }));

    // Calculate grade distribution
    const gradeDistribution = { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
    
    marks.forEach(mark => {
      const percentage = (mark.marks_obtained / mark.total_marks) * 100;
      if (percentage >= 90) gradeDistribution['A+']++;
      else if (percentage >= 80) gradeDistribution['A']++;
      else if (percentage >= 70) gradeDistribution['B+']++;
      else if (percentage >= 60) gradeDistribution['B']++;
      else if (percentage >= 50) gradeDistribution['C']++;
      else if (percentage >= 40) gradeDistribution['D']++;
      else gradeDistribution['F']++;
    });

    const gradeChartData = Object.entries(gradeDistribution).map(([grade, count]) => ({
      grade,
      count,
      percentage: marks.length > 0 ? Math.round((count / marks.length) * 100) : 0
    }));

    // Calculate overall statistics
    const totalTests = marks.length;
    const totalMarksObtained = marks.reduce((sum, mark) => sum + mark.marks_obtained, 0);
    const totalPossibleMarks = marks.reduce((sum, mark) => sum + mark.total_marks, 0);
    const overallAverage = totalPossibleMarks > 0 ? Math.round((totalMarksObtained / totalPossibleMarks) * 100) : 0;
    
    const activeStudents = new Set(marks.map(mark => mark.student_id)).size;

    return {
      subjectChartData,
      gradeChartData,
      overallAverage,
      totalTests,
      activeStudents,
      totalStudents: students.length
    };
  }, [marks, students]);

  if (!performanceData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4" />
              <p>No test data available yet</p>
              <p className="text-sm">Add some test marks to see class performance analytics</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Class Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.overallAverage}%</div>
            <p className="text-xs text-muted-foreground">
              Overall performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.totalTests}</div>
            <p className="text-xs text-muted-foreground">
              Tests completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.activeStudents}</div>
            <p className="text-xs text-muted-foreground">
              Out of {performanceData.totalStudents} students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.subjectChartData.length}</div>
            <p className="text-xs text-muted-foreground">
              Subjects tested
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance by Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <BarChart data={performanceData.subjectChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="subject" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis domain={[0, 100]} />
                <ChartTooltip 
                  content={
                    <ChartTooltipContent 
                      formatter={(value, name) => [
                        `${value}%`,
                        'Average Performance'
                      ]}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          const data = payload[0].payload;
                          return `${label} (${data.testCount} tests, ${data.studentCount} students)`;
                        }
                        return label;
                      }}
                    />
                  }
                />
                <Bar 
                  dataKey="averagePercentage" 
                  fill="var(--color-percentage)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Grade Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <PieChart>
                <Pie
                  data={performanceData.gradeChartData.filter(item => item.count > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ grade, percentage }) => `${grade} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {performanceData.gradeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip 
                  content={
                    <ChartTooltipContent 
                      formatter={(value, name) => [
                        `${value} students`,
                        'Count'
                      ]}
                    />
                  }
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClassPerformanceOverview;
