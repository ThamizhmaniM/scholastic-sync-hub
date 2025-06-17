
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Student, WeeklyTestMark } from "@/types";
import { TrendingUp, BarChart3 } from "lucide-react";

interface StudentPerformanceChartProps {
  students: Student[];
  marks: any[];
}

const StudentPerformanceChart = ({ students, marks }: StudentPerformanceChartProps) => {
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("_all_");
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [chartType, setChartType] = useState<"line" | "bar" | "area">("line");
  const [chartData, setChartData] = useState<any[]>([]);

  const chartConfig = {
    percentage: {
      label: "Percentage",
      color: "#3b82f6",
    },
    marks: {
      label: "Marks Obtained",
      color: "#10b981",
    },
    total: {
      label: "Total Marks",
      color: "#f59e0b",
    },
  };

  useEffect(() => {
    if (selectedStudent) {
      const studentAllMarks = marks.filter(
        (mark) => mark.student_id === selectedStudent
      );
      const subjects = [
        ...new Set(studentAllMarks.map((mark) => mark.subject).filter(Boolean)),
      ];
      setAvailableSubjects(subjects as string[]);
    } else {
      setAvailableSubjects([]);
    }
  }, [selectedStudent, marks]);

  useEffect(() => {
    if (selectedStudent && marks.length > 0) {
      let studentMarks = marks
        .filter(mark => mark.student_id === selectedStudent);
      
      if (selectedSubject && selectedSubject !== '_all_') {
        studentMarks = studentMarks.filter(mark => mark.subject === selectedSubject);
      }
      
      const processedData = studentMarks
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

      setChartData(processedData);
    } else {
      setChartData([]);
    }
  }, [selectedStudent, selectedSubject, marks]);

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

  const renderChart = () => {
    if (chartType === "line") {
      return (
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
          <XAxis 
            dataKey="week" 
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={{ stroke: "#94a3b8" }}
            tickLine={{ stroke: "#94a3b8" }}
          />
          <YAxis 
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={{ stroke: "#94a3b8" }}
            tickLine={{ stroke: "#94a3b8" }}
            label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b' } }}
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
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ 
              fill: "#3b82f6", 
              strokeWidth: 2, 
              r: 6,
              stroke: "#ffffff"
            }}
            activeDot={{ 
              r: 8, 
              fill: "#1d4ed8",
              stroke: "#ffffff",
              strokeWidth: 2
            }}
          />
        </LineChart>
      );
    } else if (chartType === "area") {
      return (
        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
          <XAxis 
            dataKey="week" 
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={{ stroke: "#94a3b8" }}
            tickLine={{ stroke: "#94a3b8" }}
          />
          <YAxis 
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={{ stroke: "#94a3b8" }}
            tickLine={{ stroke: "#94a3b8" }}
            label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b' } }}
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
          <Area 
            type="monotone" 
            dataKey="percentage" 
            stroke="#3b82f6"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorPercentage)"
          />
        </AreaChart>
      );
    } else {
      return (
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
              <stop offset="95%" stopColor="#059669" stopOpacity={0.7}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
          <XAxis 
            dataKey="week" 
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={{ stroke: "#94a3b8" }}
            tickLine={{ stroke: "#94a3b8" }}
          />
          <YAxis 
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: "#64748b" }}
            axisLine={{ stroke: "#94a3b8" }}
            tickLine={{ stroke: "#94a3b8" }}
            label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b' } }}
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
            fill="url(#colorBar)"
            radius={[6, 6, 0, 0]}
            stroke="#10b981"
            strokeWidth={1}
          />
        </BarChart>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Select Student</label>
          <Select value={selectedStudent} onValueChange={(value) => {
            setSelectedStudent(value);
            setSelectedSubject("_all_");
          }}>
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
          <label className="text-sm font-medium mb-2 block">Select Subject</label>
          <Select 
            value={selectedSubject} 
            onValueChange={setSelectedSubject}
            disabled={!selectedStudent || availableSubjects.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all_">All Subjects</SelectItem>
              {availableSubjects.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Chart Type</label>
          <Select value={chartType} onValueChange={(value: "line" | "bar" | "area") => setChartType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="area">Area Chart</SelectItem>
              <SelectItem value="bar">Bar Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Performance Summary */}
      {selectedStudent && chartData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Average Performance</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{averagePerformance}%</div>
              <p className="text-xs text-blue-700">
                Based on {chartData.length} test{chartData.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br border-2 ${
            trend.trend === 'up' 
              ? 'from-green-50 to-green-100 border-green-200' 
              : trend.trend === 'down' 
                ? 'from-red-50 to-red-100 border-red-200'
                : 'from-gray-50 to-gray-100 border-gray-200'
          }`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${
                trend.trend === 'up' ? 'text-green-800' : 
                trend.trend === 'down' ? 'text-red-800' : 'text-gray-800'
              }`}>Recent Trend</CardTitle>
              <TrendingUp className={`h-4 w-4 ${
                trend.trend === 'up' ? 'text-green-600' : 
                trend.trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                trend.trend === 'up' ? 'text-green-900' : 
                trend.trend === 'down' ? 'text-red-900' : 
                'text-gray-900'
              }`}>
                {trend.trend === 'up' ? '↗' : trend.trend === 'down' ? '↘' : '→'}
              </div>
              <p className={`text-xs ${
                trend.trend === 'up' ? 'text-green-700' : 
                trend.trend === 'down' ? 'text-red-700' : 'text-gray-700'
              }`}>
                {trend.change > 0 ? `${trend.change}% change` : 'Stable performance'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Total Tests</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{chartData.length}</div>
              <p className="text-xs text-purple-700">
                Tests completed
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
          <CardTitle className="text-white">
            {selectedStudent 
              ? `Performance Analysis - ${getStudentName(selectedStudent)}${selectedSubject && selectedSubject !== '_all_' ? ` - ${selectedSubject}` : ''}`
              : "Select a student to view performance analysis"
            }
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {!selectedStudent ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Please select a student to view their performance chart</p>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No test data available for this student</p>
              </div>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-96">
              {renderChart()}
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentPerformanceChart;
