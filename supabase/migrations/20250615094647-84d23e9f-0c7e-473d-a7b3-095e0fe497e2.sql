
-- Create a table for weekly test marks
CREATE TABLE public.weekly_test_marks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  marks_obtained DECIMAL(5,2) NOT NULL,
  total_marks DECIMAL(5,2) NOT NULL DEFAULT 100,
  test_date DATE NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, subject, week_number, year)
);

-- Create indexes for better query performance
CREATE INDEX idx_weekly_test_marks_student_id ON public.weekly_test_marks(student_id);
CREATE INDEX idx_weekly_test_marks_user_id ON public.weekly_test_marks(user_id);
CREATE INDEX idx_weekly_test_marks_week_year ON public.weekly_test_marks(week_number, year);

-- Enable Row Level Security
ALTER TABLE public.weekly_test_marks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to ensure users can only access their own data
CREATE POLICY "Users can view their own test marks" 
  ON public.weekly_test_marks 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own test marks" 
  ON public.weekly_test_marks 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own test marks" 
  ON public.weekly_test_marks 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own test marks" 
  ON public.weekly_test_marks 
  FOR DELETE 
  USING (auth.uid() = user_id);
