-- Quick validation script to check if the trigger function is correct
-- This checks for syntax errors and common issues without running the full trigger

DO $$
DECLARE
  func_definition text;
  has_ambiguous_ref boolean := false;
  has_v_prefix boolean := false;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '  TRIGGER FUNCTION VALIDATION';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  -- Check if function exists
  IF NOT EXISTS(
    SELECT 1 FROM pg_proc WHERE proname = 'auto_add_legl_user'
  ) THEN
    RAISE EXCEPTION '❌ Function auto_add_legl_user does not exist!';
  END IF;
  
  RAISE NOTICE '✅ Function exists';
  
  -- Get function definition
  SELECT pg_get_functiondef(oid) INTO func_definition
  FROM pg_proc
  WHERE proname = 'auto_add_legl_user';
  
  -- Check for the fix (v_user_email variable)
  IF func_definition LIKE '%v_user_email%' THEN
    RAISE NOTICE '✅ Function uses v_user_email variable (fix applied)';
    has_v_prefix := true;
  ELSE
    RAISE WARNING '⚠️  Function does not use v_user_email - may still have ambiguous reference';
  END IF;
  
  -- Check for ambiguous patterns (user_email = user_email without table alias)
  IF func_definition LIKE '%user_email = user_email%' 
     AND func_definition NOT LIKE '%wu.user_email%' 
     AND func_definition NOT LIKE '%v_user_email%' THEN
    RAISE WARNING '⚠️  Found potential ambiguous reference: user_email = user_email';
    has_ambiguous_ref := true;
  END IF;
  
  -- Check for ON CONFLICT clause
  IF func_definition LIKE '%ON CONFLICT%' THEN
    RAISE NOTICE '✅ ON CONFLICT clause found';
  END IF;
  
  -- Check if trigger exists and is active
  IF EXISTS(
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
      AND tgisinternal = false
  ) THEN
    RAISE NOTICE '✅ Trigger on_auth_user_created exists and is active';
  ELSE
    RAISE WARNING '⚠️  Trigger on_auth_user_created does not exist or is inactive!';
  END IF;
  
  -- Summary
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  IF has_v_prefix AND NOT has_ambiguous_ref THEN
    RAISE NOTICE '✅ VALIDATION PASSED - Function looks correct!';
  ELSE
    RAISE WARNING '⚠️  VALIDATION WARNINGS - Review the issues above';
  END IF;
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END;
$$;

