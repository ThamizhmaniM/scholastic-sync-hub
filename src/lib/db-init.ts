
import { supabase, migrateInitialData } from './supabase';

// This function will check if our tables exist, and if not, create them
export async function initDatabase() {
  try {
    console.log('Initializing database...');
    
    // Check if tables exist by querying them
    const { error: studentsError } = await supabase
      .from('students')
      .select('id')
      .limit(1);
    
    const { error: attendanceError } = await supabase
      .from('attendance_records')
      .select('id')
      .limit(1);
    
    // If we get error code 42P01, the table doesn't exist
    const tablesExist = !studentsError && !attendanceError;
    
    if (tablesExist) {
      console.log('Database tables are ready.');
      // Only migrate initial data once, not every time the app loads
      const shouldMigrate = localStorage.getItem('initial_data_migrated') !== 'true';
      if (shouldMigrate) {
        await migrateInitialData();
        localStorage.setItem('initial_data_migrated', 'true');
      }
    } else {
      console.log('Database tables not found. They should have been created via SQL migration.');
      if (studentsError) console.error('Students table error:', studentsError);
      if (attendanceError) console.error('Attendance table error:', attendanceError);
    }
    
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}
