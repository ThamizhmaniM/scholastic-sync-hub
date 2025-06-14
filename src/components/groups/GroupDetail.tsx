
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Group } from "@/types";

interface GroupDetailProps {
  group: Group;
}

export const GroupDetail = ({ group }: GroupDetailProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{group.name} Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Group Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Class:</div>
              <div>{group.class}</div>
              <div className="text-muted-foreground">Subjects:</div>
              <div>{group.subjects.join(", ")}</div>
              <div className="text-muted-foreground">Total Students:</div>
              <div>{group.students.length}</div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Students in this Group</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.class}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupDetail;
