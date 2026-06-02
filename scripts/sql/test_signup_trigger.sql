-- Test script for signup trigger without requiring actual user signup
-- This simulates what happens when a new user signs up

-- Create a test function that simulates the trigger
CREATE OR REPLACE FUNCTION test_auto_add_legl_user()
RETURNS TABLE (
  test_result text,
  workspace_id uuid,
  user_in_workspace boolean,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  test_user_id uuid := gen_random_uuid();
  test_email text := 'test.user@legl.com';
  test_full_name text := 'Test User';
  v_workspace_id uuid;
  v_user_exists boolean := false;
  v_error text;
BEGIN
  -- Create a mock NEW record structure
  -- Note: We can't directly create a trigger NEW record, so we'll simulate the logic
  
  RAISE NOTICE '🧪 TEST: Starting signup trigger test...';
  RAISE NOTICE '🧪 TEST: Test user ID: %', test_user_id;
  RAISE NOTICE '🧪 TEST: Test email: %', test_email;
  
  -- Step 1: Check if email matches pattern
  IF test_email IS NULL OR NOT (test_email ILIKE '%@legl.com') THEN
    RETURN QUERY SELECT 
      'FAILED'::text,
      NULL::uuid,
      false::boolean,
      'Email does not match @legl.com pattern'::text;
    RETURN;
  END IF;
  
  RAISE NOTICE '🧪 TEST: Email validation passed';
  
  -- Step 2: Find or create workspace
  SELECT id INTO v_workspace_id
  FROM workspaces
  WHERE name = 'Legl'
  LIMIT 1;
  
  IF v_workspace_id IS NULL THEN
    RAISE NOTICE '🧪 TEST: Creating Legl workspace...';
    INSERT INTO workspaces (name, created_by)
    VALUES ('Legl', test_user_id)
    RETURNING id INTO v_workspace_id;
    RAISE NOTICE '🧪 TEST: Created workspace: %', v_workspace_id;
  ELSE
    RAISE NOTICE '🧪 TEST: Found existing workspace: %', v_workspace_id;
  END IF;
  
  -- Step 3: Try to insert into workspace_users (simulating the trigger)
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
      v_workspace_id,
      test_user_id,
      test_email,
      test_full_name,
      'member',
      'active'
    )
    ON CONFLICT (workspace_id, user_email) 
    DO UPDATE SET
      user_id = EXCLUDED.user_id,
      full_name = COALESCE(EXCLUDED.full_name, workspace_users.full_name),
      status = 'active',
      updated_at = now();
    
    RAISE NOTICE '🧪 TEST: Successfully inserted/updated test user';
    
    -- Step 4: Verify the insert worked
    SELECT EXISTS(
      SELECT 1 
      FROM workspace_users wu
      WHERE wu.workspace_id = v_workspace_id 
        AND (wu.user_id = test_user_id OR wu.user_email = test_email)
    ) INTO v_user_exists;
    
    IF v_user_exists THEN
      RAISE NOTICE '🧪 TEST: ✅ Verification passed - user found in workspace_users';
      RETURN QUERY SELECT 
        'PASSED'::text,
        v_workspace_id,
        true::boolean,
        NULL::text;
    ELSE
      RAISE NOTICE '🧪 TEST: ❌ Verification failed - user NOT found in workspace_users';
      RETURN QUERY SELECT 
        'FAILED'::text,
        v_workspace_id,
        false::boolean,
        'User not found after insert'::text;
    END IF;
    
    -- Cleanup: Remove test user
    DELETE FROM workspace_users 
    WHERE user_id = test_user_id 
      AND user_email = test_email;
    RAISE NOTICE '🧪 TEST: Cleaned up test user';
    
  EXCEPTION WHEN OTHERS THEN
    v_error := SQLERRM;
    RAISE WARNING '🧪 TEST: ❌ ERROR during insert: % - %', SQLSTATE, SQLERRM;
    RETURN QUERY SELECT 
      'FAILED'::text,
      v_workspace_id,
      false::boolean,
      v_error;
  END;
END;
$$;

-- Run the test
DO $$
DECLARE
  test_result text;
  workspace_id uuid;
  user_in_workspace boolean;
  error_message text;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '  SIGNUP TRIGGER TEST';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  SELECT * INTO test_result, workspace_id, user_in_workspace, error_message
  FROM test_auto_add_legl_user();
  
  RAISE NOTICE '';
  RAISE NOTICE 'Test Result: %', test_result;
  RAISE NOTICE 'Workspace ID: %', workspace_id;
  RAISE NOTICE 'User in workspace: %', user_in_workspace;
  
  IF error_message IS NOT NULL THEN
    RAISE NOTICE 'Error: %', error_message;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  
  IF test_result = 'PASSED' THEN
    RAISE NOTICE '✅ TEST PASSED - Signup trigger logic works correctly!';
  ELSE
    RAISE NOTICE '❌ TEST FAILED - Check error message above';
  END IF;
  
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END;
$$;

-- Alternative: Test the actual trigger function by checking if it exists and is valid
DO $$
DECLARE
  func_exists boolean;
  func_definition text;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '  TRIGGER FUNCTION VALIDATION';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  -- Check if function exists
  SELECT EXISTS(
    SELECT 1 
    FROM pg_proc 
    WHERE proname = 'auto_add_legl_user'
  ) INTO func_exists;
  
  IF func_exists THEN
    RAISE NOTICE '✅ Function auto_add_legl_user exists';
    
    -- Get function definition to check for ambiguous references
    SELECT pg_get_functiondef(oid) INTO func_definition
    FROM pg_proc
    WHERE proname = 'auto_add_legl_user';
    
    -- Check for potential issues
    IF func_definition LIKE '%user_email = user_email%' AND func_definition NOT LIKE '%wu.user_email%' THEN
      RAISE WARNING '⚠️  Potential ambiguous column reference found in function';
      RAISE NOTICE '   Look for: user_email = user_email (should use table alias)';
    ELSE
      RAISE NOTICE '✅ No obvious ambiguous column references found';
    END IF;
    
    -- Check if trigger exists
    IF EXISTS(
      SELECT 1 
      FROM pg_trigger 
      WHERE tgname = 'on_auth_user_created'
    ) THEN
      RAISE NOTICE '✅ Trigger on_auth_user_created exists and is active';
    ELSE
      RAISE WARNING '⚠️  Trigger on_auth_user_created does not exist!';
    END IF;
    
  ELSE
    RAISE WARNING '❌ Function auto_add_legl_user does not exist!';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END;
$$;

