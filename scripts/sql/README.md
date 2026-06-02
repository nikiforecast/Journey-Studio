# Ad-hoc SQL scripts

One-off maintenance and diagnostic scripts for Supabase SQL Editor. Prefer [`supabase/migrations/`](../supabase/migrations/) for schema changes that should be versioned.

| Script | Purpose |
|--------|---------|
| `diagnose_signup_issue.sql` | Diagnose signup trigger problems |
| `fix_signup_trigger.sql` | Repair signup trigger |
| `test_signup_trigger.sql` | Test signup trigger |
| `validate_trigger.sql` | Validate trigger configuration |
| `verify_user_in_database.sql` | Confirm user records after signup |
| `ADD_USER_TRACKING_TO_JOURNEYS.sql` | Add user tracking columns |
| `CHECK_AND_ADD_USER_TRACKING.sql` | Check and add user tracking |
| `fix_research_note_comments.sql` | Fix research note comments data |

See also [docs/troubleshooting/SIGNUP_ISSUE_ANALYSIS.md](../docs/troubleshooting/SIGNUP_ISSUE_ANALYSIS.md).
