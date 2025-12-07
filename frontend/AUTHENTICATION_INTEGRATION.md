# 🔐 Frontend Authentication Integration

Complete integration of BidHub backend authentication with React frontend.

## ✅ Features Implemented

### 🔑 Authentication

- ✅ **Email/Password Login** - Traditional authentication
- ✅ **User Registration** - With validation
- ✅ **OTP Verification** - Email-based verification after registration
- ✅ **Google OAuth 2.0** - Sign in with Google
- ✅ **JWT Token Management** - Access & refresh tokens
- ✅ **Protected Routes** - Auth context for route protection
- ✅ **Auto-login** - Remember user session

### 📋 Components Created

1. **`lib/api.ts`** - Base API client with token management
2. **`lib/auth.ts`** - Authentication service functions
3. **`contexts/AuthContext.tsx`** - Global auth state management
4. **`components/auth/otp-verification-dialog.tsx`** - OTP verification modal
5. **`pages/GoogleCallbackPage.tsx`** - Handle Google OAuth redirect
6. **Updated `login-form.tsx`** - Connected to backend API
7. **Updated `register-form.tsx`** - Connected to backend API with OTP flow

---

## 🚀 Setup & Usage

### 1. Environment Variables

Create `.env` file in frontend root:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3000
```

### 2. Install Dependencies

```bash
cd frontend
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

---

## 📖 User Flows

### Flow 1: Register with Email

```
1. User visits /register
2. Fill form:
   - Full Name
   - Email
   - Address
   - Date of Birth
   - Password
   - Confirm Password
3. Click "Create Account"
4. Backend sends OTP to email
5. OTP Dialog opens
6. User enters 6-digit OTP
7. Click "Verify OTP"
8. Auto-login with JWT tokens
9. Redirect to /browse
```

**OTP Dialog Features:**

- Auto-focus on input
- Numeric-only input (6 digits)
- Resend OTP button with 60s cooldown
- Error messages
- Real-time validation

### Flow 2: Login with Email/Password

```
1. User visits /login
2. Enter email & password
3. Click "Sign in"
4. Receive JWT tokens
5. Save to localStorage
6. Update AuthContext
7. Redirect based on role:
   - Admin → /admin
   - Seller → /seller
   - Bidder → /browse
```

### Flow 3: Login with Google

```
1. User visits /login
2. Click "Continue with Google"
3. Redirect to Google OAuth
4. User selects Google account
5. Grant permissions
6. Redirect to /auth/google/success with tokens
7. Parse tokens & save
8. Update AuthContext
9. Redirect to /browse (or role-specific page)
```

---

## 🔧 API Integration

### Authentication Service (`lib/auth.ts`)

```typescript
import { register, login, verifyOTP, resendOTP } from "@/lib/auth";

// Register
const response = await register({
  full_name: "John Doe",
  email: "john@example.com",
  password: "password123",
  address: "123 Main St",
  date_of_birth: "1990-01-01",
});

// Verify OTP
const authData = await verifyOTP({
  email: "john@example.com",
  otp: "123456",
});

// Login
const authData = await login({
  email: "john@example.com",
  password: "password123",
});

// Resend OTP
await resendOTP("john@example.com");
```

### Using Auth Context

```typescript
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <p>Please login</p>;
  }

  return (
    <div>
      <p>Welcome, {user.full_name}!</p>
      <p>Role: {user.role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### API Client (`lib/api.ts`)

```typescript
import { api } from "@/lib/api";

// GET request
const products = await api.get("/products");

// POST request
const newProduct = await api.post("/products", {
  title: "Product",
  price: 100,
});

// PUT request
await api.put("/products/1", { title: "Updated" });

// DELETE request
await api.delete("/products/1");
```

**Features:**

- Auto-attach JWT token to requests
- Auto-handle errors
- TypeScript typed responses
- Centralized base URL

---

## 🎨 UI Components

### Login Form

**File:** `components/auth/login-form.tsx`

**Features:**

- Email & password validation
- Error messages
- Loading state
- Google OAuth button
- Forgot password link
- Sign up link

**Usage:**

```tsx
import { LoginForm } from "@/components/auth/login-form";

<LoginForm />;
```

### Register Form

**File:** `components/auth/register-form.tsx`

**Features:**

- Full form validation
- Age verification (18+)
- Password confirmation
- Date picker for DOB
- OTP verification dialog integration
- Error messages per field

**Usage:**

```tsx
import { RegisterForm } from "@/components/auth/register-form";

<RegisterForm />;
```

### OTP Verification Dialog

**File:** `components/auth/otp-verification-dialog.tsx`

**Features:**

- Modal dialog
- 6-digit numeric input
- Auto-focus
- Resend OTP with cooldown timer
- Error handling
- Loading states

**Usage:**

```tsx
import { OTPVerificationDialog } from "@/components/auth/otp-verification-dialog";

<OTPVerificationDialog
  open={showOTP}
  onOpenChange={setShowOTP}
  email="user@example.com"
  onVerified={(authData) => {
    // Handle successful verification
    saveAuthData(authData);
    navigate("/browse");
  }}
/>;
```

---

## 🔒 Token Management

### Storage

Tokens are stored in `localStorage`:

```typescript
localStorage.setItem("access_token", token);
localStorage.setItem("refresh_token", token);
localStorage.setItem("user", JSON.stringify(user));
```

### Auto-Attach to Requests

API client automatically attaches `Authorization: Bearer <token>` to all requests except `/auth/*` endpoints.

### Logout

```typescript
import { logout } from "@/lib/auth";

// Clear all auth data
logout();
```

This removes:

- `access_token`
- `refresh_token`
- `user` object

---

## 🛡️ Protected Routes

### Create Protected Route Component

```tsx
// components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

### Usage in App.tsx

```tsx
import { ProtectedRoute } from "@/components/ProtectedRoute";

<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  }
/>;
```

---

## 🧪 Testing

### Test Accounts

Use these test accounts from backend seed data:

```
Admin:
Email: admin@bidhub.com
Password: admin123

Seller:
Email: seller1@example.com
Password: password123

Bidder:
Email: bidder1@example.com
Password: password123
```

### Test Registration Flow

1. Open `http://localhost:5173/register`
2. Fill all fields
3. Use a real email (for OTP)
4. Click "Create Account"
5. Check email for OTP code
6. Enter OTP in dialog
7. Should auto-login and redirect

### Test Google OAuth

1. Open `http://localhost:5173/login`
2. Click "Continue with Google"
3. Should redirect to Google
4. Select account
5. Should redirect back to app
6. Should auto-login

**Note:** Requires backend Google OAuth configured.

---

## 🐛 Troubleshooting

### Issue: "Cannot find module '@/lib/auth'"

**Solution:** Check `tsconfig.json` has path alias:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue: "Network Error" on API calls

**Solutions:**

1. Check backend is running on port 3000
2. Check CORS enabled in backend
3. Verify `VITE_API_URL` in `.env`
4. Check browser console for CORS errors

### Issue: OTP not received

**Solutions:**

1. Check backend email configuration
2. Verify SMTP settings in backend `.env`
3. Check spam folder
4. Use resend OTP button

### Issue: Google OAuth redirect fails

**Solutions:**

1. Check `GOOGLE_CALLBACK_URL` in backend `.env`
2. Verify authorized redirect URIs in Google Console
3. Check `FRONTEND_URL` in backend `.env` points to `http://localhost:5173`
4. Ensure route `/auth/google/success` exists in frontend

### Issue: Token expired

**Solution:** Implement token refresh logic:

```typescript
// In api.ts, add interceptor
if (response.status === 401) {
  const refreshToken = localStorage.getItem("refresh_token");
  if (refreshToken) {
    const newToken = await refreshAccessToken(refreshToken);
    // Retry original request with new token
  }
}
```

---

## 📚 API Endpoints Reference

### POST `/auth/register`

```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "address": "123 Main St",
  "date_of_birth": "1990-01-01"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP sent to email",
  "data": {
    "email": "john@example.com"
  }
}
```

### POST `/auth/verify-otp`

```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbG...",
    "refresh_token": "eyJhbG...",
    "user": {
      "id": 1,
      "email": "john@example.com",
      "full_name": "John Doe",
      "role": "bidder"
    }
  }
}
```

### POST `/auth/resend-otp`

```json
{
  "email": "john@example.com"
}
```

### POST `/auth/login`

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** Same as verify-otp

### GET `/auth/google`

Initiates Google OAuth flow (redirect)

### GET `/auth/google/callback`

Handles Google OAuth callback (redirect)

---

## 🎯 Next Steps

### Recommended Enhancements

1. **Token Refresh Logic**

   - Auto-refresh expired tokens
   - Handle 401 responses

2. **Remember Me**

   - Checkbox on login
   - Longer token expiry

3. **Forgot Password**

   - Password reset flow
   - Email verification

4. **Email Verification Resend**

   - For unverified accounts
   - Resend verification link

5. **Profile Management**

   - Edit user profile
   - Change password
   - Avatar upload

6. **Role-based UI**

   - Show different navigation for roles
   - Hide features based on permissions

7. **Session Timeout**
   - Auto-logout after inactivity
   - Warning before logout

---

## 📝 Code Examples

### Protected API Call

```typescript
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

async function fetchMyProducts() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    throw new Error("Not authenticated");
  }

  const response = await api.get("/seller/products");
  return response.data;
}
```

### Conditional Rendering

```tsx
import { useAuth } from "@/contexts/AuthContext";

function Navigation() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav>
      {isAuthenticated ? (
        <>
          <span>Welcome, {user.full_name}</span>
          {user.role === "seller" && <Link to="/seller">My Products</Link>}
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      )}
    </nav>
  );
}
```

---

## ✅ Checklist

- [x] API client with token management
- [x] Auth service functions
- [x] Auth context provider
- [x] Login form with backend integration
- [x] Register form with validation
- [x] OTP verification dialog
- [x] Google OAuth integration
- [x] Google callback page
- [x] Token storage in localStorage
- [x] Auto-attach tokens to requests
- [x] Error handling with toasts
- [x] Loading states
- [x] Form validation
- [x] Age verification (18+)
- [x] Redirect after login based on role
- [x] Environment variables setup

---

**🎉 Frontend authentication is complete and ready to use!**

For questions or issues, check the backend API documentation or open an issue.
