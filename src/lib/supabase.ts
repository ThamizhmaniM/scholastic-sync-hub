import { Student, AttendanceRecord, WeeklyTestMark, Profile } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Re-export supabase for compatibility
export { supabase };

// Students Table Functions
export async function getStudents(): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching students:', error);
    return [];
  }
  
  return (data || []) as Student[];
}

export async function getStudentById(id: string): Promise<Student | null> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching student with ID ${id}:`, error);
    return null;
  }
  
  return data as Student;
}

export async function createStudent(student: Omit<Student, "id">): Promise<Student | null> {
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
      gender: student.gender,
      parent_phone: student.parent_phone,
      school_name: student.school_name,
      user_id: student.user_id || user.id // Use assigned staff or current user
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating student:', error);
    return null;
  }
  
  return data as Student;
}

export async function updateStudentInDb(student: Student): Promise<Student | null> {
  const { data, error } = await supabase
    .from('students')
    .update({
      name: student.name,
      class: student.class,
      subjects: student.subjects,
      gender: student.gender,
      parent_phone: student.parent_phone,
      school_name: student.school_name,
      user_id: student.user_id,
      updated_at: new Date().toISOString()
    })
    .eq('id', student.id)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating student with ID ${student.id}:`, error);
    return null;
  }
  
  return data as Student;
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
export async function getAttendanceRecords(studentId?: string): Promise<AttendanceRecord[]> {
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
  
  // Transform the data to ensure consistent field naming and proper typing
  const transformedData = (data || []).map(record => ({
    id: record.id,
    studentId: record.student_id, // Map student_id to studentId for consistency
    student_id: record.student_id, // Keep both for compatibility
    date: record.date,
    status: record.status as 'present' | 'absent',
    created_at: record.created_at,
    user_id: record.user_id
  })) as AttendanceRecord[];
  
  console.log('Transformed attendance records:', transformedData);
  return transformedData;
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

// Weekly Test Marks Functions
export async function getWeeklyTestMarks(studentId?: string, weekNumber?: number, year?: number) {
  let query = supabase
    .from('weekly_test_marks')
    .select('*')
    .order('test_date', { ascending: false });
  
  if (studentId) {
    query = query.eq('student_id', studentId);
  }
  
  if (weekNumber && year) {
    query = query.eq('week_number', weekNumber).eq('year', year);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching weekly test marks:', error);
    return [];
  }
  
  return data || [];
}

export async function createWeeklyTestMark(mark: Omit<WeeklyTestMark, "id">) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to create test marks');
  }

  const { data, error } = await supabase
    .from('weekly_test_marks')
    .insert({
      student_id: mark.studentId,
      subject: mark.subject,
      week_number: mark.weekNumber,
      year: mark.year,
      marks_obtained: mark.marksObtained,
      total_marks: mark.totalMarks,
      test_date: mark.testDate,
      remarks: mark.remarks,
      user_id: user.id
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating weekly test mark:', error);
    return null;
  }
  
  return data;
}

export async function updateWeeklyTestMark(mark: WeeklyTestMark) {
  const { data, error } = await supabase
    .from('weekly_test_marks')
    .update({
      marks_obtained: mark.marksObtained,
      total_marks: mark.totalMarks,
      test_date: mark.testDate,
      remarks: mark.remarks,
      updated_at: new Date().toISOString()
    })
    .eq('id', mark.id)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating weekly test mark with ID ${mark.id}:`, error);
    return null;
  }
  
  return data;
}

export async function deleteWeeklyTestMark(id: string) {
  const { error } = await supabase
    .from('weekly_test_marks')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting weekly test mark with ID ${id}:`, error);
    return false;
  }
  
  return true;
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
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalStudents: 0,
      activeGroups: 0,
      attendanceRate: 0,
    };
  }
}

// Profiles Functions
export async function getProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .order('full_name');
  
  if (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }
  
  return data || [];
}
