-- Quick fix for ambiguous column reference error
-- Run this directly in Supabase SQL Editor to fix the signup trigger immediately

CREATE OR REPLACE FUNCTION auto_add_legl_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  legl_workspace_id uuid;
  v_user_email text;  -- Renamed to avoid conflict with column name
  user_full_name text;
  insert_result text;
BEGIN
  -- Log trigger start
  RAISE NOTICE 'SIGNUP_DEBUG: Trigger fired for user ID: %, Email: %', NEW.id, NEW.email;
  
  -- Get user email
  v_user_email := NEW.email;
  RAISE NOTICE 'SIGNUP_DEBUG: Extracted email: %', v_user_email;
  
  -- Only process @legl.com emails
  IF v_user_email IS NULL THEN
    RAISE NOTICE 'SIGNUP_DEBUG: Email is NULL, skipping';
    RETURN NEW;
  END IF;
  
  IF NOT (v_user_email ILIKE '%@legl.com') THEN
    RAISE NOTICE 'SIGNUP_DEBUG: Email % does not match @legl.com pattern, skipping', v_user_email;
    RETURN NEW;
  END IF;
  
  RAISE NOTICE 'SIGNUP_DEBUG: Email % matches @legl.com pattern, proceeding', v_user_email;
  
  -- Extract full name from user metadata (Google OAuth stores it here)
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_app_meta_data->>'full_name',
    NEW.raw_app_meta_data->>'name'
  );
  RAISE NOTICE 'SIGNUP_DEBUG: Extracted full_name: %', user_full_name;
  
  -- Find or create "Legl" workspace
  RAISE NOTICE 'SIGNUP_DEBUG: Looking for Legl workspace...';
  SELECT id INTO legl_workspace_id
  FROM workspaces
  WHERE name = 'Legl'
  LIMIT 1;
  
  -- Create workspace if it doesn't exist
  IF legl_workspace_id IS NULL THEN
    RAISE NOTICE 'SIGNUP_DEBUG: Legl workspace not found, creating new workspace...';
    BEGIN
      INSERT INTO workspaces (name, created_by)
      VALUES ('Legl', NEW.id)
      RETURNING id INTO legl_workspace_id;
      RAISE NOTICE 'SIGNUP_DEBUG: Created Legl workspace with ID: %', legl_workspace_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'SIGNUP_DEBUG: ERROR creating workspace: % - %', SQLSTATE, SQLERRM;
      -- Try to find it again in case of race condition
      SELECT id INTO legl_workspace_id
      FROM workspaces
      WHERE name = 'Legl'
      LIMIT 1;
      
      IF legl_workspace_id IS NULL THEN
        RAISE EXCEPTION 'SIGNUP_DEBUG: CRITICAL - Could not create or find Legl workspace. Error: %', SQLERRM;
      ELSE
        RAISE NOTICE 'SIGNUP_DEBUG: Found workspace after retry: %', legl_workspace_id;
      END IF;
    END;
  ELSE
    RAISE NOTICE 'SIGNUP_DEBUG: Found existing Legl workspace with ID: %', legl_workspace_id;
  END IF;
  
  -- Add user to workspace with full_name
  RAISE NOTICE 'SIGNUP_DEBUG: Attempting to insert into workspace_users...';
  RAISE NOTICE 'SIGNUP_DEBUG: Values - workspace_id: %, user_id: %, user_email: %, full_name: %, role: member, status: active', 
    legl_workspace_id, NEW.id, v_user_email, user_full_name;
  
  BEGIN
    INSERT INTO workspace_users (
      workspace_id,
      user_id,
      user_email,
      full_name,
      role,
      status
    )
    VALUES (
      legl_workspace_id,
      NEW.id,
      v_user_email,
      user_full_name,
      'member',
      'active'
    )
    ON CONFLICT (workspace_id, user_email) 
    DO UPDATE SET
      user_id = NEW.id,
      full_name = COALESCE(EXCLUDED.full_name, workspace_users.full_name),
      status = 'active',
      updated_at = now();
    
    RAISE NOTICE 'SIGNUP_DEBUG: Successfully inserted/updated user in workspace_users';
    
    -- Verify the insert worked (use table alias to avoid ambiguity)
    SELECT COUNT(*) INTO insert_result
    FROM workspace_users wu
    WHERE wu.workspace_id = legl_workspace_id 
      AND (wu.user_id = NEW.id OR wu.user_email = v_user_email);
    
    RAISE NOTICE 'SIGNUP_DEBUG: Verification - Found % matching entries in workspace_users', insert_result;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'SIGNUP_DEBUG: ERROR inserting into workspace_users: % - %', SQLSTATE, SQLERRM;
    RAISE WARNING 'SIGNUP_DEBUG: Error details - workspace_id: %, user_id: %, user_email: %', 
      legl_workspace_id, NEW.id, v_user_email;
    
    -- Check RLS policies
    RAISE NOTICE 'SIGNUP_DEBUG: Checking if RLS might be blocking...';
    RAISE NOTICE 'SIGNUP_DEBUG: Current user context: auth.uid() = %', auth.uid();
    
    -- Re-raise the error so signup fails
    RAISE EXCEPTION 'SIGNUP_DEBUG: Failed to add user to workspace_users. Original error: %', SQLERRM;
  END;
  
  RAISE NOTICE 'SIGNUP_DEBUG: Trigger completed successfully for user: %', v_user_email;
  RETURN NEW;
END;
$$;

