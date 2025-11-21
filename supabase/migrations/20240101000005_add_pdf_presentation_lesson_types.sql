-- Add PDF and presentation lesson types
ALTER TABLE public.lessons
DROP CONSTRAINT IF EXISTS lessons_lesson_type_check;

ALTER TABLE public.lessons
ADD CONSTRAINT lessons_lesson_type_check 
CHECK (lesson_type IN ('video', 'text', 'quiz', 'pdf', 'presentation'));



