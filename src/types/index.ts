export interface Student {
  id: string;
  name: string;
  class: string;
  subjects: string[];
  gender: "male" | "female";
  parent_phone?: string;
  school_name?: string;
  user_id?: string; // Staff/Teacher assigned to the student
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
}

export interface Group {
  id: string;
  name: string;
  class: string;
  subjects: string[];
  students: Student[];
}

export interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
}

export interface Timetable {
  groupId: string;
  slots: TimeSlot[];
}

export interface Test {
  id: string;
  groupId: string;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent';
}

export interface AttendanceSummary {
  studentId: string;
  studentName: string;
  totalDays: number;
  presentDays: number;
  percentage: number;
}

export interface WeeklyTestMark {
  id: string;
  studentId: string;
  subject: string;
  weekNumber: number;
  year: number;
  marksObtained: number;
  totalMarks: number;
  testDate: string;
  remarks?: string;
}
