# Journey Studio documentation

Project docs are grouped by topic. Start here rather than the repo root.

## Deployment and hosting

- [Background functions summary](deployment/BACKGROUND_FUNCTIONS_SUMMARY.md)
- [Deploy background functions](deployment/DEPLOY_BACKGROUND_FUNCTIONS.md)
- [Deploy image import fix](deployment/DEPLOY_IMAGE_IMPORT_FIX.md)
- [Deploy Auth0 edge function](deployment/DEPLOY_AUTH0_EDGE_FUNCTION.md)
- [Netlify production setup](deployment/NETLIFY_PRODUCTION_SETUP.md)
- [Environment variables](deployment/ENVIRONMENT_VARIABLES_GUIDE.md)
- [Check Netlify env vars](deployment/CHECK_NETLIFY_ENV_VARS.md)
- [Check Netlify plan](deployment/CHECK_NETLIFY_PLAN.md)

## Authentication

- [Supabase Google OAuth setup](auth/SUPABASE_GOOGLE_OAUTH_SETUP.md)
- [Migration to Supabase Auth](auth/MIGRATION_TO_SUPABASE_AUTH.md)
- [Auth0 setup guide (legacy)](auth/AUTH0_SETUP_GUIDE.md)
- [Auth0 + Supabase integration](auth/AUTH0_SUPABASE_INTEGRATION.md)
- [Auth0 CRUD setup](auth/AUTH0_CRUD_SETUP.md)
- [Auth0 email restriction](auth/AUTH0_EMAIL_RESTRICTION.md)
- [Auth0 user tracking fix](auth/AUTH0_USER_TRACKING_FIX.md)
- [Debug Auth0 login](auth/DEBUG_AUTH0_LOGIN.md)
- [Find Supabase service role key](auth/FIND_SUPABASE_SERVICE_ROLE_KEY.md)

## Database

- [Database setup](database/README_DATABASE_SETUP.md)
- [RLS troubleshooting](database/README_RLS_TROUBLESHOOTING.md)
- [Schema import](database/DATABASE_SCHEMA_IMPORT.md)
- [Consolidated schema SQL](database/kyp_database_schema.sql)

## Features

- [AI screenshot import](features/AI_SCREENSHOT_IMPORT.md)
- [AI image import](features/AI_IMAGE_IMPORT_FEATURE.md)
- [Transcript import](features/TRANSCRIPT_IMPORT_FEATURE.md)
- [Drag and drop](features/DRAG_AND_DROP_FEATURE.md)
- [User journey copy/paste](features/USER_JOURNEY_COPY_PASTE_FEATURE.md)
- [Examples implementation plan](features/EXAMPLES_IMPLEMENTATION_PLAN.md)
- [Dynamic user roles](features/DYNAMIC_USER_ROLES.md)
- [Performance optimizations](features/PERFORMANCE_OPTIMIZATIONS.md)

## Troubleshooting

- [Debug steps](troubleshooting/DEBUG_STEPS.md)
- [Troubleshoot background functions](troubleshooting/TROUBLESHOOT_BACKGROUND_FUNCTIONS.md)
- [Signup debugging](troubleshooting/SIGNUP_DEBUGGING.md)
- [Signup issue analysis](troubleshooting/SIGNUP_ISSUE_ANALYSIS.md)

## Architecture

- [Tech stack diagram (SVG)](assets/journey-studio-tech-stack.svg)
- [Tech stack diagram (PNG)](assets/journey-studio-tech-stack.png)

## Scripts

Ad-hoc SQL and maintenance scripts live in [`../scripts/sql/`](../scripts/sql/).

Deploy helper: [`../scripts/deploy.sh`](../scripts/deploy.sh).

## TODO

- [Folder navigation](todo/FOLDER_NAVIGATION_TODO.md)
