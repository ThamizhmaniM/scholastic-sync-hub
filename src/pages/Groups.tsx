
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import GroupCard from "@/components/groups/GroupCard";
import GroupDetail from "@/components/groups/GroupDetail";
import { generateGroups } from "@/lib/mock-data";
import { Group } from "@/types";

const Groups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  useEffect(() => {
    // Get all groups
    const allGroups = generateGroups();
    setGroups(allGroups);

    // Select the first group by default if available
    if (allGroups.length > 0) {
      setSelectedGroup(allGroups[0]);
    }
  }, []);

  const handleGroupSelect = (group: Group) => {
    setSelectedGroup(group);
  };

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
                  <p className="text-muted-foreground">No groups available.</p>
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
