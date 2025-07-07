import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Student, Profile } from "@/types";
import { MessageCircle, FileText, Send, ArrowUpDown } from "lucide-react";
import { generateWhatsAppMessage, openWhatsApp, sendPDFViaWhatsApp } from "@/utils/whatsappUtils";
import { exportStudentSummaryToPDF, generateStudentSummaryPDFBlob } from "@/utils/exportUtils";
import { getAttendanceSummaryFromDb, getWeeklyTestMarks, getAttendanceRecords, getProfiles } from "@/lib/supabase";
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
  const [loading, setLoading] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<Profile[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'class' | 'staff'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Load staff profiles
  useEffect(() => {
    const loadStaff = async () => {
      const profiles = await getProfiles();
      setStaffList(profiles);
    };
    loadStaff();
  }, []);

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
      setLoading(`whatsapp-${student.id}`);
      
      // Get attendance summary
      const attendanceSummary = await getAttendanceSummaryFromDb(student.id);
      const studentAttendance = attendanceSummary.find(a => a.studentId === student.id);
      
      // Get recent test marks
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
    } finally {
      setLoading(null);
    }
  };

  const handleGeneratePDF = async (student: Student) => {
    try {
      setLoading(`pdf-${student.id}`);
      
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
        description: `Enhanced PDF report generated for ${student.name}`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleSendPDFWhatsApp = async (student: Student) => {
    if (!student.parent_phone) {
      toast({
        title: "Error",
        description: "Parent phone number not available for this student",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(`pdf-whatsapp-${student.id}`);
      
      toast({
        title: "Preparing PDF",
        description: "Generating PDF and sending via WhatsApp...",
      });

      // Get attendance records and marks
      const attendanceRecords = await getAttendanceRecords();
      const allMarks = await getWeeklyTestMarks(student.id);
      
      // Generate PDF blob
      const pdfBlob = await generateStudentSummaryPDFBlob(
        student,
        attendanceRecords,
        allMarks,
        `Academic Year ${new Date().getFullYear()}`
      );
      
      const fileName = `${student.name.replace(/\s+/g, '_')}_Academic_Report.pdf`;
      
      // Send PDF via WhatsApp
      const result = await sendPDFViaWhatsApp(
        student.parent_phone,
        pdfBlob,
        student.name,
        fileName
      );
      
      if (result.success) {
        toast({
          title: "Success",
          description: `PDF report sent to ${student.name}'s parent via WhatsApp`,
        });
      } else {
        throw new Error(result.error || "Failed to send PDF");
      }
      
    } catch (error) {
      console.error('Error sending PDF via WhatsApp:', error);
      toast({
        title: "Error",
        description: "Failed to send PDF via WhatsApp",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  // Get staff name by ID
  const getStaffName = (staffId?: string) => {
    if (!staffId) return 'Not assigned';
    const staff = staffList.find(s => s.id === staffId);
    return staff?.full_name || staff?.email || 'Unknown';
  };

  // Sort students
  const sortedStudents = [...students].sort((a, b) => {
    let aValue: string;
    let bValue: string;

    switch (sortBy) {
      case 'name':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'class':
        aValue = a.class;
        bValue = b.class;
        break;
      case 'staff':
        aValue = getStaffName(a.user_id);
        bValue = getStaffName(b.user_id);
        break;
      default:
        return 0;
    }

    const comparison = aValue.localeCompare(bValue);
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (newSortBy: 'name' | 'class' | 'staff') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Sort Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Sort by:</span>
            <Select value={sortBy} onValueChange={(value: 'name' | 'class' | 'staff') => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="class">Class</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortOrder === 'asc' ? 'Asc' : 'Desc'}
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50" 
                  onClick={() => handleSort('name')}
                >
                  Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50" 
                  onClick={() => handleSort('class')}
                >
                  Class {sortBy === 'class' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Parent Phone</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50" 
                  onClick={() => handleSort('staff')}
                >
                  Assigned Staff {sortBy === 'staff' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                sortedStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>Class {student.class}</TableCell>
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
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {getStaffName(student.user_id)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendWhatsApp(student)}
                          disabled={!student.parent_phone || loading === `whatsapp-${student.id}`}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Send WhatsApp Summary"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGeneratePDF(student)}
                          disabled={loading === `pdf-${student.id}`}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Generate PDF Summary"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendPDFWhatsApp(student)}
                          disabled={!student.parent_phone || loading === `pdf-whatsapp-${student.id}`}
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          title="Send PDF via WhatsApp"
                        >
                          <Send className="h-4 w-4" />
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
      </div>

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