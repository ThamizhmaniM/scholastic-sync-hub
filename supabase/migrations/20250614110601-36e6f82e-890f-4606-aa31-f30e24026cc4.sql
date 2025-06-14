
-- Create students table
CREATE TABLE public.students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  subjects TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance_records table
CREATE TABLE public.attendance_records (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- Create indexes for better query performance
CREATE INDEX idx_attendance_student_id ON public.attendance_records(student_id);
CREATE INDEX idx_attendance_date ON public.attendance_records(date);
CREATE INDEX idx_students_class ON public.students(class);

-- Enable Row Level Security (optional, but recommended for production)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations for now (you can restrict these later)
CREATE POLICY "Allow all operations on students" ON public.students
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on attendance_records" ON public.attendance_records
  FOR ALL USING (true) WITH CHECK (true);
