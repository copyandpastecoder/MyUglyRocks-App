# Authentication Wireframe

> **URLs:** `/login`, `/register`, `/forgot-password`, `/reset-password/:token`, `/verify-email/:token`
> **Auth Required:** No (public pages)
> **Priority:** P0 (MVP)

---

## 1. Overview

Authentication pages handle user registration, login, and password management. These are standalone pages with minimal navigation.

### Auth Pages
- `/login` - User login form
- `/register` - New user registration
- `/forgot-password` - Request password reset
- `/reset-password/:token` - Set new password
- `/verify-email/:token` - Email verification landing

---

## 2. Login Page

### 2.1 Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                                                                                 │
│                                                                                 │
│                           ┌─────────────────────────────────────┐              │
│                           │                                     │              │
│                           │        [MyUglyRocks Logo]           │              │
│                           │                                     │              │
│                           │        Welcome Back                 │              │
│                           │        Log in to your account       │              │
│                           │                                     │              │
│                           │  Email                              │              │
│                           │  ┌───────────────────────────────┐  │              │
│                           │  │ rockfan42@example.com         │  │              │
│                           │  └───────────────────────────────┘  │              │
│                           │                                     │              │
│                           │  Password                           │              │
│                           │  ┌───────────────────────────────┐  │              │
│                           │  │ ••••••••••••••           [👁]│  │              │
│                           │  └───────────────────────────────┘  │              │
│                           │                                     │              │
│                           │  [ ] Remember me   Forgot password? │              │
│                           │                                     │              │
│                           │  ┌───────────────────────────────┐  │              │
│                           │  │          [ Log In ]           │  │              │
│                           │  └───────────────────────────────┘  │              │
│                           │                                     │              │
│                           │  ──────────────────────────────────│              │
│                           │                                     │              │
│                           │  Don't have an account?             │              │
│                           │  [ Create Account ]                 │              │
│                           │                                     │              │
│                           └─────────────────────────────────────┘              │
│                                                                                 │
│                                                                                 │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Mobile Layout

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│    [MyUglyRocks Logo]           │
│                                 │
│    Welcome Back                 │
│    Log in to your account       │
│                                 │
│    Email                        │
│    ┌─────────────────────────┐  │
│    │                         │  │
│    └─────────────────────────┘  │
│                                 │
│    Password                     │
│    ┌─────────────────────────┐  │
│    │                    [👁] │  │
│    └─────────────────────────┘  │
│                                 │
│    [ ] Remember me              │
│    Forgot password?             │
│                                 │
│    ┌─────────────────────────┐  │
│    │       [ Log In ]        │  │
│    └─────────────────────────┘  │
│                                 │
│    ────────────────────────     │
│                                 │
│    Don't have an account?       │
│    [ Create Account ]           │
│                                 │
│                                 │
└─────────────────────────────────┘
```

---

## 3. Register Page

### 3.1 Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                                                                                 │
│                           ┌─────────────────────────────────────┐              │
│                           │                                     │              │
│                           │        [MyUglyRocks Logo]           │              │
│                           │                                     │              │
│                           │        Create Account               │              │
│                           │        Join the rock tumbling       │              │
│                           │        community                    │              │
│                           │                                     │              │
│                           │  Email *                            │              │
│                           │  ┌───────────────────────────────┐  │              │
│                           │  │                               │  │              │
│                           │  └───────────────────────────────┘  │              │
│                           │                                     │              │
│                           │  Username *                         │              │
│                           │  ┌───────────────────────────────┐  │              │
│                           │  │                               │  │              │
│                           │  └───────────────────────────────┘  │              │
│                           │  Your profile URL: myuglyrocks.com/ │              │
│                           │  user/[username]                    │              │
│                           │                                     │              │
│                           │  Password *                         │              │
│                           │  ┌───────────────────────────────┐  │              │
│                           │  │                          [👁] │  │              │
│                           │  └───────────────────────────────┘  │              │
│                           │                                     │              │
│                           │  ✅ At least 8 characters           │              │
│                           │  ✅ One uppercase letter            │              │
│                           │  ⬜ One lowercase letter            │              │
│                           │  ⬜ One number                      │              │
│                           │  ⬜ One special character           │              │
│                           │                                     │              │
│                           │  Confirm Password *                 │              │
│                           │  ┌───────────────────────────────┐  │              │
│                           │  │                          [👁] │  │              │
│                           │  └───────────────────────────────┘  │              │
│                           │                                     │              │
│                           │  [ ] I agree to the Terms of        │              │
│                           │      Service and Privacy Policy     │              │
│                           │                                     │              │
│                           │  ┌───────────────────────────────┐  │              │
│                           │  │      [ Create Account ]       │  │              │
│                           │  └───────────────────────────────┘  │              │
│                           │                                     │              │
│                           │  ──────────────────────────────────│              │
│                           │                                     │              │
│                           │  Already have an account?           │              │
│                           │  [ Log In ]                         │              │
│                           │                                     │              │
│                           └─────────────────────────────────────┘              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Password Requirements (Real-time Validation)

As user types, show live validation:

```
Password Requirements:
✅ At least 8 characters           (met - green check)
✅ One uppercase letter            (met - green check)
⬜ One lowercase letter            (not met - empty box)
⬜ One number                      (not met - empty box)
⬜ One special character           (not met - empty box)
```

All requirements must be green before form can submit.

---

## 4. Forgot Password Page

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                                                                                 │
│                           ┌─────────────────────────────────────┐              │
│                           │                                     │              │
│                           │        [MyUglyRocks Logo]           │              │
│                           │                                     │              │
│                           │        Reset Password               │              │
│                           │                                     │              │
│                           │  Enter your email address and we'll │              │
│                           │  send you a link to reset your      │              │
│                           │  password.                          │              │
│                           │                                     │              │
│                           │  Email                              │              │
│                           │  ┌───────────────────────────────┐  │              │
│                           │  │                               │  │              │
│                           │  └───────────────────────────────┘  │              │
│                           │                                     │              │
│                           │  ┌───────────────────────────────┐  │              │
│                           │  │    [ Send Reset Link ]        │  │              │
│                           │  └───────────────────────────────┘  │              │
│                           │                                     │              │
│                           │  ──────────────────────────────────│              │
│                           │                                     │              │
│                           │  [ ← Back to Login ]                │              │
│                           │                                     │              │
│                           └─────────────────────────────────────┘              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Success State

After submitting:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                           ┌─────────────────────────────────────┐              │
│                           │                                     │              │
│                           │        [MyUglyRocks Logo]           │              │
│                           │                                     │              │
│                           │        ✅ Check Your Email          │              │
│                           │                                     │              │
│                           │  We've sent a password reset link   │              │
│                           │  to rockfan42@example.com           │              │
│                           │                                     │              │
│                           │  The link will expire in 1 hour.    │              │
│                           │                                     │              │
│                           │  Didn't receive the email?          │              │
│                           │  Check your spam folder or          │              │
│                           │  [ Resend Email ]                   │              │
│                           │                                     │              │
│                           │  ──────────────────────────────────│              │
│                           │                                     │              │
│                           │  [ ← Back to Login ]                │              │
│                           │                                     │              │
│                           └─────────────────────────────────────┘              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Reset Password Page

### 5.1 Valid Token

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                           ┌─────────────────────────────────────┐              │
│                           │                                     │              │
│                           │        [MyUglyRocks Logo]           │              │
│                           │                                     │              │
│                           │        Create New Password          │              │
│                           │                                     │              │
│                           │  Enter a new password for           │              │
│                           │  rockfan42@example.com              │              │
│                           │                                     │              │
│                           │  New Password *                     │              │
│                           │  ┌───────────────────────────────┐  │              │
│                           │  │                          [👁] │  │              │
│                           │  └───────────────────────────────┘  │              │
│                           │                                     │              │
│                           │  ✅ At least 8 characters           │              │
│                           │  ✅ One uppercase letter            │              │
│                           │  ✅ One lowercase letter            │              │
│                           │  ✅ One number                      │              │
│                           │  ✅ One special character           │              │
│                           │                                     │              │
│                           │  Confirm Password *                 │              │
│                           │  ┌───────────────────────────────┐  │              │
│                           │  │                          [👁] │  │              │
│                           │  └───────────────────────────────┘  │              │
│                           │                                     │              │
│                           │  ┌───────────────────────────────┐  │              │
│                           │  │    [ Reset Password ]         │  │              │
│                           │  └───────────────────────────────┘  │              │
│                           │                                     │              │
│                           └─────────────────────────────────────┘              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Invalid/Expired Token

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                           ┌─────────────────────────────────────┐              │
│                           │                                     │              │
│                           │        [MyUglyRocks Logo]           │              │
│                           │                                     │              │
│                           │        ❌ Link Expired              │              │
│                           │                                     │              │
│                           │  This password reset link has       │              │
│                           │  expired or is invalid.             │              │
│                           │                                     │              │
│                           │  Password reset links expire after  │              │
│                           │  1 hour for security.               │              │
│                           │                                     │              │
│                           │  ┌───────────────────────────────┐  │              │
│                           │  │  [ Request New Reset Link ]   │  │              │
│                           │  └───────────────────────────────┘  │              │
│                           │                                     │              │
│                           │  [ ← Back to Login ]                │              │
│                           │                                     │              │
│                           └─────────────────────────────────────┘              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Success State

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                           ┌─────────────────────────────────────┐              │
│                           │                                     │              │
│                           │        [MyUglyRocks Logo]           │              │
│                           │                                     │              │
│                           │        ✅ Password Reset!           │              │
│                           │                                     │              │
│                           │  Your password has been             │              │
│                           │  successfully reset.                │              │
│                           │                                     │              │
│                           │  ┌───────────────────────────────┐  │              │
│                           │  │       [ Log In Now ]          │  │              │
│                           │  └───────────────────────────────┘  │              │
│                           │                                     │              │
│                           └─────────────────────────────────────┘              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Verify Email Page

### 6.1 Verification Success

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                           ┌─────────────────────────────────────┐              │
│                           │                                     │              │
│                           │        [MyUglyRocks Logo]           │              │
│                           │                                     │              │
│                           │        ✅ Email Verified!           │              │
│                           │                                     │              │
│                           │  Thanks for verifying your email.   │              │
│                           │  Your account is now fully active.  │              │
│                           │                                     │              │
│                           │  ┌───────────────────────────────┐  │              │
│                           │  │    [ Go to Dashboard ]        │  │              │
│                           │  └───────────────────────────────┘  │              │
│                           │                                     │              │
│                           └─────────────────────────────────────┘              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Invalid Token

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                           ┌─────────────────────────────────────┐              │
│                           │                                     │              │
│                           │        [MyUglyRocks Logo]           │              │
│                           │                                     │              │
│                           │        ❌ Invalid Link              │              │
│                           │                                     │              │
│                           │  This verification link is invalid  │              │
│                           │  or has already been used.          │              │
│                           │                                     │              │
│                           │  If you haven't verified your email │              │
│                           │  yet, you can request a new link.   │              │
│                           │                                     │              │
│                           │  ┌───────────────────────────────┐  │              │
│                           │  │  [ Resend Verification Email ]│  │              │
│                           │  └───────────────────────────────┘  │              │
│                           │                                     │              │
│                           │  [ ← Back to Login ]                │              │
│                           │                                     │              │
│                           └─────────────────────────────────────┘              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Form States

### 7.1 Input States

| State | Style |
|-------|-------|
| Default | `border-slate-300` |
| Focus | `border-primary ring-2 ring-primary/20` |
| Error | `border-error` |
| Valid | `border-success` (only for password requirements) |

### 7.2 Button States

| State | Style |
|-------|-------|
| Default | Primary button style |
| Disabled | `opacity-50 cursor-not-allowed` |
| Loading | Spinner + "Creating account..." |

### 7.3 Error Messages

Inline below fields:

```
Email
┌─────────────────────────────────────┐
│ invalid@email                       │
└─────────────────────────────────────┘
⚠️ Please enter a valid email address

Username
┌─────────────────────────────────────┐
│ rockfan42                           │
└─────────────────────────────────────┘
⚠️ This username is already taken
```

### 7.4 Login Errors

Show at top of form:

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️ Invalid email or password. Please try again.                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Data Requirements

### 8.1 API Endpoints

| Action | Endpoint |
|--------|----------|
| Login | `POST /api/auth/login` |
| Register | `POST /api/auth/register` |
| Logout | `POST /api/auth/logout` |
| Forgot password | `POST /api/auth/forgot-password` |
| Reset password | `POST /api/auth/reset-password` |
| Verify email | `POST /api/auth/verify-email` |
| Resend verification | `POST /api/auth/resend-verification` |
| Check username | `GET /api/auth/check-username/:username` |

### 8.2 Validation Rules

**Email:**
- Valid email format
- Not already registered (on register)

**Username:**
- 3-30 characters
- Letters, numbers, underscores only
- Not already taken
- Not a reserved word

**Password:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

---

## 9. Interactions

### 9.1 Username Check

Real-time check as user types (debounced):

```
Username
┌─────────────────────────────────────┐
│ rockfan42                    ✅     │  ← Available
└─────────────────────────────────────┘

Username
┌─────────────────────────────────────┐
│ admin                        ❌     │  ← Taken/reserved
└─────────────────────────────────────┘
⚠️ This username is not available
```

### 9.2 Password Toggle

Eye icon toggles password visibility:
- 👁 (eye open) = Show password
- 👁‍🗨 (eye with slash) = Hide password

### 9.3 Remember Me

When checked:
- Sets longer session duration
- Stores preference in localStorage

---

## 10. Post-Registration Flow

After successful registration:

1. Show "Check your email" page
2. User clicks verification link
3. Email verified → Redirect to dashboard
4. Show welcome toast

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                           ┌─────────────────────────────────────┐              │
│                           │                                     │              │
│                           │        [MyUglyRocks Logo]           │              │
│                           │                                     │              │
│                           │        📧 Verify Your Email         │              │
│                           │                                     │              │
│                           │  We've sent a verification email    │              │
│                           │  to rockfan42@example.com           │              │
│                           │                                     │              │
│                           │  Click the link in the email to     │              │
│                           │  activate your account.             │              │
│                           │                                     │              │
│                           │  Didn't receive the email?          │              │
│                           │  [ Resend Verification Email ]      │              │
│                           │                                     │              │
│                           │  ──────────────────────────────────│              │
│                           │                                     │              │
│                           │  Wrong email?                       │              │
│                           │  [ Start Over ]                     │              │
│                           │                                     │              │
│                           └─────────────────────────────────────┘              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Responsive Design

- All auth forms centered on page
- Max width: 400px (mobile: full width with padding)
- Card shadow and rounded corners on desktop
- No card on mobile (flat design)

---

## 12. Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Form labels | All inputs have visible labels |
| Error association | Errors linked with `aria-describedby` |
| Password requirements | Announced as list, status updates announced |
| Focus management | First input focused on page load |
| Submit feedback | Loading state announced |
| Keyboard navigation | Tab order logical, Enter submits |

---

## 13. Implementation Notes

### 13.1 Component Files

```
app/(auth)/
├── login/
│   └── page.tsx
├── register/
│   └── page.tsx
├── forgot-password/
│   └── page.tsx
├── reset-password/
│   └── [token]/
│       └── page.tsx
└── verify-email/
    └── [token]/
        └── page.tsx

components/auth/
├── AuthCard.tsx              # Wrapper card component
├── LoginForm.tsx
├── RegisterForm.tsx
├── ForgotPasswordForm.tsx
├── ResetPasswordForm.tsx
├── PasswordInput.tsx         # With toggle visibility
├── PasswordRequirements.tsx  # Live validation display
└── UsernameInput.tsx         # With availability check
```

### 13.2 Redirect Logic

| Scenario | Redirect |
|----------|----------|
| Logged-in user visits `/login` | → `/dashboard` |
| Logged-in user visits `/register` | → `/dashboard` |
| Successful login | → `/dashboard` (or returnUrl) |
| Successful registration | → `/verify-email-sent` |
| Successful email verification | → `/dashboard` |
| Successful password reset | → `/login` |

---

## 14. Related Documents

- [05-API-SPEC.md](../05-API-SPEC.md) - Auth API endpoints
- [06-ARCHITECTURE.md](../06-ARCHITECTURE.md) - Authentication flow
- [00-design-system.md](./00-design-system.md) - Form components
