# Campus Connect API Documentation

**Base URL:** `http://localhost:8000/api`

---

## Authentication Routes

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
  "first_name": "John",
  "last_name": "Doe",
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

## 📋 Auth Summary

| Method | Endpoint                | Description            | Auth Required |
| ------ | ----------------------- | ---------------------- | ------------- |
| POST   | `/auth/register`        | Register new user      | No            |
| POST   | `/auth/login`           | User login             | No            |
| POST   | `/auth/verify-otp`      | Verify email OTP       | No            |
| POST   | `/auth/resend-otp`      | Resend OTP             | No            |
| POST   | `/auth/forgot-password` | Request password reset | No            |
| POST   | `/auth/reset-password`  | Reset password         | No            |
| GET    | `/health`               | API health check       | No            |

Here’s your **Campus Connect User API** documentation formatted cleanly in **Markdown**, with a full endpoint summary list at the end 👇

---

# Campus Connect – User Profile & Social Features API

## Overview

This API handles user profile management, interests, courses, and social discovery features for **Campus Connect**, fostering collaboration and involvement between university students.

---

## Authentication

All endpoints (unless otherwise noted) require a valid **JWT token** in the request header:

```http
Authorization: Bearer <your_jwt_token>
```

---

## User Profile Endpoints

### Get User Profile

**GET** `/api/users/profile`

Retrieve the authenticated user’s full profile.

**Response:**

```json
{
  "message": "Profile retrieved successfully",
  "user": {
    "id": "user_550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@stanford.edu",
    "first_name": "John",
    "last_name": "Doe",
    "profile_picture_url": "https://example.com/profile.jpg",
    "phone_number": "+1234567890",
    "program": "Computer Science",
    "bio": "Passionate about AI and machine learning",
    "year_of_study": "3",
    "graduation_year": 2025,
    "interests": ["AI", "Basketball", "Photography"]
  }
}
```

---

### 2️ Update User Profile

**PUT** `/api/users/profile`

Update the user’s profile information.

**Request Body:**

```json
{
  "first_name": "John",
  "last_name": "Smith",
  "bio": "Updated bio about my interests",
  "graduation_year": 2025,
  "profile_headline": "AI Research Assistant"
}
```

**Response:**

```json
{
  "message": "Profile updated successfully",
  "updated": true
}
```

---

### 3️Get User Statistics

**GET** `/api/users/stats`

Retrieve user engagement data such as connections, groups, and events.

**Response:**

```json
{
  "message": "User statistics retrieved successfully",
  "stats": {
    "connections": 24,
    "groups": 5,
    "events": 8,
    "total_engagement": 37
  }
}
```

---

## 🔍 User Discovery

### 4️ Search Users

**GET** `/api/users/search?q=Computer+Science&limit=20`

Search users by name, program, or university.

**Response:**

```json
{
  "message": "Users retrieved successfully",
  "count": 15,
  "users": [
    {
      "id": "user_550e8400-e29b-41d4-a716-446655440001",
      "first_name": "Sarah",
      "last_name": "Chen",
      "program": "Computer Science"
    }
  ]
}
```

---

### 5️ Connection Recommendations

**GET** `/api/users/recommendations?limit=10`

Return potential users the current user might want to connect with.

---

## 🎯 Interests Management

### 6️ Add Interest

**POST** `/api/users/interests`

**Request Body:**

```json
{
  "interest_type": "academic",
  "interest_name": "Artificial Intelligence",
  "skill_level": "intermediate"
}
```

**Response:**

```json
{
  "message": "Interest added successfully",
  "interest": {
    "interest_id": "int_550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

### 7️ Remove Interest

**DELETE** `/api/users/interests/:interestId`

Removes an interest from the user’s profile.

---

## 📚 Course Management

### 8️ Add Course

**POST** `/api/users/courses`

**Request Body:**

```json
{
  "course_code": "CS101",
  "course_name": "Introduction to Computer Science",
  "department_id": "dept_cs",
  "semester": "Fall 2024"
}
```

---

### 9️ Remove Course

**DELETE** `/api/users/courses/:courseId`

Remove a specific course.

---

## 🤝 Social Connections

### 10️ Send Connection Request

**POST** `/api/users/connections/request`

```json
{
  "receiver_id": "user_550e8400-e29b-41d4-a716-446655440001"
}
```

---

### 11️ Respond to Connection Request

**POST** `/api/users/connections/respond`

---

### 12️ Get User Connections

**GET** `/api/users/connections?status=accepted`

---

## 🧾 Public Profiles

### 13️ Get User by ID

**GET** `/api/users/:userId`

Retrieve public details of another user.

---

## 🚀 Testing Sequence

1. Register / Login → Get JWT token
2. `GET /users/profile` → Verify user data
3. `PUT /users/profile` → Update information
4. `POST /users/interests` → Add interests
5. `POST /users/courses` → Add courses
6. `GET /users/search` → Search for users
7. `POST /users/connections/request` → Connect
8. `GET /users/stats` → View metrics

---

## 📘 User Summary

| #   | Method | Endpoint                           | Description                |
| --- | ------ | ---------------------------------- | -------------------------- |
| 1   | GET    | `/api/users/profile`               | Get user profile           |
| 2   | PUT    | `/api/users/profile`               | Update profile             |
| 3   | GET    | `/api/users/stats`                 | Get user statistics        |
| 4   | GET    | `/api/users/search`                | Search users               |
| 5   | GET    | `/api/users/recommendations`       | Connection recommendations |
| 6   | POST   | `/api/users/interests`             | Add an interest            |
| 7   | DELETE | `/api/users/interests/:interestId` | Remove an interest         |
| 8   | POST   | `/api/users/courses`               | Add a course               |
| 9   | DELETE | `/api/users/courses/:courseId`     | Remove a course            |
| 10  | POST   | `/api/users/connections/request`   | Send connection request    |
| 11  | POST   | `/api/users/connections/respond`   | Respond to connection      |
| 12  | GET    | `/api/users/connections`           | Get user connections       |
| 13  | GET    | `/api/users/:userId`               | Get public user profile    |
