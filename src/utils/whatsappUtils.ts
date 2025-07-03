import { Student } from "@/types";

interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  percentage: number;
}

interface TestMark {
  subject: string;
  marks_obtained: number;
  total_marks: number;
  week_number: number;
  test_date: string;
}

export const generateWhatsAppMessage = (
  student: Student,
  attendanceSummary: AttendanceSummary,
  recentMarks: TestMark[]
): string => {
  const studentName = student.name;
  const className = student.class;
  
  // Attendance section
  const attendanceText = `📊 *Attendance Summary*
Total Days: ${attendanceSummary.totalDays}
Present Days: ${attendanceSummary.presentDays}
Attendance Percentage: ${attendanceSummary.percentage.toFixed(1)}%`;

  // Test marks section
  let marksText = "\n\n📝 *Recent Test Marks*";
  if (recentMarks.length === 0) {
    marksText += "\nNo recent test marks available";
  } else {
    recentMarks.forEach((mark) => {
      const percentage = ((mark.marks_obtained / mark.total_marks) * 100).toFixed(1);
      marksText += `\n• ${mark.subject} (Week ${mark.week_number}): ${mark.marks_obtained}/${mark.total_marks} (${percentage}%)`;
    });
  }

  const message = `🎓 *Student Progress Report*

*Student:* ${studentName}
*Class:* ${className}

${attendanceText}${marksText}

📱 Generated from School Management System
📅 Date: ${new Date().toLocaleDateString()}`;

  return encodeURIComponent(message);
};

export const openWhatsApp = (phoneNumber: string, message: string) => {
  // Remove any non-numeric characters and ensure proper format
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  // Add country code if not present (assuming India +91)
  const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${message}`;
  window.open(whatsappUrl, '_blank');
};