

## Fix: Add "Forgot Password" to Login Page

Alex never set a password because the original invitation link bypassed `/set-password` (ProtectedRoute was disabled at the time). The `/set-password` page already handles `PASSWORD_RECOVERY` events correctly, so we just need a way to trigger the reset email.

### What changes

**1. Add "Forgot Password" button to `src/pages/Auth.tsx`**
- Add a "שכחתי סיסמה" (Forgot Password) link below the password field
- On click, call `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/set-password' })`
- Show success toast: "קישור לאיפוס סיסמה נשלח לאימייל שלך"
- Requires the email field to be filled in first

**2. Ensure `/set-password` route is public in `src/App.tsx`**
- Already public (confirmed from previous changes) — no change needed

### How Alex gets in
1. Go to the login page
2. Enter `studio@jiy.co.il` in the email field
3. Click "שכחתי סיסמה"
4. Check email for reset link
5. Click link → lands on `/set-password` → set password → logged in

### Single file change
`src/pages/Auth.tsx` — ~15 lines added (state for forgot-password mode, handler function, UI link)

