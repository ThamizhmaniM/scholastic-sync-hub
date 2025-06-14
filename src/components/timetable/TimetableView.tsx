
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Group, Timetable } from "@/types";
import { DAYS, TIME_SLOTS } from "@/lib/mock-data";

interface TimetableProps {
  group: Group;
  timetable: Timetable;
}

export const TimetableView = ({ group, timetable }: TimetableProps) => {
  // Build a map for easy lookup of subjects for specific day and time slot
  const slotMap = new Map<string, string>();
  timetable.slots.forEach(slot => {
    const key = `${slot.day}-${slot.startTime}`;
    slotMap.set(key, slot.subject);
  });

  // Get a subject for a specific day and time slot
  const getSubjectForSlot = (day: string, startTime: string): string => {
    const key = `${day}-${startTime}`;
    return slotMap.get(key) || "No Class";
  };

  // Get a color based on the subject name (for visual distinction)
  const getColorForSubject = (subject: string): string => {
    const colors: Record<string, string> = {
      "Mathematics": "bg-blue-100 text-blue-800",
      "Physics": "bg-purple-100 text-purple-800",
      "Chemistry": "bg-green-100 text-green-800",
      "Biology": "bg-yellow-100 text-yellow-800",
      "Computer Science": "bg-red-100 text-red-800",
      "English": "bg-indigo-100 text-indigo-800",
    };
    
    return colors[subject] || "bg-gray-100 text-gray-800";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timetable for {group.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 bg-muted font-medium">Time/Day</th>
                {DAYS.map(day => (
                  <th key={day} className="border p-2 bg-muted font-medium">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map(timeSlot => (
                <tr key={timeSlot.start}>
                  <td className="border p-2 font-medium text-sm">
                    {timeSlot.start} - {timeSlot.end}
                  </td>
                  {DAYS.map(day => {
                    const subject = getSubjectForSlot(day, timeSlot.start);
                    return (
                      <td key={`${day}-${timeSlot.start}`} className="border p-2">
                        <div
                          className={`rounded p-2 text-sm ${getColorForSubject(subject)}`}
                        >
                          {subject}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimetableView;
