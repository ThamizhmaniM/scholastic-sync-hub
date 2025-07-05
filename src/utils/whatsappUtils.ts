import { Student } from "@/types";
import { supabase } from "@/integrations/supabase/client";

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

// Function to send PDF via WhatsApp Business API
export const sendPDFViaWhatsApp = async (
  phoneNumber: string, 
  pdfBlob: Blob, 
  studentName: string,
  fileName: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Convert blob to base64
    const base64PDF = await blobToBase64(pdfBlob);
    
    // Call the edge function to send PDF
    const { data, error } = await supabase.functions.invoke('send-whatsapp-business', {
      body: {
        phoneNumber,
        studentName,
        type: 'document',
        document: {
          filename: fileName,
          content: base64PDF,
          mimeType: 'application/pdf'
        },
        caption: `📄 Student Progress Report for ${studentName}\n\nGenerated from School Management System\n${new Date().toLocaleDateString()}`
      }
    });

    if (error) {
      console.error('Error sending PDF via WhatsApp:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in sendPDFViaWhatsApp:', error);
    return { success: false, error: 'Failed to send PDF' };
  }
};

// Helper function to convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (data:application/pdf;base64,)
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};