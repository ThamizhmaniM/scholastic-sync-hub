
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
      // Create a unique key based on class
      const key = student.class;
      
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          id: `group-class-${student.class}`,
          name: `Class ${student.class}`,
          class: student.class,
          subjects: [],
          students: [],
        });
      }

      const group = groupMap.get(key)!;
      group.students.push(student);
    });

    // After grouping, collect all unique subjects for each group
    groupMap.forEach(group => {
      const subjects = new Set<string>();
      group.students.forEach(s => {
        s.subjects.forEach(sub => subjects.add(sub));
      });
      group.subjects = Array.from(subjects);
    });


    return Array.from(groupMap.values());
  };

  const generateTimetable = (group: Group): TimetableType => {
    const timetable: TimetableType = {
      groupId: group.id,
      slots: [],
    };

    const studentCount = group.students.length;
    if (studentCount === 0) {
      return timetable;
    }

    const subjectCounts = new Map<string, number>();
    group.subjects.forEach(s => subjectCounts.set(s, 0));

    group.students.forEach(student => {
      student.subjects.forEach(subject => {
        if (subjectCounts.has(subject)) {
          subjectCounts.set(subject, subjectCounts.get(subject)! + 1);
        }
      });
    });

    const coreSubjects: string[] = [];
    const optionalSubjects: string[] = [];
    subjectCounts.forEach((count, subject) => {
      // A subject is core if all students in the group take it
      if (count === studentCount) {
        coreSubjects.push(subject);
      } else {
        optionalSubjects.push(subject);
      }
    });

    const scheduledItems: string[] = [...coreSubjects];
    // Pair up optional subjects
    for (let i = 0; i < optionalSubjects.length; i += 2) {
      if (i + 1 < optionalSubjects.length) {
        scheduledItems.push(`${optionalSubjects[i]} / ${optionalSubjects[i + 1]}`);
      } else {
        scheduledItems.push(optionalSubjects[i]);
      }
    }
    
    const shuffledItems = scheduledItems.sort(() => Math.random() - 0.5);
    let itemIndex = 0;

    DAYS.forEach((day) => {
      TIME_SLOTS.forEach((timeSlot) => {
        const subject = shuffledItems.length > 0 
          ? shuffledItems[itemIndex % shuffledItems.length]
          : "Free Slot";
        itemIndex++;

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
