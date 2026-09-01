# First login — OTP → set new password

How a newly created user turns their emailed temporary password into a real one.
Mirrors `trade-harmonizer`'s `src/app/(auth)/(login)/setup-password/setup-password-form.tsx`
(single file, two steps) — same copy, same layout, split across two routes here.

## Flow

1. **Login** (`src/pages/auth/LoginPage.tsx`) — the user signs in with the
   temporary password from their email. The API rejects it with `403` and a
   message matching `/first login/i`; `isFirstLoginSetupError` catches that,
   stores `{ email }` and routes to `/first-login/verify-otp`.
2. **OTP** (`FirstLoginVerifyOtpPage.tsx`) — six single-digit boxes with
   auto-advance, backspace-to-previous and a 6-digit paste handler; a 5-minute
   countdown gates the "Resend Code" button. Verifying returns a `setupToken`.
3. **Set new password** (`FirstLoginSetupPasswordPage.tsx`) — three fields:
   the temporary password (re-typed by the user), the new password with the
   live `PasswordRules` pills, and confirm. Submitting clears the flow state,
   dispatches `logout()` and shows `PasswordSuccessPopup` → "Go to Login".

`first-login-flow.ts` carries `{ email, setupToken? }` between the screens in
`sessionStorage` (`recovery:first-login-flow`), with router `location.state`
preferred when present. **It deliberately stores no password** — the temporary
password is re-typed on step 3 rather than captured at login, matching
trade-harmonizer and keeping credentials out of web storage.

Both routes sit under `GuestRoute` in `src/app/router.tsx`, so an authenticated
user never reaches them.

## Demo mode (temporary)

The `/recovery/auth/first-login/*` endpoints do not exist yet. Until they do,
`src/pages/auth/first-login-mock.ts` answers for a single demo account entirely
client-side so the UI can be reviewed and demoed.

**It is on by default under `npm start`** (`NODE_ENV=development`) and off in
`npm run build` (`NODE_ENV=production`), so no setup is needed to demo the flow
and it can't reach a deployed environment. Override either way in `.env.local`:

```
REACT_APP_FIRST_LOGIN_MOCK=false   # local dev against the real login API
# optional — these are the defaults
REACT_APP_FIRST_LOGIN_MOCK_EMAIL=shahzad.abbas@devexcelit.com
REACT_APP_FIRST_LOGIN_MOCK_PASSWORD=Test@123
```

While it's on:

- The demo email + password skips the network and lands on the OTP screen. The
  demo email with any other password shows the invalid-credentials toast.
- **Any other email still hits the real login API**, unchanged.
- Any 6-digit OTP verifies; `000000` fails, so the error state is demoable.
- Step 3 accepts only the temporary password above; anything else errors.

With it off (production builds, or `REACT_APP_FIRST_LOGIN_MOCK=false`) the mock
module is inert and all three screens use the RTK Query hooks in
`recoveryApi.ts`.

### Removing the mock when the API lands

1. Delete `src/pages/auth/first-login-mock.ts` and
   `src/pages/auth/first-login-flow.test.tsx`.
2. Remove the three `isFirstLoginMockEnabled()` branches — one each in
   `LoginPage.tsx`, `FirstLoginVerifyOtpPage.tsx`,
   `FirstLoginSetupPasswordPage.tsx` (each marked `TEMPORARY`).
3. Drop `firstLoginMock*` from `src/utils/env.ts` and the flags from `.env*`.
4. Confirm the real contracts against the backend — in particular whether login
   still signals first-login with a `403` + message (a structured flag such as
   trade-harmonizer's `content.passwordResetRequired` would be sturdier than the
   message regex in `isFirstLoginSetupError`), and whether verify-otp really
   returns `setupToken` as `FirstLoginVerifyOtpContent` assumes.
