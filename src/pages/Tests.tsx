
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import TestSchedule from "@/components/tests/TestSchedule";
import { getStudents } from "@/lib/supabase";
import { Group, Test, Student } from "@/types";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TIME_SLOTS } from "@/lib/mock-data";

const Tests = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
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
      
      // Generate tests for all groups
      const allTests = generateWeekendTests(generatedGroups);
      setTests(allTests);
      
      // Set the first group as active by default
      if (generatedGroups.length > 0) {
        setActiveTab(generatedGroups[0].id);
      }
    } catch (error) {
      console.error('Error loading groups for tests:', error);
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

  const generateWeekendTests = (groups: Group[]): Test[] => {
    const tests: Test[] = [];
    const weekends = ["Saturday", "Sunday"];
    
    groups.forEach((group) => {
      group.subjects.forEach((subject, index) => {
        const day = weekends[index % 2]; // Alternate between Saturday and Sunday
        const timeSlot = TIME_SLOTS[Math.floor(index / 2) % TIME_SLOTS.length];
        
        tests.push({
          id: `test-${group.id}-${subject}-${index}`,
          groupId: group.id,
          subject,
          date: `2023-07-${day === "Saturday" ? "15" : "16"}`, // Just example dates
          startTime: timeSlot.start,
          endTime: timeSlot.end,
        });
      });
    });

    return tests;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading test schedules...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Weekend Test Schedule</h1>
        
        {groups.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No groups available to schedule tests. Add students to see test schedules.</p>
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
                <TestSchedule
                  group={group}
                  tests={tests}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default Tests;
