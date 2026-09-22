# Campus Connect API Documentation

**Local server:** `http://localhost:8000`

All endpoint paths below are complete and include the `/api` prefix.

---

## Authentication Routes

### 1. Register User

**POST** `/api/auth/register`

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

**POST** `/api/auth/login`

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

**POST** `/api/auth/verify-otp`

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

**POST** `/api/auth/resend-otp`

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

**POST** `/api/auth/forgot-password`

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

**POST** `/api/auth/reset-password`

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

**GET** `/api/health`

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
| POST   | `/api/auth/register`        | Register new user      | No            |
| POST   | `/api/auth/login`           | User login             | No            |
| POST   | `/api/auth/verify-otp`      | Verify email OTP       | No            |
| POST   | `/api/auth/resend-otp`      | Resend OTP             | No            |
| POST   | `/api/auth/forgot-password` | Request password reset | No            |
| POST   | `/api/auth/reset-password`  | Reset password         | No            |
| GET    | `/api/health`               | API health check       | No            |

---

# Campus Connect – User Profile & Social Features API Documentation

---

## Overview

This API manages all user-related features for **Campus Connect**, including profile management, interests, courses, connections, and social discovery.
It enables students to collaborate, connect, and engage meaningfully within their university ecosystem.

---

## Authentication

All endpoints (unless otherwise noted) require a valid **JWT token** in the request header:

```http
Authorization: Bearer <your_jwt_token>
```

---

## 👤 User Profile Management

### 1️⃣ Get User Profile

**GET** `/api/user/profile`
Retrieve the authenticated user’s complete profile, including interests, privacy preferences, and linked social accounts.

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
    "profile_headline": "AI Research Assistant",
    "phone_number": "+1234567890",
    "linkedin_url": "https://linkedin.com/in/johndoe",
    "website_url": "https://johndoe.dev",
    "program": "Computer Science",
    "bio": "Passionate about AI and machine learning",
    "year_of_study": "3",
    "graduation_year": 2025,
    "interests": [
      {
        "interest_id": "interest_123",
        "interest_type": "academic",
        "interest_name": "Artificial Intelligence",
        "name": "Artificial Intelligence",
        "skill_level": "intermediate",
        "created_at": "2026-09-21T18:00:00.000Z"
      }
    ],
    "courses": [
      {
        "user_course_id": 12,
        "course_code": "CS101",
        "course_name": "Introduction to Computer Science",
        "department_id": "dept_cs",
        "semester": "Fall",
        "academic_year": 2024,
        "is_current": 1,
        "created_at": "2026-09-21T18:00:00.000Z"
      }
    ],
    "social_links": {
      "linkedin": "https://linkedin.com/in/johndoe",
      "github": "https://github.com/johndoe"
    },
    "privacy_settings": {
      "profile_visibility": "public",
      "show_email": false
    }
  }
}
```

---

### 2️ Update User Profile

**PUT** `/api/user/profile`
Update profile details such as name, program, or bio.

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

### 3️Delete User Profile (Soft Delete)

**DELETE** `/api/user/profile`
Soft-delete the user’s profile (with 30-day recovery option).

**Request Body (optional):**

```json
{
  "password": "user_password",
  "deletion_reason": "Graduated and leaving campus"
}
```

**Response:**

```json
{
  "message": "Account successfully deleted",
  "details": "Your profile has been deactivated and all personal data has been archived. You can recover your account within 30 days by contacting support.",
  "deletion_timestamp": "2026-09-21T18:00:00.000Z"
}
```

---

### 4️ Get User Statistics

**GET** `/api/user/stats`
Fetch user engagement metrics (connections, groups, events, etc.).

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

## 🤝 Connection Management

### 5️Get User Connections

**GET** `/api/user/connections`
Retrieve all user connections with optional filters.

**Query Params:**

- `status` = accepted | pending | declined | blocked
- `limit` = number of records
- `offset` = pagination offset

**Response:**

```json
{
  "message": "All connections retrieved successfully",
  "counts": {
    "accepted": 13,
    "pending": 4,
    "declined": 2,
    "blocked": 1,
    "total": 20
  },
  "connections": {
    "accepted": [
      {
        "connection_id": "conn_239",
        "status": "accepted",
        "connection_note": "Class project collaboration",
        "shared_courses": "CS106",
        "created_at": "2025-10-17T21:14:45.000Z",
        "updated_at": "2025-10-17T21:14:45.000Z",
        "receiver": {
          "id": "user_11",
          "first_name": "James",
          "last_name": "Taylor",
          "profile_picture_url": "https://example.com/avatar.jpg",
          "profile_headline": "English Literature Student",
          "program": "English Literature",
          "university_id": "STU12345"
        },
        "your_role": "requester",
        "is_pending_action": false
      }
    ],
    "pending": [
      {
        "connection_id": "conn_333",
        "status": "pending",
        "connection_note": "Would love to connect!",
        "shared_courses": null,
        "created_at": "2025-10-17T21:14:45.000Z",
        "updated_at": "2025-10-17T21:14:45.000Z",
        "receiver": {
          "id": "user_10",
          "first_name": "Karen",
          "last_name": "Anderson",
          "profile_picture_url": null,
          "profile_headline": null,
          "program": "Chemistry"
        },
        "your_role": "receiver",
        "is_pending_action": true
      }
    ],
    "declined": [...],
    "blocked": [...]
  }
}
```

---

### 6️ Get Connections by Status

**GET** `/api/user/connections/:status`
Retrieve user connections filtered by a specific status (e.g., `accepted`).

```json
{
  "message": "All connections retrieved successfully",
  "counts": {
    "accepted": 1
  },
  "connections": {
    "accepted": [
      {
        "connection_id": "conn_239",
        "status": "accepted",
        "connection_note": "Class project collaboration",
        "shared_courses": "CS106",
        "created_at": "2025-10-17T21:14:45.000Z",
        "updated_at": "2025-10-17T21:14:45.000Z",
        "receiver": {
          "id": "user_11",
          "first_name": "James",
          "last_name": "Taylor",
          "profile_picture_url": null,
          "profile_headline": null,
          "program": "English Literature"
        },
        "your_role": "requester",
        "is_pending_action": false
      }
    ]
  }
}
```

---

### 7️Send Connection Request

**POST** `/api/user/connections/request`
Send a connection request to another user.

**Request Body:**

```json
{
  "receiver_id": "user_550e8400-e29b-41d4-a716-446655440001",
  "connection_note": "Hey! We’re in the same AI class.",
  "shared_courses": ["CS301"]
}
```

---

### 8️Cancel Connection Request

**DELETE** `/api/user/connections/request/:connection_id`
Cancel a pending connection request.

---

### 9️Respond to Connection Request

**POST** `/api/user/connections/respond`
Accept or decline a pending request.

**Request Body:**

```json
{
  "connection_id": "conn_550e8400-e29b-41d4-a716-446655440002",
  "action": "accept"
}
```

---

## 🎯 Interests Management

### 🔹 List Interests

**GET** `/api/user/interests`

Returns `{ "count": 1, "interests": [...] }` using the same interest object
shape shown in the profile response.

---

### 🔹 Add Interest

**POST** `/api/user/interests`
Add an interest to the user’s profile.

**Request Body:**

```json
{
  "interest_type": "academic",
  "interest_name": "Artificial Intelligence",
  "skill_level": "intermediate"
}
```

---

### 🔹 Update Interest

**PUT** `/api/user/interests/:interest_id`
Modify an existing interest entry.

**Request Body:**

```json
{
  "interest_type": "hobby",
  "interest_name": "Photography",
  "skill_level": "advanced"
}
```

---

### 🔹 Remove Interest

**DELETE** `/api/user/interests/:interestId`
Remove an interest from the profile.

---

## Course Management

### 🔹 List Courses

**GET** `/api/user/courses`

Returns `{ "count": 1, "courses": [...] }` using the same course object shape
shown in the profile response.

---

### 🔹 Add Course

**POST** `/api/user/courses`
Attach a course to the user profile.

**Request Body:**

```json
{
  "course_code": "CS101",
  "course_name": "Introduction to Computer Science",
  "department_id": "dept_cs",
  "semester": "Fall 2024",
  "academic_year": 2024,
  "is_current": true
}
```

---

### 🔹 Remove Course

**DELETE** `/api/user/courses/:courseId`
Remove a course from the profile.

---

## User Discovery

### 🔹 Search Users

**GET** `/api/user/search`
Search for users across name, program, or university.

**Query Params:**

- `q` → search keyword
- `university_id`
- `program`
- `graduation_year`
- `limit` (default 20)

**Response:**

```json
{
  "message": "Users retrieved successfully",
  "count": 3,
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

### 🔹 Connection Recommendations

**GET** `/api/user/recommendations`
Retrieve suggested users based on shared interests, mutual courses, and mutual connections.

**Query Params:**

- `limit` → number of recommendations (1–50)

---

### 🔹 Get Public User Profile

**GET** `/api/user/:userId`
Retrieve a public profile of another user.
**Authentication:** Required.

---

## Testing Flow (Recommended)

| Step | Action                        | Endpoint                             |
| ---- | ----------------------------- | ------------------------------------ |
| 1    | Register / Login → Obtain JWT | `/api/auth/login`                    |
| 2    | Fetch Profile                 | `GET /api/user/profile`              |
| 3    | Update Profile                | `PUT /api/user/profile`              |
| 4    | Add Interests                 | `POST /api/user/interests`           |
| 5    | Add Courses                   | `POST /api/user/courses`             |
| 6    | Search Users                  | `GET /api/user/search`               |
| 7    | Send Connection Request       | `POST /api/user/connections/request` |
| 8    | View Stats                    | `GET /api/user/stats`                |

---

## 📘 Endpoint Summary

| #   | Method | Endpoint                                       | Description                           |
| --- | ------ | ---------------------------------------------- | ------------------------------------- |
| 1   | GET    | `/api/user/profile`                            | Get user profile                      |
| 2   | PUT    | `/api/user/profile`                            | Update profile                        |
| 3   | DELETE | `/api/user/profile`                            | Soft delete profile (30-day recovery) |
| 4   | GET    | `/api/user/stats`                              | Retrieve user statistics              |
| 5   | GET    | `/api/user/connections`                        | Get all connections                   |
| 6   | GET    | `/api/user/connections/:status`                | Get connections by status             |
| 7   | POST   | `/api/user/connections/request`                | Send connection request               |
| 8   | DELETE | `/api/user/connections/request/:connection_id` | Cancel connection request             |
| 9   | POST   | `/api/user/connections/respond`                | Respond to connection request         |
| 10  | GET    | `/api/user/interests`                          | List interests                        |
| 11  | POST   | `/api/user/interests`                          | Add interest                          |
| 12  | PUT    | `/api/user/interests/:interest_id`             | Update interest                       |
| 13  | DELETE | `/api/user/interests/:interestId`              | Remove interest                       |
| 14  | GET    | `/api/user/courses`                            | List courses                          |
| 15  | POST   | `/api/user/courses`                            | Add course                            |
| 16  | DELETE | `/api/user/courses/:courseId`                  | Remove course                         |
| 17  | GET    | `/api/user/search`                             | Search for users                      |
| 18  | GET    | `/api/user/recommendations`                    | Get recommendations                   |
| 19  | GET    | `/api/user/:userId`                            | Get public user profile               |

---

# Messaging and Device Notifications

All routes below require `Authorization: Bearer <token>`.

## Message history

**GET** `/api/conversations/:conversationId/messages?limit=50&before=<ISO timestamp>`

The caller must be a participant. Messages are returned oldest-to-newest within
the page so they can be appended directly to a chat thread.

```json
{
  "success": true,
  "data": [
    {
      "_id": "68d0...",
      "senderId": {
        "_id": "user_1",
        "username": "John Doe",
        "email": "john@example.edu"
      },
      "receiverId": {
        "_id": "user_2",
        "username": "Jane Doe",
        "email": "jane@example.edu"
      },
      "content": "Hello",
      "status": "sent",
      "createdAt": "2026-09-21T18:00:00.000Z",
      "updatedAt": "2026-09-21T18:00:00.000Z"
    }
  ],
  "pagination": {
    "hasMore": false,
    "oldest": "2026-09-21T18:00:00.000Z"
  }
}
```

## Register a push token

**POST** `/api/notifications/push-tokens`

```json
{
  "token": "ExpoPushToken[...]",
  "platform": "ios",
  "device_id": "optional-stable-device-id"
}
```

`platform` is one of `ios`, `android`, `web`, or `unknown`.

## Unregister a push token

**DELETE** `/api/notifications/push-tokens`

```json
{
  "token": "ExpoPushToken[...]"
}
```

---

# Social Controller Documentation

## Overview

The **Social Controller** manages social media functionalities such as **posts**, **likes**, **comments**, and **feed management** within the system.

---

## Endpoints

### Posts

#### **`POST /api/social/posts`**

Create a new post (text, image, or status).

**Headers:**

```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```json
{
  "content": "Studying for finals! 📚",
  "media_url": "https://example.com/study.jpg",
  "media_type": "image",
  "visibility": "connections",
  "expires_at": "2024-12-20T23:59:59Z"
}
```

**Body Parameters:**

| Parameter    | Type   | Required | Description                                                            |
| ------------ | ------ | -------- | ---------------------------------------------------------------------- |
| `content`    | string | optional | Text content of the post                                               |
| `media_url`  | string | optional | URL of the media file                                                  |
| `media_type` | string | optional | `"text"`, `"image"`, or `"video"` (default: `"text"`)                  |
| `visibility` | string | optional | `"public"`, `"connections"`, or `"private"` (default: `"connections"`) |
| `expires_at` | string | optional | ISO date string for post expiration                                    |

> **Note:** Either `content` or `media_url` must be provided.

**Response:**

```json
{
  "message": "Post created successfully",
  "post": {
    "post_id": "post_123",
    "content": "Studying for finals! 📚",
    "media_url": "https://example.com/study.jpg",
    "media_type": "image",
    "poll_id": null,
    "visibility": "connections",
    "expires_at": "2024-12-20T23:59:59Z",
    "created_at": "2024-01-18T14:30:00.000Z"
  }
}
```

---

#### **`GET /api/social/posts/feed`**

Retrieve feed posts from user connections and public posts.

**Headers:**

```http
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Type   | Default | Description               |
| --------- | ------ | ------- | ------------------------- |
| `limit`   | number | 20      | Number of posts to return |
| `offset`  | number | 0       | Number of posts to skip   |

**Example:**

```bash
GET /api/social/posts/feed?limit=10&offset=0
```

**Response:**

```json
{
  "message": "Feed posts retrieved successfully",
  "count": 3,
  "posts": [
    {
      "post_id": "post_123",
      "content": "Studying for finals! 📚",
      "media_url": "https://example.com/study.jpg",
      "media_type": "image",
      "poll_id": null,
      "visibility": "connections",
      "created_at": "2024-01-18T14:30:00.000Z",
      "expires_at": "2024-12-20T23:59:59Z",
      "author": {
        "user_id": "user_1",
        "first_name": "John",
        "last_name": "Doe",
        "profile_picture_url": "https://example.com/profile.jpg",
        "profile_headline": "Computer Science Student"
      },
      "stats": {
        "like_count": 5,
        "comment_count": 2
      },
      "user_actions": {
        "has_liked": true
      }
    }
  ]
}
```

---

#### **`GET /api/social/posts/:post_id`**

Retrieve a single post with full details.

**Headers:**

```http
Authorization: Bearer <token>
```

**Parameters:**

| Parameter | Type   | Required | Description    |
| --------- | ------ | -------- | -------------- |
| `post_id` | string | ✅       | ID of the post |

**Example:**

```bash
GET /api/social/posts/post_123
```

**Response:** Same as feed post structure (for a single post).

---

#### **`DELETE /api/social/posts/:post_id`**

Soft delete a post.

**Headers:**

```http
Authorization: Bearer <token>
```

**Example:**

```bash
DELETE /api/social/posts/post_123
```

**Response:**

```json
{
  "message": "Post deleted successfully"
}
```

---

### Likes

#### **`POST /api/social/posts/:post_id/like`**

Like a post.

**Headers:**

```http
Authorization: Bearer <token>
```

**Example:**

```bash
POST /api/social/posts/post_123/like
```

**Response:**

```json
{
  "message": "Post liked successfully",
  "like": {
    "like_id": "like_123",
    "post_id": "post_123",
    "user_id": "user_1"
  }
}
```

**Error Responses:**

| Status          | Message                              |
| --------------- | ------------------------------------ |
| `409 Conflict`  | Post already liked                   |
| `404 Not Found` | Post not found, inactive, or expired |

---

#### **`DELETE /api/social/posts/:post_id/like`**

Unlike a post.

**Headers:**

```http
Authorization: Bearer <token>
```

**Example:**

```bash
DELETE /api/social/posts/post_123/like
```

**Response:**

```json
{
  "message": "Post unliked successfully"
}
```

**Error Responses:**

| Status          | Message        |
| --------------- | -------------- |
| `404 Not Found` | Like not found |

---

### 💬 Comments

#### **`POST /api/social/posts/:post_id/comments`**

Add a comment to a post.

**Headers:**

```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```json
{
  "content": "Great post! Looking forward to the event.",
  "parent_comment_id": "comment_123"
}
```

**Body Parameters:**

| Parameter           | Type   | Required | Description                            |
| ------------------- | ------ | -------- | -------------------------------------- |
| `content`           | string | ✅       | Text content of the comment            |
| `parent_comment_id` | string | optional | ID of the parent comment (for replies) |

**Response:**

```json
{
  "message": "Comment added successfully",
  "comment": {
    "comment_id": "comment_456",
    "content": "Great post! Looking forward to the event.",
    "parent_comment_id": null,
    "created_at": "2024-01-18T15:30:00.000Z"
  }
}
```

---

#### **`GET /api/social/posts/:post_id/comments`**

Retrieve comments for a post.

**Headers:**

```http
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Type   | Default | Description                  |
| --------- | ------ | ------- | ---------------------------- |
| `limit`   | number | 50      | Number of comments to return |
| `offset`  | number | 0       | Number of comments to skip   |

**Example:**

```bash
GET /api/social/posts/post_123/comments?limit=20&offset=0
```

**Response:**

```json
{
  "message": "Comments retrieved successfully",
  "count": 2,
  "comments": [
    {
      "comment_id": "comment_123",
      "content": "Great post!",
      "parent_comment_id": null,
      "created_at": "2024-01-18T15:30:00.000Z",
      "author": {
        "user_id": "user_2",
        "first_name": "Maria",
        "last_name": "Johnson",
        "profile_picture_url": "https://example.com/profile2.jpg"
      }
    }
  ]
}
```

---

## Usage Examples

### Create a Status Post (24-hour expiry)

```bash
POST /api/social/posts
{
  "content": "Working on a group project at the library",
  "visibility": "connections",
  "expires_at": "2024-01-19T14:30:00Z"
}
```

### Create an Image Post

```bash
POST /api/social/posts
{
  "content": "Beautiful campus today!",
  "media_url": "https://example.com/campus.jpg",
  "media_type": "image",
  "visibility": "public"
}
```

### Create Text-Only Post

```bash
POST /api/social/posts
{
  "content": "Just aced my midterm! 🎉",
  "visibility": "connections"
}
```

### ↩ Reply to a Comment

```bash
POST /api/social/posts/post_123/comments
{
  "content": "Thanks! See you there!",
  "parent_comment_id": "comment_123"
}
```

---

## ⚠️ Error Handling

All endpoints use appropriate HTTP status codes:

| Status | Description                    |
| ------ | ------------------------------ |
| `200`  | Success                        |
| `201`  | Resource created               |
| `400`  | Bad request (validation error) |
| `404`  | Resource not found             |
| `409`  | Conflict (e.g., already liked) |
| `500`  | Internal server error          |

**Error Response Example:**

```json
{
  "message": "Validation failed: content is required",
  "error_details": {
    "field": "content",
    "issue": "missing"
  }
}
```

## 🧩 Posts

| Method     | Endpoint                              | Description                                                 |
| ---------- | ------------------------------------- | ----------------------------------------------------------- |
| **POST**   | `/api/social/posts`                   | Create a new post (text, image, or status).                 |
| **GET**    | `/api/social/posts/feed`              | Retrieve feed posts from user connections and public posts. |
| **GET**    | `/api/social/posts/:post_id`          | Get detailed information for a specific post.               |
| **DELETE** | `/api/social/posts/:post_id`          | Soft delete a post.                                         |
| **POST**   | `/api/social/posts/:post_id/like`     | Like a specific post.                                       |
| **DELETE** | `/api/social/posts/:post_id/like`     | Unlike a previously liked post.                             |
| **POST**   | `/api/social/posts/:post_id/comments` | Add a new comment or reply to a post.                       |
| **GET**    | `/api/social/posts/:post_id/comments` | Retrieve all comments (and replies) for a post.             |

---

## ⚙️ General Notes

- **Authentication:** All endpoints require a valid JWT token (`Authorization: Bearer <token>`).
- **Content-Type:** Use `application/json` for all requests with a body.
- **Pagination:** `limit` and `offset` query parameters are supported in `GET` endpoints for feed and comments.
- **Soft Deletion:** Posts are not permanently removed but marked as inactive.

---

```markdown
# `GET /api/university/domains`

## 📘 Overview

Retrieves a filtered list of universities along with their associated domains, logos, colors, and locations.  
Used primarily for populating dropdowns or university selection menus during signup or profile setup.

---

## Endpoint Details

| Method  | Endpoint                    | Description                                       |
| ------- | --------------------------- | ------------------------------------------------- |
| **GET** | `/api/university/domains` | Fetch university domain information and metadata. |
```

---

## Headers

```

Authorization: Bearer <token> // optional if endpoint is public
Content-Type: application/json

```

---

## 🔍 Query Parameters

| Parameter | Type   | Required | Description                                                                        |
| --------- | ------ | -------- | ---------------------------------------------------------------------------------- |
| `search`  | string | No       | Search term to filter universities by name or domain. Default: `""` (returns all). |

**Example:**

```

GET /api/university/domains?search=tech

```

---

## Response (200 OK)

```json
{
  "message": "University domains retrieved successfully",
  "count": 2,
  "universities": [
    {
      "value": "kstu.edu.gh",
      "label": "Kumasi Technical University",
      "university_id": "uni_001",
      "logo_url": "https://example.com/kstu-logo.png",
      "location": "Kumasi, Ashanti, Ghana",
      "colors": {
        "primary": "#004D40",
        "secondary": "#FFFFFF",
        "accent": "#FFC107",
        "text": "#333333"
      }
    }
  ]
}
```

---

## Empty Result Example

```json
{
  "message": "No universities found",
  "count": 0,
  "universities": []
}
```

---

## Error Response (500 Internal Server Error)

```json
{
  "message": "Failed to retrieve university domains",
  "error": "Database connection failed"
}
```

> The `error` field only appears in development mode.

---

## ⚙️ Notes

- The `location` field automatically combines `city`, `state`, and `country` (excluding null or empty values).
- The `colors` object provides a fallback palette when database color values are missing.
- Ideal for use in **dropdown selectors** or **university verification** workflows.

```

```
