
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import StudentList from "@/components/students/StudentList";
import StudentForm from "@/components/students/StudentForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { students, addStudent, updateStudent, deleteStudent } from "@/lib/mock-data";
import { Student } from "@/types";
import { toast } from "sonner";

const Students = () => {
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | undefined>(undefined);

  useEffect(() => {
    setStudentList([...students]);
  }, []);

  const handleAddClick = () => {
    setEditingStudent(undefined);
    setIsFormOpen(true);
  };

  const handleEditClick = (student: Student) => {
    setEditingStudent(student);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (studentId: string) => {
    deleteStudent(studentId);
    setStudentList(students.filter(s => s.id !== studentId));
    toast.success("Student deleted successfully");
  };

  const handleFormSubmit = (studentData: Omit<Student, "id">) => {
    if (editingStudent) {
      // Update existing student
      const updatedStudent = updateStudent({
        ...studentData,
        id: editingStudent.id,
      });
      
      setStudentList(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
      toast.success("Student updated successfully");
    } else {
      // Add new student
      const newStudent = addStudent(studentData);
      setStudentList(prev => [...prev, newStudent]);
      toast.success("Student added successfully");
    }
    
    setIsFormOpen(false);
    setEditingStudent(undefined);
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingStudent(undefined);
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Students</h1>
          <Button onClick={handleAddClick}>
            Add Student
          </Button>
        </div>

        <StudentList
          students={studentList}
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
