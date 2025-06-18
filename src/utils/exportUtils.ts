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
  
  // Prepare data
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
  
  const data = students.map(student => {
    const row: any = {
      'Student Name': student.name,
      'Class': student.class,
    };
    
    monthDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const record = attendanceRecords.find(r => r.studentId === student.id && r.date === dateStr);
      row[format(day, 'd')] = record ? (record.status === 'present' ? 'P' : 'A') : '-';
    });
    
    return row;
  });
  
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
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
