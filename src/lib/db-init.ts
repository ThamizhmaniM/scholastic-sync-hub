
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
    const createTables = 
      (studentsError?.code === '42P01' || attendanceError?.code === '42P01');
    
    if (createTables) {
      console.log('Tables need to be created. Please set up your Supabase tables using the SQL provided in the docs.');
    } else {
      console.log('Database tables already exist.');
      // Migrate initial data if tables exist
      await migrateInitialData();
    }
    
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}
