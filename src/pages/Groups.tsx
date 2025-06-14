
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import GroupCard from "@/components/groups/GroupCard";
import GroupDetail from "@/components/groups/GroupDetail";
import { getStudents } from "@/lib/supabase";
import { Group, Student } from "@/types";

const Groups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
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

      // Select the first group by default if available
      if (generatedGroups.length > 0) {
        setSelectedGroup(generatedGroups[0]);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
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

  const handleGroupSelect = (group: Group) => {
    setSelectedGroup(group);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading groups...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Student Groups</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1">
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">All Groups</h2>
              <div className="space-y-3">
                {groups.length === 0 ? (
                  <p className="text-muted-foreground">No groups available. Add students to see groups.</p>
                ) : (
                  groups.map((group) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      onSelect={handleGroupSelect}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
          
          <div className="col-span-1 md:col-span-2">
            {selectedGroup ? (
              <GroupDetail group={selectedGroup} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Select a group to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Groups;
