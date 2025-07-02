
-- Add parent_phone and school_name columns to the students table
ALTER TABLE public.students 
ADD COLUMN parent_phone TEXT,
ADD COLUMN school_name TEXT;
