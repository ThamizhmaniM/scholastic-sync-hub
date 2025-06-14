
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import TimetableView from "@/components/timetable/TimetableView";
import { generateGroups, generateTimetable } from "@/lib/mock-data";
import { Group, Timetable as TimetableType } from "@/types";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Timetable = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [timetables, setTimetables] = useState<Map<string, TimetableType>>(new Map());
  const [activeTab, setActiveTab] = useState<string>("");

  useEffect(() => {
    // Get all groups
    const allGroups = generateGroups();
    setGroups(allGroups);

    // Generate timetables for each group
    const timetableMap = new Map<string, TimetableType>();
    allGroups.forEach(group => {
      timetableMap.set(group.id, generateTimetable(group));
    });
    
    setTimetables(timetableMap);
    
    // Set the first group as active by default
    if (allGroups.length > 0) {
      setActiveTab(allGroups[0].id);
    }
  }, []);

  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Timetable</h1>
        
        {groups.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No groups available to generate timetables.</p>
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
