# Campus Connect API Documentation

**Base URL:** `http://localhost:8000/api`

---

## 🔐 Authentication Routes

### 1. Register User

**POST** `/auth/register`

Register a new student account.

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "name": "John Doe",
  "email": "john@stanford.edu",
  "password": "SecurePass123!",
  "university_id": "uni_1"
}
```

**Success Response (201):**

```json
{
  "message": "User registered successfully. Please verify your email.",
  "userId": "user_123",
  "emailSent": true,
  "emailVerified": false
}
```

**Error Responses:**

- `400` - Validation failed
- `409` - Email already registered
- `500` - Internal server error

---

### 2. Login User

**POST** `/auth/login`

Authenticate user and get JWT token.

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "email": "john@stanford.edu",
  "password": "SecurePass123!"
}
```

**Success Response (200):**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@stanford.edu",
    "university_id": "uni_1"
  }
}
```

**Error Responses:**

- `400` - Validation failed
- `401` - Invalid credentials
- `403` - Email not verified
- `500` - Internal server error

---

### 3. Verify OTP

**POST** `/auth/verify-otp`

Verify email with OTP sent during registration.

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "email": "john@stanford.edu",
  "otp": "123456"
}
```

**Success Response (200):**

```json
{
  "message": "Email verified successfully",
  "emailVerified": true
}
```

**Error Responses:**

- `400` - Invalid or expired OTP
- `500` - Internal server error

---

### 4. Resend OTP

**POST** `/auth/resend-otp`

Request a new OTP for email verification.

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "email": "john@stanford.edu"
}
```

**Success Response (200):**

```json
{
  "message": "OTP sent successfully",
  "emailSent": true
}
```

**Error Responses:**

- `400` - Validation failed
- `404` - Email not found
- `500` - Internal server error

---

### 5. Forgot Password

**POST** `/auth/forgot-password`

Request password reset link.

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "email": "john@stanford.edu"
}
```

**Success Response (200):**

```json
{
  "message": "If the email exists, a password reset link has been sent",
  "emailSent": true
}
```

**Note:** Always returns 200 for security (doesn't reveal if email exists)

---

### 6. Reset Password

**POST** `/auth/reset-password`

Reset password using token from email.

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "password": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

**Success Response (200):**

```json
{
  "message": "Password reset successfully",
  "passwordUpdated": true
}
```

**Error Responses:**

- `400` - Invalid or expired token
- `404` - User not found
- `500` - Internal server error

---

## 🩺 Health Check

### 7. Health Check

**GET** `/health`

Check if API is running.

**Success Response (200):**

```json
{
  "message": "API is healthy"
}
```

---

## 🚀 Testing Sequence

### Complete User Flow:

1. **Register** → Get user ID
2. **Check email** for OTP (or check console logs in development)
3. **Verify OTP** → Email verified
4. **Login** → Get JWT token
5. **Use token** in Authorization header for protected routes

### Password Reset Flow:

1. **Forgot Password** → Get reset token (in development mode)
2. **Reset Password** → Password updated
3. **Login** with new password

---

## 🔧 Environment Setup

### Required Environment Variables:(as may be seen in the .env.example)

```env
JWT_SECRET=your_jwt_secret_key
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=campus_connect
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
CLIENT_URL=http://localhost:3000
PORT=8000
```

---

## 📋 API Summary

| Method | Endpoint                | Description            | Auth Required |
| ------ | ----------------------- | ---------------------- | ------------- |
| POST   | `/auth/register`        | Register new user      | No            |
| POST   | `/auth/login`           | User login             | No            |
| POST   | `/auth/verify-otp`      | Verify email OTP       | No            |
| POST   | `/auth/resend-otp`      | Resend OTP             | No            |
| POST   | `/auth/forgot-password` | Request password reset | No            |
| POST   | `/auth/reset-password`  | Reset password         | No            |
| GET    | `/health`               | API health check       | No            |
