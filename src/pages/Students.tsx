import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import StudentList from "@/components/students/StudentList";
import StudentForm from "@/components/students/StudentForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { 
  getStudents, 
  createStudent, 
  updateStudentInDb, 
  deleteStudentFromDb 
} from "@/lib/supabase";
import { Student } from "@/types";
import { toast } from "sonner";
import { CLASSES } from "@/lib/mock-data";

const Students = () => {
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const students = await getStudents();
      setStudentList(students);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingStudent(undefined);
    setIsFormOpen(true);
  };

  const handleEditClick = (student: Student) => {
    setEditingStudent(student);
    setIsFormOpen(true);
  };

  const handleDeleteClick = async (studentId: string) => {
    try {
      const success = await deleteStudentFromDb(studentId);
      if (success) {
        setStudentList(prev => prev.filter(s => s.id !== studentId));
        toast.success("Student deleted successfully");
      } else {
        toast.error("Failed to delete student");
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error("Failed to delete student");
    }
  };

  const handleFormSubmit = async (studentData: Omit<Student, "id">) => {
    try {
      if (editingStudent) {
        // Update existing student
        const updatedStudent = await updateStudentInDb({
          ...studentData,
          id: editingStudent.id,
        });
        
        if (updatedStudent) {
          setStudentList(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
          toast.success("Student updated successfully");
        } else {
          toast.error("Failed to update student");
        }
      } else {
        // Add new student
        const newStudent = await createStudent(studentData);
        if (newStudent) {
          setStudentList(prev => [...prev, newStudent]);
          toast.success("Student added successfully");
        } else {
          toast.error("Failed to add student");
        }
      }
      
      setIsFormOpen(false);
      setEditingStudent(undefined);
    } catch (error) {
      console.error('Error saving student:', error);
      toast.error("Failed to save student");
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingStudent(undefined);
  };

  const filteredStudents = studentList.filter((student) => {
    const matchesClass = selectedClass === "all" || student.class === selectedClass;
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading students...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Students</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {CLASSES.map((c) => (
                  <SelectItem key={c} value={c}>
                    Class {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddClick}>
              Add Student
            </Button>
          </div>
        </div>

        <StudentList
          students={filteredStudents}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />

        {/* Student Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingStudent ? "Edit Student" : "Add New Student"}
              </DialogTitle>
              <DialogDescription>
                Please fill in the details for the student.
              </DialogDescription>
            </DialogHeader>
            <StudentForm
              student={editingStudent}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Students;
