
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Group } from "@/types";

interface GroupCardProps {
  group: Group;
  onSelect?: (group: Group) => void;
}

export const GroupCard = ({ group, onSelect }: GroupCardProps) => {
  return (
    <Card 
      className="h-full cursor-pointer transition-all hover:shadow-md"
      onClick={() => onSelect?.(group)}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{group.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Students:</span>
            <span className="font-medium">{group.students.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subjects:</span>
            <span className="font-medium">{group.subjects.length}</span>
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-xs text-muted-foreground">Subjects:</p>
            <div className="flex flex-wrap gap-1">
              {group.subjects.map(subject => (
                <span
                  key={subject}
                  className="inline-flex items-center rounded-full bg-edu-light px-2 py-1 text-xs font-medium text-edu-dark"
                >
                  {subject}
                </span>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GroupCard;
