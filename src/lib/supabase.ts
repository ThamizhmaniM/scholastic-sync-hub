
import { createClient } from '@supabase/supabase-js';
import { Student, AttendanceRecord } from '@/types';

// Create a single supabase client for interacting with the database
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ayjhqayszahqerzmtyni.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5amhxYXlzemFocWVyem10eW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTU4NTcsImV4cCI6MjA2NTQ3MTg1N30.xBs9Wtj4ObZNTem0k9b4f9eXU8kg-bmUG5ySVxZdoo8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Students Table Functions
export async function getStudents() {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching students:', error);
    return [];
  }
  
  return data || [];
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
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to create students');
  }

  // Generate a simple ID
  const id = `s${Date.now()}`;
  
  const { data, error } = await supabase
    .from('students')
    .insert({
      id,
      name: student.name,
      class: student.class,
      subjects: student.subjects,
      user_id: user.id
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating student:', error);
    return null;
  }
  
  return data;
}

export async function updateStudentInDb(student: Student) {
  const { data, error } = await supabase
    .from('students')
    .update({
      name: student.name,
      class: student.class,
      subjects: student.subjects,
      updated_at: new Date().toISOString()
    })
    .eq('id', student.id)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating student with ID ${student.id}:`, error);
    return null;
  }
  
  return data;
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
    .select('*')
    .order('date', { ascending: false });
  
  if (studentId) {
    query = query.eq('student_id', studentId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching attendance records:', error);
    return [];
  }
  
  return data || [];
}

export async function markAttendanceInDb(record: Omit<AttendanceRecord, "id">) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to mark attendance');
  }

  // Generate a simple ID
  const id = `a${Date.now()}_${record.studentId}`;
  
  // Use upsert to handle duplicate entries
  const { data, error } = await supabase
    .from('attendance_records')
    .upsert({
      id,
      student_id: record.studentId,
      date: record.date,
      status: record.status,
      user_id: user.id
    }, {
      onConflict: 'student_id,date'
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error marking attendance:', error);
    return null;
  }
  
  return data;
}

export async function getAttendanceSummaryFromDb(studentId?: string) {
  // Get students for current user
  let studentsQuery = supabase.from('students').select('*');
  if (studentId) {
    studentsQuery = studentsQuery.eq('id', studentId);
  }
  
  const { data: students, error: studentsError } = await studentsQuery;
  
  if (studentsError) {
    console.error('Error fetching students for summary:', studentsError);
    return [];
  }
  
  if (!students || students.length === 0) {
    return [];
  }
  
  // Get attendance records for current user
  const { data: records, error: recordsError } = await supabase
    .from('attendance_records')
    .select('student_id, status');
  
  if (recordsError) {
    console.error('Error fetching attendance records for summary:', recordsError);
    return [];
  }
  
  // Calculate summary for each student
  return students.map((student: any) => {
    const studentRecords = (records || []).filter((r: any) => r.student_id === student.id);
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

// Dashboard Statistics Functions
export async function getDashboardStats() {
  try {
    // Get total students count for current user
    const { count: totalStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });
    
    // Get attendance records from the last 7 days for current user
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const { data: weeklyAttendance } = await supabase
      .from('attendance_records')
      .select('status')
      .gte('date', oneWeekAgo.toISOString().split('T')[0]);
    
    // Calculate attendance rate
    const totalRecords = weeklyAttendance?.length || 0;
    const presentRecords = weeklyAttendance?.filter(r => r.status === 'present').length || 0;
    const attendanceRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;
    
    // Get unique subject combinations to estimate groups for current user
    const { data: students } = await supabase
      .from('students')
      .select('subjects, class');
    
    const uniqueGroups = new Set();
    students?.forEach(student => {
      const key = `${student.class}-${student.subjects?.sort().join('-')}`;
      uniqueGroups.add(key);
    });
    
    return {
      totalStudents: totalStudents || 0,
      activeGroups: uniqueGroups.size,
      attendanceRate,
      upcomingTests: 8 // This would come from a tests table in the future
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalStudents: 0,
      activeGroups: 0,
      attendanceRate: 0,
      upcomingTests: 0
    };
  }
}

// Remove migration function as it's no longer needed with user-specific data
