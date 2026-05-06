-- Enable MonaLisa agent by default
-- This activates the proactive error detection system

-- Enable MonaLisa
UPDATE monalisa_settings 
SET is_active = true, 
    updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000000';

-- If no row exists, insert one
INSERT INTO monalisa_settings (id, is_active, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', true, now())
ON CONFLICT (id) DO UPDATE
SET is_active = true, updated_at = now();