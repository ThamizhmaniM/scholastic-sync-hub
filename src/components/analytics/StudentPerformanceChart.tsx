
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, ResponsiveContainer } from "recharts";
import { Student, WeeklyTestMark } from "@/types";
import { TrendingUp, BarChart3 } from "lucide-react";

interface StudentPerformanceChartProps {
  students: Student[];
  marks: any[];
}

const StudentPerformanceChart = ({ students, marks }: StudentPerformanceChartProps) => {
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [chartData, setChartData] = useState<any[]>([]);

  const chartConfig = {
    percentage: {
      label: "Percentage",
      color: "hsl(var(--chart-1))",
    },
    marks: {
      label: "Marks Obtained",
      color: "hsl(var(--chart-2))",
    },
  };

  useEffect(() => {
    if (selectedStudent && marks.length > 0) {
      const studentMarks = marks
        .filter(mark => mark.student_id === selectedStudent)
        .sort((a, b) => {
          // Sort by year, then week number
          if (a.year !== b.year) return a.year - b.year;
          return a.week_number - b.week_number;
        })
        .map(mark => ({
          week: `W${mark.week_number}`,
          weekNumber: mark.week_number,
          year: mark.year,
          subject: mark.subject,
          marksObtained: mark.marks_obtained,
          totalMarks: mark.total_marks,
          percentage: Math.round((mark.marks_obtained / mark.total_marks) * 100),
          testDate: new Date(mark.test_date).toLocaleDateString(),
        }));

      setChartData(studentMarks);
    } else {
      setChartData([]);
    }
  }, [selectedStudent, marks]);

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : 'Unknown Student';
  };

  const averagePerformance = chartData.length > 0 
    ? Math.round(chartData.reduce((sum, item) => sum + item.percentage, 0) / chartData.length)
    : 0;

  const getPerformanceTrend = () => {
    if (chartData.length < 2) return { trend: "neutral", change: 0 };
    
    const recent = chartData.slice(-3);
    const earlier = chartData.slice(-6, -3);
    
    if (recent.length === 0 || earlier.length === 0) return { trend: "neutral", change: 0 };
    
    const recentAvg = recent.reduce((sum, item) => sum + item.percentage, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, item) => sum + item.percentage, 0) / earlier.length;
    
    const change = Math.round(recentAvg - earlierAvg);
    
    return {
      trend: change > 0 ? "up" : change < 0 ? "down" : "neutral",
      change: Math.abs(change)
    };
  };

  const trend = getPerformanceTrend();

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Select Student</label>
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a student" />
            </SelectTrigger>
            <SelectContent>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name} (Class {student.class})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Chart Type</label>
          <Select value={chartType} onValueChange={(value: "line" | "bar") => setChartType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="bar">Bar Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Performance Summary */}
      {selectedStudent && chartData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Performance</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averagePerformance}%</div>
              <p className="text-xs text-muted-foreground">
                Based on {chartData.length} test{chartData.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Trend</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                trend.trend === 'up' ? 'text-green-600' : 
                trend.trend === 'down' ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                {trend.trend === 'up' ? '↗' : trend.trend === 'down' ? '↘' : '→'}
              </div>
              <p className="text-xs text-muted-foreground">
                {trend.change > 0 ? `${trend.change}% change` : 'Stable performance'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{chartData.length}</div>
              <p className="text-xs text-muted-foreground">
                Tests completed
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedStudent 
              ? `Performance Analysis - ${getStudentName(selectedStudent)}`
              : "Select a student to view performance analysis"
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedStudent ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Please select a student to view their performance chart
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              No test data available for this student
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-80">
              {chartType === "line" ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="week" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip 
                    content={
                      <ChartTooltipContent 
                        formatter={(value, name) => [
                          `${value}${name === 'percentage' ? '%' : ''}`,
                          name === 'percentage' ? 'Percentage' : 'Marks'
                        ]}
                        labelFormatter={(label, payload) => {
                          if (payload && payload[0]) {
                            const data = payload[0].payload;
                            return `Week ${data.weekNumber} (${data.year}) - ${data.subject}`;
                          }
                          return label;
                        }}
                      />
                    }
                  />
                  <Line 
                    type="monotone" 
                    dataKey="percentage" 
                    stroke="var(--color-percentage)" 
                    strokeWidth={2}
                    dot={{ fill: "var(--color-percentage)", strokeWidth: 2 }}
                  />
                </LineChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="week" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip 
                    content={
                      <ChartTooltipContent 
                        formatter={(value, name) => [
                          `${value}${name === 'percentage' ? '%' : ''}`,
                          name === 'percentage' ? 'Percentage' : 'Marks'
                        ]}
                        labelFormatter={(label, payload) => {
                          if (payload && payload[0]) {
                            const data = payload[0].payload;
                            return `Week ${data.weekNumber} (${data.year}) - ${data.subject}`;
                          }
                          return label;
                        }}
                      />
                    }
                  />
                  <Bar 
                    dataKey="percentage" 
                    fill="var(--color-percentage)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              )}
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentPerformanceChart;
