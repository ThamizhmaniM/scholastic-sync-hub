
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Group, Test } from "@/types";

interface TestScheduleProps {
  group: Group;
  tests: Test[];
}

export const TestSchedule = ({ group, tests }: TestScheduleProps) => {
  // Filter tests for this group
  const groupTests = tests.filter(test => test.groupId === group.id);

  // Format date for display
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Schedule for {group.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {groupTests.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No tests scheduled for this group.</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupTests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-medium">{test.subject}</TableCell>
                    <TableCell>{formatDate(test.date)}</TableCell>
                    <TableCell>{test.startTime} - {test.endTime}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestSchedule;
