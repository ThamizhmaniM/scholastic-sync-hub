-- Update RLS policies for students table to allow all authenticated users to view students
-- Remove the restrictive policies and create more permissive ones

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own students" ON public.students;
DROP POLICY IF EXISTS "Parents can view their own children" ON public.students;

-- Create new policy that allows all authenticated users to view all students
CREATE POLICY "All authenticated users can view students" 
ON public.students 
FOR SELECT 
TO authenticated 
USING (true);

-- Keep other policies for insert/update/delete operations user-specific
-- Users can still only modify their own students