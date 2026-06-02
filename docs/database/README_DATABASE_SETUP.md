# Database Setup for Project Drag and Drop Feature

## Overview

The project drag and drop functionality requires a `user_project_preferences` table to store user-specific project ordering preferences. This table needs to be created in your Supabase database.

## Quick Setup

### Option 1: Run SQL in Supabase Dashboard (Recommended)

1. **Open your Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and paste the following SQL:**

```sql
-- Create user_project_preferences table
CREATE TABLE IF NOT EXISTS user_project_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, project_id)
);

-- Enable RLS
ALTER TABLE user_project_preferences ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own preferences only
CREATE POLICY "Users can manage their own project preferences"
  ON user_project_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_project_preferences_user_id ON user_project_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_project_preferences_project_id ON user_project_preferences(project_id);
CREATE INDEX IF NOT EXISTS idx_user_project_preferences_user_order ON user_project_preferences(user_id, order_index);

-- Verify the table was created
SELECT * FROM user_project_preferences LIMIT 0;
```

4. **Run the query**
   - Click the "Run" button or press Ctrl+Enter (Cmd+Enter on Mac)

5. **Verify the table was created**
   - You should see an empty result set (no errors)
   - Check the "Table Editor" to confirm the table exists

### Option 2: Use the Provided SQL File

1. **Copy the SQL from the file:**
   - Open `supabase/setup_user_project_preferences.sql`
   - Copy the contents

2. **Follow steps 2-5 from Option 1 above**

## What This Table Does

The `user_project_preferences` table stores:

- **user_id**: Links to the authenticated user
- **project_id**: Links to a specific project
- **order_index**: Integer representing the user's preferred order (0 = first, 1 = second, etc.)
- **created_at/updated_at**: Timestamps for tracking changes

## Security Features

- **Row Level Security (RLS)**: Enabled by default
- **User Isolation**: Users can only see and modify their own preferences
- **Foreign Key Constraints**: Ensures data integrity with users and projects tables

## Performance Features

- **Indexes**: Fast lookups by user_id and order_position
- **Unique Constraint**: Prevents duplicate preferences for the same user-project combination

## Troubleshooting

### Common Issues

1. **"Table doesn't exist" errors**
   - Make sure you've run the SQL setup script
   - Check that you're in the correct Supabase project

2. **Permission errors**
   - Ensure you're logged in as a project owner or admin
   - Check that RLS policies are properly configured

3. **Foreign key constraint errors**
   - Verify that the `projects` table exists
   - Ensure you have projects in your database

### Console Messages

The application will show helpful console messages:

- **Warning**: "user_project_preferences table does not exist. Please run the setup SQL script in your Supabase dashboard."
- **Info**: "See: supabase/setup_user_project_preferences.sql"

## After Setup

Once the table is created:

1. **Refresh your application**
2. **Navigate to the Projects dashboard**
3. **Try dragging and dropping project cards**
4. **Check the browser console for success messages**

The drag and drop functionality should now work without errors, and project order preferences will be automatically saved to the database.

## Support

If you encounter any issues:

1. Check the browser console for error messages
2. Verify the table exists in your Supabase dashboard
3. Ensure you have the necessary permissions
4. Check that your Supabase connection is working properly
