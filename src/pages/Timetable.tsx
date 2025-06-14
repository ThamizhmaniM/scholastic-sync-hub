
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import TimetableView from "@/components/timetable/TimetableView";
import { getStudents } from "@/lib/supabase";
import { Group, Timetable as TimetableType, Student } from "@/types";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DAYS, TIME_SLOTS } from "@/lib/mock-data";

const Timetable = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [timetables, setTimetables] = useState<Map<string, TimetableType>>(new Map());
  const [activeTab, setActiveTab] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroupsFromDatabase();
  }, []);

  const loadGroupsFromDatabase = async () => {
    try {
      setLoading(true);
      const students = await getStudents();
      const generatedGroups = generateGroupsFromStudents(students);
      setGroups(generatedGroups);

      // Generate timetables for each group
      const timetableMap = new Map<string, TimetableType>();
      generatedGroups.forEach(group => {
        timetableMap.set(group.id, generateTimetable(group));
      });
      
      setTimetables(timetableMap);
      
      // Set the first group as active by default
      if (generatedGroups.length > 0) {
        setActiveTab(generatedGroups[0].id);
      }
    } catch (error) {
      console.error('Error loading groups for timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateGroupsFromStudents = (students: Student[]): Group[] => {
    const groupMap: Map<string, Group> = new Map();

    students.forEach((student) => {
      // Create a unique key based on class and subjects
      const key = `${student.class}-${student.subjects.sort().join("-")}`;
      
      if (!groupMap.has(key)) {
        // Generate a descriptive name based on subjects
        let groupName = `Class ${student.class} - `;
        
        if (student.subjects.includes("Mathematics") && 
            student.subjects.includes("Physics") && 
            student.subjects.includes("Chemistry")) {
          if (student.subjects.includes("Biology")) {
            groupName += "PCB";
          } else if (student.subjects.includes("Computer Science")) {
            groupName += "CS";
          } else {
            groupName += "PCM";
          }
        } else {
          // For other combinations, use first letters
          groupName += student.subjects.map(s => s[0]).join("");
        }

        groupMap.set(key, {
          id: `group-${key}`,
          name: groupName,
          class: student.class,
          subjects: [...student.subjects],
          students: [],
        });
      }

      // Add student to the appropriate group
      groupMap.get(key)?.students.push(student);
    });

    return Array.from(groupMap.values());
  };

  const generateTimetable = (group: Group): TimetableType => {
    const timetable: TimetableType = {
      groupId: group.id,
      slots: [],
    };

    // Shuffle subjects for variety
    const shuffledSubjects = [...group.subjects].sort(() => Math.random() - 0.5);
    let subjectIndex = 0;

    // For each day
    DAYS.forEach((day) => {
      // For each time slot
      TIME_SLOTS.forEach((timeSlot) => {
        // Assign a subject, ensuring no subject repeats on consecutive days
        const subject = shuffledSubjects[subjectIndex % shuffledSubjects.length];
        subjectIndex++;

        timetable.slots.push({
          day,
          startTime: timeSlot.start,
          endTime: timeSlot.end,
          subject,
        });
      });
    });

    return timetable;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading timetables...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Timetable</h1>
        
        {groups.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No groups available to generate timetables. Add students to see timetables.</p>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              {groups.map(group => (
                <TabsTrigger key={group.id} value={group.id}>
                  {group.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {groups.map(group => (
              <TabsContent key={group.id} value={group.id}>
                {timetables.has(group.id) ? (
                  <TimetableView
                    group={group}
                    timetable={timetables.get(group.id)!}
                  />
                ) : (
                  <p className="text-muted-foreground">No timetable available for this group.</p>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default Timetable;
