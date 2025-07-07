import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
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

// New function: Export student grid-style attendance
export const exportAttendanceGridToPDF = (
  attendanceRecords: AttendanceRecord[],
  students: Student[],
  month: string,
  year: string
) => {
  const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
  
  // Add title
  doc.setFontSize(16);
  doc.text('Student Attendance Grid', 14, 15);
  doc.setFontSize(12);
  doc.text(`${month} ${year}`, 14, 25);
  
  // Get month days
  const monthStart = startOfMonth(new Date(`${year}-${month}-01`));
  const monthEnd = endOfMonth(monthStart);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Prepare headers
  const headers = ['Student', 'Class', ...monthDays.map(day => format(day, 'd'))];
  
  // Prepare data with attendance status tracking
  const tableData = students.map(student => {
    const row = [student.name, student.class];
    
    monthDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const record = attendanceRecords.find(r => r.studentId === student.id && r.date === dateStr);
      row.push(record ? (record.status === 'present' ? 'P' : 'A') : '-');
    });
    
    return row;
  });
  
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: 35,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
    },
    columnStyles: {
      0: { cellWidth: 40 }, // Student name
      1: { cellWidth: 20 }, // Class
    },
    didParseCell: function(data) {
      // Highlight absent dates in red
      if (data.section === 'body' && data.column.index >= 2 && data.cell.text[0] === 'A') {
        data.cell.styles.fillColor = [255, 204, 203]; // Light red background
        data.cell.styles.textColor = [139, 0, 0]; // Dark red text
      }
    }
  });
  
  doc.save(`attendance_grid_${month}_${year}.pdf`);
};

// New function: Export individual student attendance
export const exportIndividualStudentAttendanceToPDF = (
  attendanceRecords: AttendanceRecord[],
  student: Student,
  month?: string,
  year?: string
) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text(`Attendance Report - ${student.name}`, 14, 22);
  doc.setFontSize(12);
  doc.text(`Class: ${student.class}`, 14, 32);
  
  if (month && year) {
    doc.text(`Period: ${month} ${year}`, 14, 42);
  }
  
  // Filter records for this student
  const studentRecords = attendanceRecords.filter(r => r.studentId === student.id);
  
  // Prepare data
  const tableData = studentRecords.map(record => [
    format(new Date(record.date), 'dd/MM/yyyy'),
    format(new Date(record.date), 'EEEE'),
    record.status.charAt(0).toUpperCase() + record.status.slice(1)
  ]);
  
  autoTable(doc, {
    head: [['Date', 'Day', 'Status']],
    body: tableData,
    startY: month && year ? 50 : 40,
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
    },
  });
  
  // Add summary
  const presentCount = studentRecords.filter(r => r.status === 'present').length;
  const absentCount = studentRecords.filter(r => r.status === 'absent').length;
  const totalDays = studentRecords.length;
  const percentage = totalDays > 0 ? ((presentCount / totalDays) * 100).toFixed(1) : '0';
  
  const finalY = (doc as any).lastAutoTable.finalY || 60;
  doc.setFontSize(12);
  doc.text('Attendance Summary:', 14, finalY + 20);
  doc.setFontSize(10);
  doc.text(`Total Days: ${totalDays}`, 14, finalY + 30);
  doc.text(`Present: ${presentCount} days`, 14, finalY + 40);
  doc.text(`Absent: ${absentCount} days`, 14, finalY + 50);
  doc.text(`Attendance Percentage: ${percentage}%`, 14, finalY + 60);
  
  doc.save(`${student.name}_attendance_${month || 'all'}_${year || new Date().getFullYear()}.pdf`);
};

// New function: Export all students attendance summary
export const exportAttendanceSummaryToPDF = (
  attendanceRecords: AttendanceRecord[],
  students: Student[],
  month?: string,
  year?: string
) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text('Attendance Summary Report', 14, 22);
  
  if (month && year) {
    doc.setFontSize(12);
    doc.text(`Period: ${month} ${year}`, 14, 32);
  }
  
  // Calculate summary for each student
  const summaryData = students.map(student => {
    const studentRecords = attendanceRecords.filter(r => r.studentId === student.id);
    const presentCount = studentRecords.filter(r => r.status === 'present').length;
    const absentCount = studentRecords.filter(r => r.status === 'absent').length;
    const totalDays = studentRecords.length;
    const percentage = totalDays > 0 ? ((presentCount / totalDays) * 100).toFixed(1) : '0';
    
    return [
      student.name,
      student.class,
      totalDays.toString(),
      presentCount.toString(),
      absentCount.toString(),
      `${percentage}%`
    ];
  });
  
  autoTable(doc, {
    head: [['Student Name', 'Class', 'Total Days', 'Present', 'Absent', 'Percentage']],
    body: summaryData,
    startY: month && year ? 40 : 30,
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
    },
  });
  
  doc.save(`attendance_summary_${month || 'all'}_${year || new Date().getFullYear()}.pdf`);
};

// New function: Export individual student marks with analysis
export const exportIndividualStudentMarksToPDF = (
  marks: any[],
  student: Student,
  filters?: any
) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text(`Marks Report - ${student.name}`, 14, 22);
  doc.setFontSize(12);
  doc.text(`Class: ${student.class}`, 14, 32);
  
  // Filter marks for this student
  const studentMarks = marks.filter(mark => mark.student_id === student.id);
  
  // Prepare marks data
  const tableData = studentMarks.map(mark => {
    const percentage = ((mark.marks_obtained / mark.total_marks) * 100).toFixed(1);
    return [
      mark.subject,
      `W${mark.week_number}`,
      mark.year.toString(),
      `${mark.marks_obtained}/${mark.total_marks}`,
      `${percentage}%`,
      format(new Date(mark.test_date), 'dd/MM/yyyy'),
      mark.remarks || '-'
    ];
  });
  
  autoTable(doc, {
    head: [['Subject', 'Week', 'Year', 'Marks', 'Percentage', 'Date', 'Remarks']],
    body: tableData,
    startY: 40,
    styles: {
      fontSize: 9,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
    },
  });
  
  // Subject-wise analysis
  const finalY = (doc as any).lastAutoTable.finalY || 60;
  doc.setFontSize(14);
  doc.text('Subject-wise Analysis:', 14, finalY + 20);
  
  // Group marks by subject
  const subjectGroups = studentMarks.reduce((acc: any, mark) => {
    if (!acc[mark.subject]) {
      acc[mark.subject] = [];
    }
    acc[mark.subject].push(mark);
    return acc;
  }, {});
  
  let currentY = finalY + 35;
  Object.entries(subjectGroups).forEach(([subject, subjectMarks]: [string, any]) => {
    const avgPercentage = subjectMarks.reduce((sum: number, mark: any) => 
      sum + (mark.marks_obtained / mark.total_marks * 100), 0) / subjectMarks.length;
    
    const bestMark = subjectMarks.reduce((best: any, mark: any) => 
      (mark.marks_obtained / mark.total_marks) > (best.marks_obtained / best.total_marks) ? mark : best);
    
    const worstMark = subjectMarks.reduce((worst: any, mark: any) => 
      (mark.marks_obtained / mark.total_marks) < (worst.marks_obtained / worst.total_marks) ? mark : worst);
    
    doc.setFontSize(12);
    doc.text(`${subject}:`, 14, currentY);
    doc.setFontSize(10);
    doc.text(`  Tests Taken: ${subjectMarks.length}`, 14, currentY + 10);
    doc.text(`  Average: ${avgPercentage.toFixed(1)}%`, 14, currentY + 20);
    doc.text(`  Best: ${((bestMark.marks_obtained / bestMark.total_marks) * 100).toFixed(1)}% (Week ${bestMark.week_number})`, 14, currentY + 30);
    doc.text(`  Lowest: ${((worstMark.marks_obtained / worstMark.total_marks) * 100).toFixed(1)}% (Week ${worstMark.week_number})`, 14, currentY + 40);
    
    currentY += 55;
    
    // Add new page if needed
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
  });
  
  // Overall performance summary
  if (studentMarks.length > 0) {
    const overallAvg = studentMarks.reduce((sum, mark) => 
      sum + (mark.marks_obtained / mark.total_marks * 100), 0) / studentMarks.length;
    
    doc.setFontSize(12);
    doc.text('Overall Performance:', 14, currentY + 10);
    doc.setFontSize(10);
    doc.text(`Total Tests: ${studentMarks.length}`, 14, currentY + 20);
    doc.text(`Overall Average: ${overallAvg.toFixed(1)}%`, 14, currentY + 30);
    
    let grade = 'F';
    if (overallAvg >= 90) grade = 'A+';
    else if (overallAvg >= 80) grade = 'A';
    else if (overallAvg >= 70) grade = 'B+';
    else if (overallAvg >= 60) grade = 'B';
    else if (overallAvg >= 50) grade = 'C';
    else if (overallAvg >= 40) grade = 'D';
    
    doc.text(`Overall Grade: ${grade}`, 14, currentY + 40);
  }
  
  doc.save(`${student.name}_marks_analysis_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Excel versions of new functions
export const exportAttendanceGridToExcel = (
  attendanceRecords: AttendanceRecord[],
  students: Student[],
  month: string,
  year: string
) => {
  const monthStart = startOfMonth(new Date(`${year}-${month}-01`));
  const monthEnd = endOfMonth(monthStart);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Create data with proper structure
  const data: any[] = [];
  
  // Add header row
  const headerRow: any = {
    'Student Name': 'Student Name',
    'Class': 'Class'
  };
  monthDays.forEach(day => {
    headerRow[`Day_${format(day, 'd')}`] = format(day, 'd');
  });
  data.push(headerRow);
  
  // Add student data
  students.forEach(student => {
    const row: any = {
      'Student Name': student.name,
      'Class': student.class,
    };
    
    monthDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const record = attendanceRecords.find(r => r.studentId === student.id && r.date === dateStr);
      const status = record ? (record.status === 'present' ? 'P' : 'A') : '-';
      
      // Use a descriptive key and mark absent entries
      const dayKey = `Day_${format(day, 'd')}`;
      row[dayKey] = status === 'A' ? `🔴 A` : status; // Add red circle emoji for absent
    });
    
    data.push(row);
  });
  
  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data, { skipHeader: true });
  
  // Set column widths
  const cols = [
    { wch: 25 }, // Student Name
    { wch: 10 }, // Class
    ...monthDays.map(() => ({ wch: 5 })) // Day columns
  ];
  worksheet['!cols'] = cols;
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Grid');
  XLSX.writeFile(workbook, `attendance_grid_${month}_${year}.xlsx`);
};

export const exportIndividualStudentAttendanceToExcel = (
  attendanceRecords: AttendanceRecord[],
  student: Student,
  month?: string,
  year?: string
) => {
  const studentRecords = attendanceRecords.filter(r => r.studentId === student.id);
  
  const data = studentRecords.map(record => ({
    'Date': format(new Date(record.date), 'dd/MM/yyyy'),
    'Day': format(new Date(record.date), 'EEEE'),
    'Status': record.status.charAt(0).toUpperCase() + record.status.slice(1),
  }));
  
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
  XLSX.writeFile(workbook, `${student.name}_attendance_${month || 'all'}_${year || new Date().getFullYear()}.xlsx`);
};

export const exportAttendanceSummaryToExcel = (
  attendanceRecords: AttendanceRecord[],
  students: Student[],
  month?: string,
  year?: string
) => {
  const data = students.map(student => {
    const studentRecords = attendanceRecords.filter(r => r.studentId === student.id);
    const presentCount = studentRecords.filter(r => r.status === 'present').length;
    const absentCount = studentRecords.filter(r => r.status === 'absent').length;
    const totalDays = studentRecords.length;
    const percentage = totalDays > 0 ? ((presentCount / totalDays) * 100).toFixed(1) : '0';
    
    return {
      'Student Name': student.name,
      'Class': student.class,
      'Total Days': totalDays,
      'Present': presentCount,
      'Absent': absentCount,
      'Percentage': `${percentage}%`,
    };
  });
  
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Summary');
  XLSX.writeFile(workbook, `attendance_summary_${month || 'all'}_${year || new Date().getFullYear()}.xlsx`);
};

export const exportIndividualStudentMarksToExcel = (
  marks: any[],
  student: Student,
  filters?: any
) => {
  const studentMarks = marks.filter(mark => mark.student_id === student.id);
  
  const data = studentMarks.map(mark => {
    const percentage = ((mark.marks_obtained / mark.total_marks) * 100).toFixed(1);
    return {
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
  
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Marks');
  XLSX.writeFile(workbook, `${student.name}_marks_analysis_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// New function: Export comprehensive student summary PDF with improved formatting
export const exportStudentSummaryToPDF = (
  student: Student,
  attendanceRecords: AttendanceRecord[],
  marks: any[],
  period?: string
) => {
  const doc = new jsPDF();
  
  // Enhanced header with gradient-like effect
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, 210, 45, 'F');
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 35, 210, 10, 'F');
  
  // School logo placeholder (rounded rectangle)
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(15, 8, 30, 30, 5, 5, 'F');
  doc.setTextColor(59, 130, 246);
  doc.setFontSize(14);
  doc.text('SCHOOL', 30, 25, { align: 'center' });
  
  // Header text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.text('Student Progress Report', 105, 22, { align: 'center' });
  doc.setFontSize(14);
  doc.text('Comprehensive Academic & Attendance Summary', 105, 32, { align: 'center' });
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Student Information Card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 55, 182, 50, 5, 5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.roundedRect(14, 55, 182, 50, 5, 5, 'S');
  
  doc.setFontSize(18);
  doc.setTextColor(30, 58, 138);
  doc.text('👤 Student Information', 20, 68);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text(`Name: ${student.name}`, 20, 80);
  doc.text(`Class: ${student.class}`, 20, 90);
  doc.text(`Gender: ${student.gender}`, 120, 80);
  doc.text(`Subjects: ${student.subjects.join(', ')}`, 20, 100);
  
  if (student.school_name) {
    doc.text(`School: ${student.school_name}`, 120, 90);
  }
  
  // Report metadata
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 120, 100);
  if (period) {
    doc.text(`Period: ${period}`, 20, 115);
  }
  
  // Attendance Summary Card
  const studentAttendance = attendanceRecords.filter(r => r.studentId === student.id);
  const presentCount = studentAttendance.filter(r => r.status === 'present').length;
  const totalDays = studentAttendance.length;
  const attendancePercentage = totalDays > 0 ? ((presentCount / totalDays) * 100) : 0;
  
  let currentY = period ? 130 : 120;
  
  // Attendance card background
  const attendanceCardColor = attendancePercentage >= 85 ? [240, 253, 244] : 
                             attendancePercentage >= 70 ? [254, 252, 232] : [254, 242, 242];
  doc.setFillColor(attendanceCardColor[0], attendanceCardColor[1], attendanceCardColor[2]);
  doc.roundedRect(14, currentY, 182, 70, 5, 5, 'F');
  
  const borderColor = attendancePercentage >= 85 ? [34, 197, 94] : 
                     attendancePercentage >= 70 ? [234, 179, 8] : [239, 68, 68];
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(2);
  doc.roundedRect(14, currentY, 182, 70, 5, 5, 'S');
  
  doc.setFontSize(18);
  doc.setTextColor(30, 58, 138);
  doc.text('📊 Attendance Overview', 20, currentY + 15);
  
  // Large attendance percentage display
  doc.setFontSize(36);
  doc.setTextColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.text(`${attendancePercentage.toFixed(1)}%`, 150, currentY + 35, { align: 'center' });
  
  // Attendance progress bar
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(20, currentY + 40, 100, 8, 4, 4, 'F');
  doc.setFillColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.roundedRect(20, currentY + 40, (attendancePercentage * 1), 8, 4, 4, 'F');
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Total Days: ${totalDays}`, 20, currentY + 58);
  doc.text(`Present: ${presentCount}`, 70, currentY + 58);
  doc.text(`Absent: ${totalDays - presentCount}`, 120, currentY + 58);
  
  // Attendance status badge
  let statusText = '';
  if (attendancePercentage >= 85) {
    statusText = '✅ EXCELLENT';
  } else if (attendancePercentage >= 70) {
    statusText = '⚠️ GOOD';
  } else {
    statusText = '❌ NEEDS ATTENTION';
  }
  
  doc.setFontSize(10);
  doc.setTextColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.text(statusText, 150, currentY + 58, { align: 'center' });
  
  // Academic Performance Section
  const studentMarks = marks.filter(mark => mark.student_id === student.id);
  currentY += 85;
  
  doc.setTextColor(30, 58, 138);
  doc.setFontSize(18);
  doc.text('📝 Academic Performance', 20, currentY);
  
  if (studentMarks.length === 0) {
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(14, currentY + 10, 182, 30, 5, 5, 'F');
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(12);
    doc.text('No test marks available for this period.', 20, currentY + 30);
  } else {
    // Overall performance card
    const overallAvg = studentMarks.reduce((sum, mark) => 
      sum + (mark.marks_obtained / mark.total_marks * 100), 0) / studentMarks.length;
    
    let grade = 'F';
    let gradeColor = [239, 68, 68];
    if (overallAvg >= 90) { grade = 'A+'; gradeColor = [34, 197, 94]; }
    else if (overallAvg >= 80) { grade = 'A'; gradeColor = [59, 130, 246]; }
    else if (overallAvg >= 70) { grade = 'B+'; gradeColor = [16, 185, 129]; }
    else if (overallAvg >= 60) { grade = 'B'; gradeColor = [234, 179, 8]; }
    else if (overallAvg >= 50) { grade = 'C'; gradeColor = [249, 115, 22]; }
    else if (overallAvg >= 40) { grade = 'D'; gradeColor = [239, 68, 68]; }
    
    // Performance card background
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, currentY + 10, 182, 50, 5, 5, 'F');
    doc.setDrawColor(gradeColor[0], gradeColor[1], gradeColor[2]);
    doc.setLineWidth(2);
    doc.roundedRect(14, currentY + 10, 182, 50, 5, 5, 'S');
    
    // Grade badge
    doc.setFillColor(gradeColor[0], gradeColor[1], gradeColor[2]);
    doc.circle(160, currentY + 35, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text(grade, 160, currentY + 40, { align: 'center' });
    
    // Performance stats
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text(`Overall Average: ${overallAvg.toFixed(1)}%`, 20, currentY + 25);
    doc.text(`Tests Completed: ${studentMarks.length}`, 20, currentY + 40);
    
    // Progress bar for overall performance
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(20, currentY + 45, 120, 6, 3, 3, 'F');
    doc.setFillColor(gradeColor[0], gradeColor[1], gradeColor[2]);
    doc.roundedRect(20, currentY + 45, (overallAvg * 1.2), 6, 3, 3, 'F');
    
    currentY += 75;
    
    // Subject-wise performance table with enhanced styling
    const subjectGroups = studentMarks.reduce((acc: any, mark) => {
      if (!acc[mark.subject]) {
        acc[mark.subject] = [];
      }
      acc[mark.subject].push(mark);
      return acc;
    }, {});
    
    const subjectSummary = Object.entries(subjectGroups).map(([subject, subjectMarks]: [string, any]) => {
      const avgPercentage = subjectMarks.reduce((sum: number, mark: any) => 
        sum + (mark.marks_obtained / mark.total_marks * 100), 0) / subjectMarks.length;
      const testsCount = subjectMarks.length;
      const bestMark = Math.max(...subjectMarks.map((m: any) => (m.marks_obtained / m.total_marks * 100)));
      
      let subjectGrade = 'F';
      if (avgPercentage >= 90) subjectGrade = 'A+';
      else if (avgPercentage >= 80) subjectGrade = 'A';
      else if (avgPercentage >= 70) subjectGrade = 'B+';
      else if (avgPercentage >= 60) subjectGrade = 'B';
      else if (avgPercentage >= 50) subjectGrade = 'C';
      else if (avgPercentage >= 40) subjectGrade = 'D';
      
      return [
        subject,
        testsCount.toString(),
        `${avgPercentage.toFixed(1)}%`,
        subjectGrade,
        `${bestMark.toFixed(1)}%`
      ];
    });
    
    // Enhanced subject performance table
    autoTable(doc, {
      head: [['Subject', 'Tests', 'Average', 'Grade', 'Best Score']],
      body: subjectSummary,
      startY: currentY,
      styles: {
        fontSize: 11,
        cellPadding: 6,
        lineColor: [226, 232, 240],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontSize: 12,
        fontStyle: 'bold',
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        2: { halign: 'center' },
        3: { halign: 'center', fontStyle: 'bold' },
        4: { halign: 'center' },
      },
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 20;
    
    // Recent Performance Section
    const recentMarks = studentMarks
      .sort((a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime())
      .slice(0, 5);
    
    if (recentMarks.length > 0) {
      doc.setTextColor(30, 58, 138);
      doc.setFontSize(16);
      doc.text('📈 Recent Test Performance', 20, currentY);
      
      const recentMarksData = recentMarks.map(mark => {
        const percentage = ((mark.marks_obtained / mark.total_marks) * 100).toFixed(1);
        let performanceIcon = '🔴';
        if (percentage >= '80') performanceIcon = '🟢';
        else if (percentage >= '60') performanceIcon = '🟡';
        
        return [
          mark.subject,
          `Week ${mark.week_number}`,
          `${mark.marks_obtained}/${mark.total_marks}`,
          `${percentage}%`,
          performanceIcon,
          format(new Date(mark.test_date), 'dd/MM'),
        ];
      });
      
      autoTable(doc, {
        head: [['Subject', 'Week', 'Score', 'Percentage', 'Status', 'Date']],
        body: recentMarksData,
        startY: currentY + 10,
        styles: {
          fontSize: 10,
          cellPadding: 5,
          lineColor: [226, 232, 240],
          lineWidth: 0.5,
        },
        headStyles: {
          fillColor: [16, 185, 129],
          textColor: 255,
          fontSize: 11,
          halign: 'center',
        },
        alternateRowStyles: {
          fillColor: [240, 253, 244],
        },
        columnStyles: {
          2: { halign: 'center' },
          3: { halign: 'center', fontStyle: 'bold' },
          4: { halign: 'center' },
          5: { halign: 'center' },
        },
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 20;
    }
  }
  
  // Recommendations Section
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }
  
  // Recommendations card
  doc.setFillColor(254, 252, 232);
  doc.roundedRect(14, currentY, 182, 60, 5, 5, 'F');
  doc.setDrawColor(234, 179, 8);
  doc.setLineWidth(2);
  doc.roundedRect(14, currentY, 182, 60, 5, 5, 'S');
  
  doc.setTextColor(30, 58, 138);
  doc.setFontSize(16);
  doc.text('💡 Personalized Recommendations', 20, currentY + 15);
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  const recommendations = [];
  
  if (attendancePercentage < 85) {
    recommendations.push('📚 Focus on improving attendance - it directly impacts academic performance');
  } else {
    recommendations.push('✅ Excellent attendance! Keep maintaining this consistency');
  }
  
  if (studentMarks.length > 0) {
    const overallAvg = studentMarks.reduce((sum, mark) => 
      sum + (mark.marks_obtained / mark.total_marks * 100), 0) / studentMarks.length;
    
    const subjectGroups = studentMarks.reduce((acc: any, mark) => {
      if (!acc[mark.subject]) acc[mark.subject] = [];
      acc[mark.subject].push(mark);
      return acc;
    }, {});
    
    const weakSubjects = Object.entries(subjectGroups)
      .filter(([_, marks]: [string, any]) => {
        const avg = marks.reduce((sum: number, mark: any) => 
          sum + (mark.marks_obtained / mark.total_marks * 100), 0) / marks.length;
        return avg < 60;
      })
      .map(([subject]) => subject);
    
    if (weakSubjects.length > 0) {
      recommendations.push(`🎯 Extra focus needed in: ${weakSubjects.join(', ')}`);
    }
    
    if (overallAvg >= 80) {
      recommendations.push('🌟 Outstanding academic performance! Consider advanced challenges');
    } else if (overallAvg >= 60) {
      recommendations.push('📈 Good progress with potential for improvement');
    } else {
      recommendations.push('🤝 Additional academic support recommended');
    }
  }
  
  recommendations.forEach((rec, index) => {
    doc.text(rec, 20, currentY + 30 + (index * 10));
  });
  
  // Enhanced footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFillColor(248, 250, 252);
  doc.rect(0, pageHeight - 25, 210, 25, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Generated by School Management System', 14, pageHeight - 15);
  doc.text(`${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, pageHeight - 5);
  doc.text('Confidential Student Report', 160, pageHeight - 15);
  doc.text('Page 1 of 1', 180, pageHeight - 5);
  
  // Save the PDF
  const fileName = `${student.name.replace(/\s+/g, '_')}_Academic_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
  
  return doc;
};

// Function to generate PDF as blob for WhatsApp sharing
export const generateStudentSummaryPDFBlob = async (
  student: Student,
  attendanceRecords: AttendanceRecord[],
  marks: any[],
  period?: string
): Promise<Blob> => {
  const doc = new jsPDF();
  
  // Use the same enhanced formatting as above
  // Header with gradient-like effect
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, 210, 45, 'F');
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 35, 210, 10, 'F');
  
  // School logo placeholder
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(15, 8, 30, 30, 5, 5, 'F');
  doc.setTextColor(59, 130, 246);
  doc.setFontSize(14);
  doc.text('SCHOOL', 30, 25, { align: 'center' });
  
  // Header text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.text('Student Progress Report', 105, 22, { align: 'center' });
  doc.setFontSize(14);
  doc.text('Comprehensive Academic & Attendance Summary', 105, 32, { align: 'center' });
  
  // Continue with the same formatting...
  // For brevity, using a simplified version for the blob
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.text(`Student: ${student.name}`, 20, 70);
  doc.text(`Class: ${student.class}`, 20, 85);
  
  // Add basic attendance and marks summary
  const studentAttendance = attendanceRecords.filter(r => r.studentId === student.id);
  const presentCount = studentAttendance.filter(r => r.status === 'present').length;
  const totalDays = studentAttendance.length;
  const attendancePercentage = totalDays > 0 ? ((presentCount / totalDays) * 100) : 0;
  
  doc.text(`Attendance: ${attendancePercentage.toFixed(1)}%`, 20, 100);
  
  const studentMarks = marks.filter(mark => mark.student_id === student.id);
  if (studentMarks.length > 0) {
    const overallAvg = studentMarks.reduce((sum, mark) => 
      sum + (mark.marks_obtained / mark.total_marks * 100), 0) / studentMarks.length;
    doc.text(`Academic Average: ${overallAvg.toFixed(1)}%`, 20, 115);
  }
  
  return doc.output('blob');
};
