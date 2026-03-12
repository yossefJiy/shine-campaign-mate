

## Problem Analysis

Alex logged in successfully (auth user `363ef952-8de0-4e2a-a161-5bde218a8952`, email `studio@jiy.co.il`) but sees no data. Two root causes:

### Root Cause 1: Authentication is disabled in App.tsx
`ProtectedRoute` is commented out. Alex lands on the dashboard without going through login, so the browser has no active Supabase session. All API requests use the anonymous key (no `auth.uid()`), and every RLS policy returns empty results.

### Root Cause 2: Alex and Milan have no `user_roles` entries
Only Yosef has a row in `user_roles`. The `sync_team_member_access` trigger creates `user_roles` entries on team UPDATE, but it likely didn't fire correctly when `link_team_member_on_signup` set the `user_id`. Without a `user_roles` entry, even with a valid session, `has_role_level()` would fail for Alex and Milan — blocking access to `clients`, `team`, `tasks`, and `projects`.

**Current state:**
| User | auth.users | user_roles | user_privileges |
|------|-----------|------------|-----------------|
| Yosef | ✅ | ✅ department_manager | ✅ super_admin |
| Alex | ✅ | ❌ MISSING | ❌ MISSING |
| Milan | ✅ | ❌ MISSING | ❌ MISSING |

## Plan (2 steps)

### Step 1: Re-enable authentication in App.tsx
- Uncomment the `ProtectedRoute` import
- Wrap all protected routes with `<ProtectedRoute>` (keep `/auth`, `/set-password`, `/p/:token` public)
- This forces login → valid JWT → `auth.uid()` works in RLS

### Step 2: Insert missing `user_roles` for Alex and Milan
Run a database migration to:
- Insert `user_roles` for Alex (`363ef952-8de0-4e2a-a161-5bde218a8952`, `department_manager`)
- Insert `user_roles` for Milan (`4b886331-50a7-4aab-9032-27a84b4bdc79`, `department_manager`)
- Use `ON CONFLICT DO NOTHING` for safety

After these two changes, Alex and Milan will be redirected to `/auth`, log in with their credentials, and see all their assigned data.

