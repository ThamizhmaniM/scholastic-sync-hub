
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import TestSchedule from "@/components/tests/TestSchedule";
import { generateGroups, generateWeekendTests } from "@/lib/mock-data";
import { Group, Test } from "@/types";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Tests = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");

  useEffect(() => {
    // Get all groups
    const allGroups = generateGroups();
    setGroups(allGroups);
    
    // Generate tests for all groups
    const allTests = generateWeekendTests(allGroups);
    setTests(allTests);
    
    // Set the first group as active by default
    if (allGroups.length > 0) {
      setActiveTab(allGroups[0].id);
    }
  }, []);

  return (
    <Layout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Weekend Test Schedule</h1>
        
        {groups.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No groups available to schedule tests.</p>
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
