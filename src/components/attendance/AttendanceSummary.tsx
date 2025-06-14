
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { AttendanceSummary as Summary } from "@/types";

interface AttendanceSummaryProps {
  summaries: Summary[];
}

export const AttendanceSummaryComponent = ({ summaries }: AttendanceSummaryProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Attendance</TableHead>
                <TableHead className="text-right">Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map((summary) => (
                <TableRow key={summary.studentId}>
                  <TableCell className="font-medium">{summary.studentName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={summary.percentage} className="h-2" />
                      <span className="text-sm">
                        {summary.presentDays}/{summary.totalDays} days
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`font-medium ${
                        summary.percentage >= 75
                          ? "text-green-600"
                          : summary.percentage >= 60
                          ? "text-amber-600"
                          : "text-red-600"
                      }`}
                    >
                      {summary.percentage.toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceSummaryComponent;
