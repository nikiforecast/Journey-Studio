-- Fix research_note_comments table
-- Run this SQL in your Supabase Dashboard → SQL Editor

-- Option 1: If table doesn't exist, create it
CREATE TABLE IF NOT EXISTS research_note_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  research_note_id uuid NOT NULL,
  user_id uuid NOT NULL,
  comment_text text NOT NULL,
  is_decision boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Option 2: If table exists but missing column, add it
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'research_note_comments' 
    AND column_name = 'is_decision'
  ) THEN
    ALTER TABLE research_note_comments ADD COLUMN is_decision boolean DEFAULT false;
  END IF;
END $$;

-- Add foreign key constraints (if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'research_note_comments_research_note_id_fkey'
  ) THEN
    ALTER TABLE research_note_comments 
    ADD CONSTRAINT research_note_comments_research_note_id_fkey 
    FOREIGN KEY (research_note_id) REFERENCES research_notes(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'research_note_comments_user_id_fkey'
  ) THEN
    ALTER TABLE research_note_comments 
    ADD CONSTRAINT research_note_comments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_research_note_comments_research_note_id 
ON research_note_comments(research_note_id);

CREATE INDEX IF NOT EXISTS idx_research_note_comments_user_id 
ON research_note_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_research_note_comments_created_at 
ON research_note_comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_note_comments_is_decision 
ON research_note_comments(is_decision);

-- Enable Row Level Security
ALTER TABLE research_note_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'research_note_comments' 
    AND policyname = 'Allow authenticated users to create research note comments'
  ) THEN
    CREATE POLICY "Allow authenticated users to create research note comments" 
    ON research_note_comments FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'research_note_comments' 
    AND policyname = 'Allow authenticated users to view all research note comments'
  ) THEN
    CREATE POLICY "Allow authenticated users to view all research note comments" 
    ON research_note_comments FOR SELECT TO authenticated 
    USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'research_note_comments' 
    AND policyname = 'Allow users to update their own research note comments'
  ) THEN
    CREATE POLICY "Allow users to update their own research note comments" 
    ON research_note_comments FOR UPDATE TO authenticated 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'research_note_comments' 
    AND policyname = 'Allow users to delete their own research note comments'
  ) THEN
    CREATE POLICY "Allow users to delete their own research note comments" 
    ON research_note_comments FOR DELETE TO authenticated 
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Check if everything was created successfully
SELECT 
  'research_note_comments table' as item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'research_note_comments')
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status;

SELECT 
  'is_decision column' as item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'research_note_comments' AND column_name = 'is_decision')
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status;
