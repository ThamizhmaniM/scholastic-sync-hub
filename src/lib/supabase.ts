
import { createClient } from '@supabase/supabase-js';
import { Student, AttendanceRecord } from '@/types';

// Create a single supabase client for interacting with the database
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ayjhqayszahqerzmtyni.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5amhxYXlzemFocWVyem10eW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODg0ODYzMzksImV4cCI6MjAwNDA2MjMzOX0.JHmygFgEHDCHeN_-V_oeYLmZS0crpW-FcijhM0X3_IQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Students Table Functions
export async function getStudents() {
  const { data, error } = await supabase
    .from('students')
    .select('*');
  
  if (error) {
    console.error('Error fetching students:', error);
    return [];
  }
  
  return data;
}

export async function getStudentById(id: string) {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching student with ID ${id}:`, error);
    return null;
  }
  
  return data;
}

export async function createStudent(student: Omit<Student, "id">) {
  const { data, error } = await supabase
    .from('students')
    .insert(student)
    .select();
  
  if (error) {
    console.error('Error creating student:', error);
    return null;
  }
  
  return data[0];
}

export async function updateStudentInDb(student: Student) {
  const { data, error } = await supabase
    .from('students')
    .update({
      name: student.name,
      class: student.class,
      subjects: student.subjects
    })
    .eq('id', student.id)
    .select();
  
  if (error) {
    console.error(`Error updating student with ID ${student.id}:`, error);
    return null;
  }
  
  return data[0];
}

export async function deleteStudentFromDb(id: string) {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting student with ID ${id}:`, error);
    return false;
  }
  
  return true;
}

// Attendance Records Functions
export async function getAttendanceRecords(studentId?: string) {
  let query = supabase
    .from('attendance_records')
    .select('*');
  
  if (studentId) {
    query = query.eq('student_id', studentId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching attendance records:', error);
    return [];
  }
  
  return data;
}

export async function markAttendanceInDb(record: Omit<AttendanceRecord, "id">) {
  // Check if a record already exists for this student and date
  const { data: existingRecords, error: fetchError } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('student_id', record.studentId)
    .eq('date', record.date);
  
  if (fetchError) {
    console.error('Error checking existing attendance record:', fetchError);
    return null;
  }
  
  if (existingRecords && existingRecords.length > 0) {
    // Update existing record
    const { data, error } = await supabase
      .from('attendance_records')
      .update({ status: record.status })
      .eq('id', existingRecords[0].id)
      .select();
    
    if (error) {
      console.error('Error updating attendance record:', error);
      return null;
    }
    
    return data[0];
  }
  
  // Create new record
  const { data, error } = await supabase
    .from('attendance_records')
    .insert({
      student_id: record.studentId,
      date: record.date,
      status: record.status
    })
    .select();
  
  if (error) {
    console.error('Error creating attendance record:', error);
    return null;
  }
  
  return data[0];
}

export async function getAttendanceSummaryFromDb(studentId?: string) {
  // For this, we'll need to use a more complex query that calculates the summary from raw records
  const { data: records, error } = await supabase
    .from('attendance_records')
    .select('student_id, status');
  
  if (error) {
    console.error('Error fetching attendance records for summary:', error);
    return [];
  }
  
  // Get all students or filter by ID
  const { data: studentsData, error: studentsError } = await supabase
    .from('students')
    .select('*')
    .eq(studentId ? 'id' : 'id', studentId || 'id');
  
  if (studentsError) {
    console.error('Error fetching students for summary:', studentsError);
    return [];
  }
  
  // Calculate summary for each student
  return studentsData.map((student: any) => {
    const studentRecords = records.filter((r: any) => r.student_id === student.id);
    const totalDays = studentRecords.length;
    const presentDays = studentRecords.filter((r: any) => r.status === 'present').length;
    
    return {
      studentId: student.id,
      studentName: student.name,
      totalDays,
      presentDays,
      percentage: totalDays > 0 ? (presentDays / totalDays) * 100 : 0
    };
  });
}

// Migration function to populate initial data
export async function migrateInitialData() {
  // Import initial data from mock-data
  const { students, attendanceRecords } = await import('./mock-data');
  
  // Check if students table is empty
  const { count: studentCount, error: countError } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true });
  
  if (countError) {
    console.error('Error checking student count:', countError);
    return;
  }
  
  // If no students exist, add the initial ones
  if (studentCount === 0) {
    const { error } = await supabase
      .from('students')
      .insert(students);
    
    if (error) {
      console.error('Error adding initial students:', error);
    } else {
      console.log('Initial students data migrated successfully');
    }
  }
  
  // Check if attendance records table is empty
  const { count: recordCount, error: recordCountError } = await supabase
    .from('attendance_records')
    .select('*', { count: 'exact', head: true });
  
  if (recordCountError) {
    console.error('Error checking attendance record count:', recordCountError);
    return;
  }
  
  // If no records exist, add the initial ones
  if (recordCount === 0) {
    // Transform records to match the database schema
    const transformedRecords = attendanceRecords.map(record => ({
      id: record.id,
      student_id: record.studentId,
      date: record.date,
      status: record.status
    }));
    
    const { error } = await supabase
      .from('attendance_records')
      .insert(transformedRecords);
    
    if (error) {
      console.error('Error adding initial attendance records:', error);
    } else {
      console.log('Initial attendance records data migrated successfully');
    }
  }
}
