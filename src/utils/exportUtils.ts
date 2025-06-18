
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { Student, AttendanceRecord } from '@/types';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const exportAttendanceToPDF = (
  attendanceRecords: AttendanceRecord[],
  students: Student[],
  month?: string,
  year?: string
) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text('Attendance Report', 14, 22);
  
  // Add date range if provided
  if (month && year) {
    doc.setFontSize(12);
    doc.text(`Month: ${month} ${year}`, 14, 32);
  }
  
  // Prepare data for table
  const tableData = attendanceRecords.map(record => {
    const student = students.find(s => s.id === record.studentId);
    return [
      student?.name || 'Unknown',
      student?.class || 'N/A',
      format(new Date(record.date), 'dd/MM/yyyy'),
      record.status.charAt(0).toUpperCase() + record.status.slice(1)
    ];
  });
  
  // Add table using autoTable
  autoTable(doc, {
    head: [['Student Name', 'Class', 'Date', 'Status']],
    body: tableData,
    startY: month && year ? 40 : 30,
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });
  
  // Add summary statistics
  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
  const totalRecords = attendanceRecords.length;
  
  const finalY = (doc as any).lastAutoTable.finalY || 60;
  doc.setFontSize(12);
  doc.text('Summary:', 14, finalY + 20);
  doc.setFontSize(10);
  doc.text(`Total Records: ${totalRecords}`, 14, finalY + 30);
  doc.text(`Present: ${presentCount}`, 14, finalY + 40);
  doc.text(`Absent: ${absentCount}`, 14, finalY + 50);
  
  // Save the PDF
  const fileName = `attendance_report_${month || 'all'}_${year || new Date().getFullYear()}.pdf`;
  doc.save(fileName);
};

export const exportAttendanceToExcel = (
  attendanceRecords: AttendanceRecord[],
  students: Student[],
  month?: string,
  year?: string
) => {
  // Prepare data for Excel
  const data = attendanceRecords.map(record => {
    const student = students.find(s => s.id === record.studentId);
    return {
      'Student Name': student?.name || 'Unknown',
      'Class': student?.class || 'N/A',
      'Date': format(new Date(record.date), 'dd/MM/yyyy'),
      'Status': record.status.charAt(0).toUpperCase() + record.status.slice(1),
    };
  });
  
  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
  
  // Save the Excel file
  const fileName = `attendance_report_${month || 'all'}_${year || new Date().getFullYear()}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

export const exportWeeklyMarksToPDF = (
  marks: any[],
  students: Student[],
  filters?: any
) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text('Weekly Test Marks Report', 14, 22);
  
  // Add filters info if provided
  let startY = 30;
  if (filters) {
    doc.setFontSize(12);
    if (filters.subject) {
      doc.text(`Subject: ${filters.subject}`, 14, startY);
      startY += 10;
    }
    if (filters.weekNumber) {
      doc.text(`Week: ${filters.weekNumber}`, 14, startY);
      startY += 10;
    }
    if (filters.year) {
      doc.text(`Year: ${filters.year}`, 14, startY);
      startY += 10;
    }
  }
  
  // Prepare data for table
  const tableData = marks.map(mark => {
    const student = students.find(s => s.id === mark.student_id);
    const percentage = ((mark.marks_obtained / mark.total_marks) * 100).toFixed(1);
    return [
      student?.name || 'Unknown',
      mark.subject,
      `W${mark.week_number}`,
      mark.year.toString(),
      `${mark.marks_obtained}/${mark.total_marks}`,
      `${percentage}%`,
      format(new Date(mark.test_date), 'dd/MM/yyyy'),
    ];
  });
  
  // Add table using autoTable
  autoTable(doc, {
    head: [['Student', 'Subject', 'Week', 'Year', 'Marks', 'Percentage', 'Test Date']],
    body: tableData,
    startY: startY + 10,
    styles: {
      fontSize: 9,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });
  
  // Add summary statistics
  const averagePercentage = marks.length > 0 
    ? (marks.reduce((sum, mark) => sum + (mark.marks_obtained / mark.total_marks * 100), 0) / marks.length).toFixed(1)
    : '0';
  
  const finalY = (doc as any).lastAutoTable.finalY || 60;
  doc.setFontSize(12);
  doc.text('Summary:', 14, finalY + 20);
  doc.setFontSize(10);
  doc.text(`Total Tests: ${marks.length}`, 14, finalY + 30);
  doc.text(`Average Percentage: ${averagePercentage}%`, 14, finalY + 40);
  
  // Save the PDF
  const fileName = `weekly_marks_report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export const exportWeeklyMarksToExcel = (
  marks: any[],
  students: Student[],
  filters?: any
) => {
  // Prepare data for Excel
  const data = marks.map(mark => {
    const student = students.find(s => s.id === mark.student_id);
    const percentage = ((mark.marks_obtained / mark.total_marks) * 100).toFixed(1);
    return {
      'Student Name': student?.name || 'Unknown',
      'Subject': mark.subject,
      'Week Number': mark.week_number,
      'Year': mark.year,
      'Marks Obtained': mark.marks_obtained,
      'Total Marks': mark.total_marks,
      'Percentage': `${percentage}%`,
      'Test Date': format(new Date(mark.test_date), 'dd/MM/yyyy'),
      'Remarks': mark.remarks || '',
    };
  });
  
  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Weekly Marks');
  
  // Save the Excel file
  const fileName = `weekly_marks_report_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
