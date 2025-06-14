import { Student, Group, Timetable, Test, AttendanceRecord, AttendanceSummary } from "@/types";
import { v4 as uuidv4 } from "uuid";

// Available subjects
export const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "English",
];

export const CLASSES = ["11", "12"];

// Initial students data
export let students: Student[] = [
  {
    id: "s1",
    name: "Alice Johnson",
    class: "11",
    subjects: ["Mathematics", "Physics", "Chemistry"],
  },
  {
    id: "s2",
    name: "Bob Smith",
    class: "11",
    subjects: ["Mathematics", "Physics", "Chemistry", "Biology"],
  },
  {
    id: "s3",
    name: "Charlie Davis",
    class: "11",
    subjects: ["Mathematics", "Physics", "Chemistry", "Computer Science"],
  },
  {
    id: "s4",
    name: "Diana Miller",
    class: "12",
    subjects: ["Mathematics", "Physics", "Chemistry", "Biology"],
  },
];

// Generate groups based on students
export const generateGroups = (): Group[] => {
  const groupMap: Map<string, Group> = new Map();

  students.forEach((student) => {
    // Create a unique key based on class and subjects
    const key = `${student.class}-${student.subjects.sort().join("-")}`;
    
    if (!groupMap.has(key)) {
      // Generate a descriptive name based on subjects
      let groupName = `Class ${student.class} - `;
      
      if (student.subjects.includes("Mathematics") && 
          student.subjects.includes("Physics") && 
          student.subjects.includes("Chemistry")) {
        if (student.subjects.includes("Biology")) {
          groupName += "PCB";
        } else if (student.subjects.includes("Computer Science")) {
          groupName += "CS";
        } else {
          groupName += "PCM";
        }
      } else {
        // For other combinations, use first letters
        groupName += student.subjects.map(s => s[0]).join("");
      }

      groupMap.set(key, {
        id: uuidv4(),
        name: groupName,
        class: student.class,
        subjects: [...student.subjects],
        students: [],
      });
    }

    // Add student to the appropriate group
    groupMap.get(key)?.students.push(student);
  });

  return Array.from(groupMap.values());
};

// Helper for time slot generation
export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const TIME_SLOTS = [
  { start: "18:00", end: "19:30" },
  { start: "19:30", end: "21:00" },
];

// Generate timetable for a group
export const generateTimetable = (group: Group): Timetable => {
  const timetable: Timetable = {
    groupId: group.id,
    slots: [],
  };

  // Shuffle subjects for variety
  const shuffledSubjects = [...group.subjects].sort(() => Math.random() - 0.5);
  let subjectIndex = 0;

  // For each day
  DAYS.forEach((day) => {
    // For each time slot
    TIME_SLOTS.forEach((timeSlot) => {
      // Assign a subject, ensuring no subject repeats on consecutive days
      const subject = shuffledSubjects[subjectIndex % shuffledSubjects.length];
      subjectIndex++;

      timetable.slots.push({
        day,
        startTime: timeSlot.start,
        endTime: timeSlot.end,
        subject,
      });
    });
  });

  return timetable;
};

// Generate test schedule for weekends
export const generateWeekendTests = (groups: Group[]): Test[] => {
  const tests: Test[] = [];
  const weekends = ["Saturday", "Sunday"];
  
  groups.forEach((group) => {
    group.subjects.forEach((subject, index) => {
      const day = weekends[index % 2]; // Alternate between Saturday and Sunday
      const timeSlot = TIME_SLOTS[Math.floor(index / 2) % TIME_SLOTS.length];
      
      tests.push({
        id: uuidv4(),
        groupId: group.id,
        subject,
        date: `2023-07-${day === "Saturday" ? "15" : "16"}`, // Just example dates
        startTime: timeSlot.start,
        endTime: timeSlot.end,
      });
    });
  });

  return tests;
};

// Generate attendance records for the past 30 days
export const generateAttendance = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  
  students.forEach((student) => {
    // Generate records for past 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      // Weekend check - skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      // 80% chance of being present
      const status = Math.random() < 0.8 ? 'present' : 'absent';
      
      records.push({
        id: uuidv4(),
        studentId: student.id,
        date: date.toISOString().split('T')[0], // YYYY-MM-DD format
        status,
      });
    }
  });
  
  return records;
};

// Mock attendance records
export let attendanceRecords: AttendanceRecord[] = generateAttendance();

// CRUD operations for students
export const addStudent = (student: Omit<Student, "id">): Student => {
  const newStudent = { ...student, id: uuidv4() };
  students = [...students, newStudent];
  return newStudent;
};

export const updateStudent = (student: Student): Student => {
  students = students.map(s => s.id === student.id ? student : s);
  return student;
};

export const deleteStudent = (id: string): void => {
  students = students.filter(s => s.id !== id);
};

// Get attendance summary
export const getAttendanceSummary = (studentId?: string): AttendanceSummary[] => {
  const summary: AttendanceSummary[] = [];
  
  // Filter students if a specific ID is provided
  const studentsToProcess = studentId 
    ? students.filter(s => s.id === studentId)
    : students;
  
  studentsToProcess.forEach(student => {
    const studentRecords = attendanceRecords.filter(r => r.studentId === student.id);
    const totalDays = studentRecords.length;
    const presentDays = studentRecords.filter(r => r.status === 'present').length;
    
    summary.push({
      studentId: student.id,
      studentName: student.name,
      totalDays,
      presentDays,
      percentage: totalDays > 0 ? (presentDays / totalDays) * 100 : 0
    });
  });
  
  return summary;
};

// Mark attendance
export const markAttendance = (record: Omit<AttendanceRecord, "id">): AttendanceRecord => {
  // Check if record already exists for this student and date
  const existingIndex = attendanceRecords.findIndex(
    r => r.studentId === record.studentId && r.date === record.date
  );
  
  if (existingIndex >= 0) {
    // Update existing record
    attendanceRecords[existingIndex] = {
      ...attendanceRecords[existingIndex],
      status: record.status
    };
    return attendanceRecords[existingIndex];
  }
  
  // Add new record
  const newRecord = { ...record, id: uuidv4() };
  attendanceRecords = [...attendanceRecords, newRecord];
  return newRecord;
};

// Bulk mark attendance
export const markBulkAttendance = (
  studentIds: string[],
  date: string,
  status: 'present' | 'absent'
): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  
  studentIds.forEach(studentId => {
    const record = markAttendance({
      studentId,
      date,
      status
    });
    records.push(record);
  });
  
  return records;
};
