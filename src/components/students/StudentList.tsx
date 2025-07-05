
import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Student } from "@/types";
import { MessageCircle, FileText } from "lucide-react";
import { generateWhatsAppMessage, openWhatsApp } from "@/utils/whatsappUtils";
import { exportStudentSummaryToPDF } from "@/utils/exportUtils";
import { getAttendanceSummaryFromDb, getWeeklyTestMarks, getAttendanceRecords } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface StudentListProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (studentId: string) => void;
}

export const StudentList = ({ students, onEdit, onDelete }: StudentListProps) => {
  const { toast } = useToast();
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; student: Student | null }>({
    open: false,
    student: null,
  });

  const handleDeleteClick = (student: Student) => {
    setDeleteDialog({ open: true, student });
  };

  const handleConfirmDelete = () => {
    if (deleteDialog.student) {
      onDelete(deleteDialog.student.id);
      setDeleteDialog({ open: false, student: null });
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialog({ open: false, student: null });
  };

  const handleSendWhatsApp = async (student: Student) => {
    if (!student.parent_phone) {
      toast({
        title: "Error",
        description: "Parent phone number not available for this student",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get attendance summary
      const attendanceSummary = await getAttendanceSummaryFromDb(student.id);
      const studentAttendance = attendanceSummary.find(a => a.studentId === student.id);
      
      // Get recent test marks (last 5 marks)
      const allMarks = await getWeeklyTestMarks(student.id);
      const recentMarks = allMarks.slice(0, 5);
      
      // Generate WhatsApp message
      const message = generateWhatsAppMessage(
        student,
        studentAttendance || { totalDays: 0, presentDays: 0, percentage: 0 },
        recentMarks
      );
      
      // Open WhatsApp
      openWhatsApp(student.parent_phone, message);
      
      toast({
        title: "Success",
        description: `WhatsApp opened with ${student.name}'s progress report`,
      });
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      toast({
        title: "Error",
        description: "Failed to generate progress report",
        variant: "destructive",
      });
    }
  };

  const handleGeneratePDF = async (student: Student) => {
    try {
      toast({
        title: "Generating PDF",
        description: "Please wait while we generate the student summary...",
      });

      // Get attendance records
      const attendanceRecords = await getAttendanceRecords();
      
      // Get all test marks for the student
      const allMarks = await getWeeklyTestMarks(student.id);
      
      // Generate and download PDF
      exportStudentSummaryToPDF(
        student,
        attendanceRecords,
        allMarks,
        `Academic Year ${new Date().getFullYear()}`
      );
      
      toast({
        title: "Success",
        description: `PDF report generated for ${student.name}`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Parent Phone</TableHead>
              <TableHead>Subjects</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No students found
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.class}</TableCell>
                  <TableCell className="capitalize">{student.gender}</TableCell>
                  <TableCell>{student.parent_phone || "Not provided"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {student.subjects.map((subject) => (
                        <span
                          key={subject}
                          className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSendWhatsApp(student)}
                        disabled={!student.parent_phone}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        title="Send WhatsApp Summary"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleGeneratePDF(student)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Generate PDF Summary"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(student)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteClick(student)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && handleCancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.student?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default StudentList;
