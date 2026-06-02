-- Diagnostic script to identify why signup suddenly stopped working
-- This checks the current state of the trigger function and identifies potential issues

DO $$
DECLARE
  func_definition text;
  trigger_exists boolean;
  trigger_enabled boolean;
  has_ambiguous_ref boolean := false;
  has_v_prefix boolean := false;
  has_debugging boolean := false;
  migration_timestamps text[];
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '  SIGNUP TRIGGER DIAGNOSTIC REPORT';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  -- Check if function exists
  IF NOT EXISTS(
    SELECT 1 FROM pg_proc WHERE proname = 'auto_add_legl_user'
  ) THEN
    RAISE EXCEPTION '❌ CRITICAL: Function auto_add_legl_user does not exist!';
  END IF;
  
  RAISE NOTICE '✅ Function exists';
  
  -- Get function definition
  SELECT pg_get_functiondef(oid)
  INTO func_definition
  FROM pg_proc
  WHERE proname = 'auto_add_legl_user'
  LIMIT 1;
  
  -- Check for the fix (v_user_email variable)
  IF func_definition LIKE '%v_user_email%' THEN
    RAISE NOTICE '✅ Function uses v_user_email variable (FIXED)';
    has_v_prefix := true;
  ELSE
    RAISE WARNING '❌ Function does NOT use v_user_email - still has ambiguous reference bug!';
    RAISE WARNING '   This is likely why signup is failing.';
  END IF;
  
  -- Check for ambiguous patterns
  IF func_definition LIKE '%user_email = user_email%' 
     AND func_definition NOT LIKE '%wu.user_email%' 
     AND func_definition NOT LIKE '%v_user_email%' THEN
    RAISE WARNING '❌ Found ambiguous reference: user_email = user_email';
    RAISE WARNING '   This will cause: "column reference user_email is ambiguous"';
    has_ambiguous_ref := true;
  END IF;
  
  -- Check if debugging was added (this might have introduced the bug)
  IF func_definition LIKE '%SIGNUP_DEBUG%' THEN
    RAISE NOTICE 'ℹ️  Function includes debugging (SIGNUP_DEBUG)';
    has_debugging := true;
    
    -- Check if debugging introduced the bug
    IF func_definition LIKE '%user_email = user_email%' 
       AND func_definition NOT LIKE '%v_user_email%' THEN
      RAISE WARNING '⚠️  DEBUGGING MIGRATION INTRODUCED THE BUG!';
      RAISE WARNING '   The verification query in the debugging code has ambiguous reference.';
    END IF;
  END IF;
  
  -- Check trigger status
  SELECT 
    EXISTS(SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'),
    EXISTS(
      SELECT 1 
      FROM pg_trigger 
      WHERE tgname = 'on_auth_user_created' 
        AND tgenabled = 'O'  -- 'O' = origin (enabled)
    )
  INTO trigger_exists, trigger_enabled;
  
  IF trigger_exists THEN
    RAISE NOTICE '✅ Trigger on_auth_user_created exists';
    IF trigger_enabled THEN
      RAISE NOTICE '✅ Trigger is ENABLED';
    ELSE
      RAISE WARNING '❌ Trigger is DISABLED! This would prevent signup from working.';
    END IF;
  ELSE
    RAISE WARNING '❌ Trigger on_auth_user_created does NOT exist!';
  END IF;
  
  -- Check for recent migrations that might have affected this
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '  MIGRATION HISTORY CHECK';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  
  -- Check which migrations have been applied (if we can access supabase_migrations)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'supabase_migrations') THEN
    SELECT array_agg(name ORDER BY version DESC)
    INTO migration_timestamps
    FROM supabase_migrations
    WHERE name LIKE '%signup%' 
       OR name LIKE '%legl_user%'
       OR name LIKE '%workspace_user%'
       OR name LIKE '%debugging%'
    ORDER BY version DESC
    LIMIT 10;
    
    IF migration_timestamps IS NOT NULL THEN
      RAISE NOTICE 'Recent migrations affecting signup:';
      FOREACH func_definition IN ARRAY migration_timestamps
      LOOP
        RAISE NOTICE '  - %', func_definition;
      END LOOP;
    END IF;
  END IF;
  
  -- Summary and recommendations
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '  DIAGNOSIS SUMMARY';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  
  IF has_ambiguous_ref OR NOT has_v_prefix THEN
    RAISE NOTICE '';
    RAISE WARNING '❌ PROBLEM IDENTIFIED: Ambiguous column reference bug';
    RAISE NOTICE '';
    RAISE NOTICE 'ROOT CAUSE:';
    IF has_debugging THEN
      RAISE NOTICE '  The debugging migration (20250205000001) added a verification';
      RAISE NOTICE '  query that uses "user_email = user_email" which is ambiguous.';
      RAISE NOTICE '  The variable name conflicts with the column name.';
    ELSE
      RAISE NOTICE '  The function uses "user_email" as a variable name, which';
      RAISE NOTICE '  conflicts with the "user_email" column in workspace_users.';
    END IF;
    RAISE NOTICE '';
    RAISE NOTICE 'SOLUTION:';
    RAISE NOTICE '  1. Run fix_signup_trigger.sql in Supabase SQL Editor';
    RAISE NOTICE '  2. Or apply migration 20250205000002_fix_ambiguous_column.sql';
    RAISE NOTICE '';
    RAISE NOTICE 'The fix renames the variable to v_user_email to avoid conflict.';
  ELSIF NOT trigger_enabled THEN
    RAISE WARNING '❌ PROBLEM IDENTIFIED: Trigger is disabled';
    RAISE NOTICE 'SOLUTION: Enable the trigger or recreate it.';
  ELSE
    RAISE NOTICE '✅ Function appears correct. Check RLS policies or other issues.';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END;
$$;

-- Also check RLS policies that might block the trigger
DO $$
DECLARE
  policy_count int;
BEGIN
  RAISE NOTICE 'Checking RLS policies on workspace_users...';
  
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'workspace_users';
  
  RAISE NOTICE 'Found % RLS policies on workspace_users', policy_count;
  
  -- Check if there are any restrictive policies
  IF policy_count > 0 THEN
    RAISE NOTICE 'ℹ️  Note: RLS policies exist. The trigger function uses';
    RAISE NOTICE '   SECURITY DEFINER, so it should bypass RLS, but verify';
    RAISE NOTICE '   that policies allow inserts from the trigger context.';
  END IF;
END;
$$;

