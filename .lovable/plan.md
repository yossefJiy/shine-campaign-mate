

## Problem

The password reset email was sent successfully (server returned 200) but never arrived in your inbox -- likely a deliverability issue with the default email service. The old invitation links also expired ("One-time token not found").

You need to get in NOW without waiting for emails.

## Solution: Admin password reset via backend function

Create a temporary backend function that uses the admin API to directly set your password -- no email needed.

### Steps

1. **Create a one-time edge function `admin-reset-password`** that:
   - Accepts a user email and new password
   - Uses the service role key to call `auth.admin.updateUserById()` to set the password directly
   - Protected by a one-time secret token (hardcoded, single-use)
   - Returns success/failure

2. **Deploy and call it once** to set a password for `studio@jiy.co.il`

3. **Delete the edge function immediately after** -- it's a one-time fix, not a permanent feature

### After this
- You'll log in at `/auth` with `studio@jiy.co.il` and your new password
- ProtectedRoute kicks in, session is established, RLS grants access
- All clients, tasks, and team members become visible

### Security
- The function requires a secret token so it can't be called by anyone
- It will be deleted right after use

