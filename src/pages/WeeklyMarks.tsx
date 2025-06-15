
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import WeeklyMarksForm from "@/components/marks/WeeklyMarksForm";
import WeeklyMarksList from "@/components/marks/WeeklyMarksList";
import { getStudents, getWeeklyTestMarks, createWeeklyTestMark, updateWeeklyTestMark, deleteWeeklyTestMark } from "@/lib/supabase";
import { Student, WeeklyTestMark } from "@/types";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const WeeklyMarks = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMark, setEditingMark] = useState<WeeklyTestMark | null>(null);
  const [filters, setFilters] = useState<any>({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadMarks();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const studentsData = await getStudents();
      setStudents(studentsData);
      await loadMarks();
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMarks = async () => {
    try {
      const marksData = await getWeeklyTestMarks(
        filters.studentId,
        filters.weekNumber,
        filters.year
      );
      
      // Apply subject filter on client side since it's not in the API function
      let filteredMarks = marksData;
      if (filters.subject) {
        filteredMarks = marksData.filter((mark: any) => mark.subject === filters.subject);
      }
      
      setMarks(filteredMarks);
    } catch (error) {
      console.error('Error loading marks:', error);
    }
  };

  const handleAddMark = async (markData: Omit<WeeklyTestMark, "id">) => {
    try {
      const newMark = await createWeeklyTestMark(markData);
      if (newMark) {
        await loadMarks();
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error adding mark:', error);
      throw error;
    }
  };

  const handleUpdateMark = async (markData: Omit<WeeklyTestMark, "id">) => {
    if (!editingMark) return;
    
    try {
      const updatedMark = await updateWeeklyTestMark({
        ...markData,
        id: editingMark.id,
      });
      if (updatedMark) {
        await loadMarks();
        setEditingMark(null);
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error updating mark:', error);
      throw error;
    }
  };

  const handleDeleteMark = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test mark?')) return;
    
    try {
      const success = await deleteWeeklyTestMark(id);
      if (success) {
        await loadMarks();
        toast({
          title: "Success",
          description: "Test mark deleted successfully",
        });
      }
    } catch (error) {
      console.error('Error deleting mark:', error);
      toast({
        title: "Error",
        description: "Failed to delete test mark",
        variant: "destructive",
      });
    }
  };

  const handleEditMark = (mark: WeeklyTestMark) => {
    setEditingMark(mark);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingMark(null);
    setShowForm(false);
  };

  const handleFilter = (newFilters: any) => {
    setFilters(newFilters);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Weekly Test Marks</h1>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {showForm ? 'Hide Form' : 'Add Marks'}
          </Button>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Students Found</h2>
            <p className="text-muted-foreground mb-4">
              You need to add students before you can record test marks.
            </p>
            <Button onClick={() => window.location.href = '/students'}>
              Add Students
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="view" value={showForm ? "add" : "view"}>
            <TabsList>
              <TabsTrigger value="view" onClick={() => setShowForm(false)}>View Marks</TabsTrigger>
              <TabsTrigger value="add" onClick={() => setShowForm(true)}>
                {editingMark ? 'Edit Marks' : 'Add Marks'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="view" className="mt-6">
              <WeeklyMarksList
                marks={marks}
                students={students}
                onEdit={handleEditMark}
                onDelete={handleDeleteMark}
                onFilter={handleFilter}
              />
            </TabsContent>

            <TabsContent value="add" className="mt-6">
              <WeeklyMarksForm
                students={students}
                onSubmit={editingMark ? handleUpdateMark : handleAddMark}
                initialData={editingMark || undefined}
                onCancel={handleCancelEdit}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default WeeklyMarks;
