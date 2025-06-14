
export interface Student {
  id: string;
  name: string;
  class: string;
  subjects: string[];
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
