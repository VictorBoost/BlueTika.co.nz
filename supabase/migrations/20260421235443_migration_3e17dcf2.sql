-- Add the missing foreign key constraint to bypass_attempts
ALTER TABLE public.bypass_attempts 
ADD CONSTRAINT bypass_attempts_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;