-- Step 1: Check if the columns exist
DO $$
BEGIN
    -- Check if created_by column exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'user_journeys'
        AND column_name = 'created_by'
    ) THEN
        RAISE NOTICE '✅ created_by column exists';
    ELSE
        RAISE NOTICE '❌ created_by column does NOT exist - will create it';
    END IF;
    
    -- Check if updated_by column exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'user_journeys'
        AND column_name = 'updated_by'
    ) THEN
        RAISE NOTICE '✅ updated_by column exists';
    ELSE
        RAISE NOTICE '❌ updated_by column does NOT exist - will create it';
    END IF;
END $$;

-- Step 2: Add the columns if they don't exist
ALTER TABLE user_journeys
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE user_journeys
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_journeys_created_by ON user_journeys(created_by);
CREATE INDEX IF NOT EXISTS idx_user_journeys_updated_by ON user_journeys(updated_by);

-- Step 4: Verify the columns were added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_journeys'
AND column_name IN ('created_by', 'updated_by')
ORDER BY column_name;

-- Step 5: Check current data (see how many journeys have creator/editor info)
SELECT 
    COUNT(*) as total_journeys,
    COUNT(created_by) as journeys_with_creator,
    COUNT(updated_by) as journeys_with_editor
FROM user_journeys;

