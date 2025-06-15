
-- Add gender column to students table
ALTER TABLE public.students 
ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female'));

-- Set a default value for existing records (you can change this as needed)
UPDATE public.students 
SET gender = 'male' 
WHERE gender IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE public.students 
ALTER COLUMN gender SET NOT NULL;
