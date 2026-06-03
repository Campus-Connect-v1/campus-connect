# Campus Connect API Contract

Base URL: `http://localhost:${PORT || 5000}/api`

Auth header for protected REST endpoints: `Authorization: Bearer <jwt>`.

JWT payload from login/register OAuth paths uses:

```json
{
  "id": "user_id",
  "email": "student@example.edu",
  "university_id": "uni_1"
}
```

Common auth errors:

- `401 { "message": "No token provided" }`
- `401 { "message": "Token format invalid. Use: Bearer <token>" }`
- `401 { "message": "Token expired" }`
- `401 { "message": "Invalid token" }`
- `500 { "message": "Server configuration error" }` when `JWT_SECRET` is missing.

## Health

### `GET /health`

Auth: none.

Response `200` when MySQL and Mongo are reachable, otherwise `503`.

```json
{
  "api": "ok",
  "mysql": "ok",
  "mongo": "ok"
}
```

### `GET /health/db`

Auth: none. Same response as `GET /health`.

## Auth

### `POST /auth/register`

Auth: none. Rate limited.

Body:

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@stanford.edu",
  "password": "SecurePass123!",
  "university_id": "uni_1"
}
```

Success `201`:

```json
{
  "message": "User registered successfully. Please verify your email.",
  "userId": "user_123",
  "emailSent": true,
  "emailVerified": false
}
```

Errors: `400 Validation failed`, `409 Email already registered`, `500 Internal server error during registration`.

### `POST /auth/login`

Auth: none. Rate limited.

Body:

```json
{
  "email": "john@stanford.edu",
  "password": "SecurePass123!"
}
```

Success `200`:

```json
{
  "message": "Login successful",
  "token": "jwt",
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@stanford.edu",
    "university_id": "uni_1"
  }
}
```

Errors: `400 Validation failed`, `401 Invalid email or password`, `403 Email not verified`, `500 Internal server error during login`.

### `POST /auth/verify-otp`

Auth: none. Rate limited.

Body:

```json
{
  "email": "john@stanford.edu",
  "otp": "123456"
}
```

Success `200`:

```json
{
  "message": "Email verified successfully",
  "emailVerified": true
}
```

Errors: `400 Invalid or expired OTP`, `500 Internal server error during OTP verification`.

Implementation note: controller currently comments out `markEmailAsVerified(email)` and `deleteOTP(email)`.

### `POST /auth/resend-otp`

Auth: none. OTP rate limited.

Body:

```json
{
  "email": "john@stanford.edu"
}
```

Success `200`:

```json
{
  "message": "OTP sent successfully",
  "emailSent": true
}
```

Errors: `400 Validation failed`, `404 Email not found`, `429 Too many OTP requests`, `500 OTP generated but failed to send email`.

### `POST /auth/forgot-password`

Auth: none. Rate limited.

Body:

```json
{
  "email": "john@stanford.edu"
}
```

Success `200`:

```json
{
  "message": "If the email exists, a password reset link has been sent",
  "emailSent": true
}
```

In development, `resetToken` may also be returned. Errors: `400 Validation failed`, `500 Error sending password reset email`.

### `POST /auth/reset-password`

Auth: none. Rate limited.

Body:

```json
{
  "token": "reset_jwt",
  "password": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

Success `200`:

```json
{
  "message": "Password reset successfully",
  "passwordUpdated": true
}
```

Errors: `400 Invalid or expired reset token`, `404 User not found`, `500 Internal server error during password reset`.

### `POST /auth/google`

Auth: none. Rate limited.

Body:

```json
{
  "token": "google_id_token"
}
```

Success `200`:

```json
{
  "message": "Google authentication successful",
  "token": "jwt",
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@stanford.edu",
    "university_id": "uni_1",
    "profile_picture_url": "https://...",
    "is_email_verified": true
  }
}
```

Errors: `400 Google token is required`, `400 University email required`, `400 University not supported`, `409 Email already registered`, `500 Google authentication failed`.

### `POST /auth/google/test`

Auth: none. Development-only test route. Returns `403` outside development.

## User

All `/user/*` endpoints require Bearer auth.

### `GET /user/profile`

Success `200`: `{ "message": "Profile retrieved successfully", "user": { ...profile fields } }`.
Errors: `404 User not found`, `500 Internal server error`.

### `PUT /user/profile`

Body: partial profile fields accepted by `updateProfileValidation`, including `profile_picture_url`, `phone_number`, `program`, `bio`, `date_of_birth`, `gender`, `year_of_study`, `graduation_year`, `interests`, `social_links`, and `privacy_settings`.

Success `200`: `{ "message": "Profile updated successfully", "updated": true }`.
Errors: `400 Validation failed`, `404 User not found or no changes made`, `500 Internal server error`.

### `DELETE /user/profile`

Body:

```json
{
  "deletion_reason": "optional",
  "password": "optional confirmation password"
}
```

Success `200`: `{ "message": "Account successfully deleted", "details": "...", "deletion_timestamp": "..." }`.
Errors: `401 Invalid password`, `404 User not found`, `500 Failed to delete profile`.

### `GET /user/stats`

Success `200`: `{ "message": "User stats retrieved successfully", "stats": { ... } }`.
Errors: `500 Internal server error`.

### `GET /user/connections`

Query: `status`, `limit`, `offset`.

Success `200`: `{ "message": "All connections retrieved successfully", "counts": { ... }, "connections": { "accepted": [], "pending": [], "declined": [], "blocked": [] } }`.
Errors: `500 Internal server error`.

### `GET /user/connections/:status`

Path `status`: connection status such as `accepted`, `pending`, `declined`, `blocked`.

Success `200`: `{ "message": "Connections retrieved successfully", "count": 1, "connections": [] }`.
Empty success `200`: `{ "message": "No connections found", "count": 0, "connections": [] }`.
Errors: `500 Internal server error`.

### `POST /user/connections/request`

Body:

```json
{
  "receiver_id": "user_456",
  "connection_note": "optional",
  "shared_courses": ["CS101"]
}
```

Success `201`: `{ "message": "Connection request sent successfully", "connection_id": "conn_..." }`.
Errors: `400 Receiver ID is required`, `400 Cannot send connection request to yourself`, `409 Connection already exists`, `500 Internal server error`.

### `DELETE /user/connections/request/:connection_id`

Success `200`: `{ "message": "Connection request cancelled successfully", "connection_id": "conn_...", "status": "cancelled", "previous_status": "pending" }`.
Errors: `400 Connection ID is required`, `403 Only sender can cancel`, `404 Not found or no permission`, `500 Failed to cancel connection request`.

### `POST /user/interests`

Body:

```json
{
  "interest_type": "academic",
  "interest_name": "Machine Learning",
  "skill_level": "beginner"
}
```

Success `201`: `{ "message": "Interest added successfully", "interest": { ... } }`.
Errors: `400 Interest type and interest name are required`, `409 Interest already added to profile`, `500 Internal server error while adding interest`.

### `PUT /user/interests/:interest_id`

Body: one or more of `interest_type`, `interest_name`, `skill_level`.

Success `200`: `{ "message": "Interest updated successfully", "interest": { ... } }`.
Errors: `400 At least one field is required`, `400 Invalid interest_type or skill_level`, `404 Interest not found`, `409 Duplicate interest`, `500 Internal server error while updating interest`.

### `DELETE /user/interests/:interestId`

Success `200`: `{ "message": "Interest removed successfully", "removed_interest_id": "..." }`.
Errors: `404 Interest not found`, `500 Internal server error`.

### `POST /user/courses`

Body:

```json
{
  "course_code": "CS101",
  "course_name": "Intro to Computer Science",
  "department_id": "dept_1",
  "semester": "Fall",
  "academic_year": "2026",
  "is_current": true
}
```

Success `201`: `{ "message": "Course added successfully", "course": { ... } }`.
Errors: `400 Course code and course name are required`, `409 Course already added to profile`, `500 Internal server error while adding course`.

### `DELETE /user/courses/:courseId`

Success `200`: `{ "message": "Course removed successfully", "removed_course_id": "courseId", "success": true }`.
Errors: `404 Course not found or no permission`, `500 Internal server error while removing course`.

### `GET /user/search`

Query: validated search criteria such as name/program/year/university fields.

Success `200`: `{ "message": "Users retrieved successfully", "count": 1, "users": [] }`.
Empty success `200`: `{ "message": "No users found based on the criteria provided -- {...}" }`.
Errors: `400 Validation failed`, `500 Internal server error`.

### `GET /user/recommendations`

Query: recommendation filters accepted by `recommendationsValidation`.

Success `200`: `{ "message": "Connection recommendations retrieved successfully", "recommendations": [] }`.
Errors: `400 Validation failed`, `500 Internal server error`.

### `GET /user/:userId`

Success `200`: `{ "message": "User retrieved successfully", "user": { ...public profile fields } }`.
Errors: `400 User ID is required`, `404 User not found`, `500 Internal server error`.

## University And Campus

These endpoints are public.

### `GET /university/domains`

Query: `search`.

Success `200`: `{ "message": "University domains retrieved successfully", "count": 1, "universities": [{ "value": "stanford.edu", "label": "Stanford University", "university_id": "uni_1", "logo_url": "...", "location": "...", "colors": { ... } }] }`.
Empty success `200`: `{ "message": "No universities found", "count": 0, "universities": [] }`.
Errors: `500 Failed to retrieve university domains`.

### `GET /university/:university_id/buildings`

Query: `building_type`.
Success `200`: `{ "success": true, "count": 1, "data": [] }`.
Errors: `500 Error fetching buildings`.

### `GET /university/:university_id/buildings/search`

Query: required `q`.
Success `200`: `{ "success": true, "data": [] }`.
Errors: `400 Search term is required`, `500 Error searching buildings`.

### `GET /university/buildings/:buildingId`

Success `200`: `{ "success": true, "data": { ...building } }`.
Errors: `404 Building not found`, `500 Error fetching building`.

### `GET /university/buildings/:buildingId/facilities`

Query: `facility_type`.
Success `200`: `{ "success": true, "data": [] }`.
Errors: `500 Error fetching facilities`.

### `GET /university/facilities/:facilityId`

Success `200`: `{ "success": true, "data": { ...facility } }`.
Errors: `404 Facility not found`, `500 Error fetching facility`.

### `GET /university/:university_id/facilities/search`

Query: required `q`.
Success `200`: `{ "success": true, "count": 1, "data": [] }`.
Errors: `400 Search term is required`, `500 Error searching facilities`.

### `GET /university/:university_id/facilities/type`

Query: required `facility_type`.
Success `200`: `{ "success": true, "count": 1, "data": [] }`.
Errors: `400 Facility type is required`, `500 Error fetching facilities by type`.

### `GET /university/:university_id/facilities/reservable`

Success `200`: `{ "success": true, "count": 1, "data": [] }`.
Errors: `500 Error fetching reservable facilities`.

## Social

All `/social/*` endpoints require Bearer auth.

### `POST /social/posts`

Body:

```json
{
  "content": "Post body",
  "media_url": "https://...",
  "media_type": "text",
  "visibility": "connections",
  "expires_at": "2026-06-10T12:00:00.000Z"
}
```

Success `201`: `{ "message": "Post created successfully", "post": { ... } }`.
Errors: `400 Either content or media_url is required`, `500 Failed to create post`.

### `GET /social/posts/feed`

Query: `limit` default `20`, `offset` default `0`.
Success `200`: `{ "message": "Feed posts retrieved successfully", "count": 1, "posts": [] }`.
Errors: `500 Failed to retrieve feed posts`.

### `GET /social/posts/:post_id`

Success `200`: `{ "message": "Post retrieved successfully", "post": { ... } }`.
Errors: `404 Post not found`, `500 Failed to retrieve post`.

### `DELETE /social/posts/:post_id`

Success `200`: `{ "message": "Post deleted successfully" }`.
Errors: `404 Post not found or access denied`, `500 Failed to delete post`.

### `POST /social/posts/:post_id/like`

Success `201`: `{ "message": "Post liked successfully", "like": { "like_id": "...", "post_id": "...", "user_id": "..." } }`.
Errors: `404 Post not found/inactive/expired`, `409 Post already liked`, `500 Failed to like post`.

### `DELETE /social/posts/:post_id/like`

Success `200`: `{ "message": "Post unliked successfully" }`.
Errors: `404 Like not found`, `500 Failed to unlike post`.

### `POST /social/posts/:post_id/comments`

Body: `{ "content": "Comment body", "parent_comment_id": "optional" }`.
Success `201`: `{ "message": "Comment added successfully", "comment": { ... } }`.
Errors: `400 Comment content is required`, `500 Failed to add comment`.

### `GET /social/posts/:post_id/comments`

Query: `limit` default `50`, `offset` default `0`.
Success `200`: `{ "message": "Comments retrieved successfully", "count": 1, "comments": [] }`.
Errors: `500 Failed to retrieve comments`.

## Events

All `/events/*` endpoints require Bearer auth.

### `GET /events`

Query: `university_id`, `event_type`, `start_date`, `end_date`, `is_public`, `page` default `1`, `limit` default `100`.
Success `200`: `{ "success": true, "count": 1, "data": [], "pagination": { "page": 1, "limit": 100 } }`.
Errors: `500 Error fetching events`.

### `GET /events/user`

Query: `page` default `1`, `limit` default `10`.
Success `200`: `{ "success": true, "count": 1, "data": [], "pagination": { "page": 1, "limit": 10 } }`.
Errors: `500 Error fetching user events`.

### `POST /events`

Body:

```json
{
  "university_id": "uni_1",
  "event_title": "Career Fair",
  "event_description": "Meet employers",
  "event_type": "career",
  "start_time": "2026-06-10T10:00:00.000Z",
  "end_time": "2026-06-10T14:00:00.000Z",
  "is_recurring": false,
  "recurrence_pattern": null,
  "location_type": "physical",
  "physical_location": "Main Hall",
  "virtual_link": null,
  "max_attendees": 100,
  "is_public": true,
  "requires_rsvp": true
}
```

Success `201`: `{ "success": true, "message": "Event created successfully", "data": { "event_id": "event_...", "eventData": { ... } } }`.
Errors: `400 Missing required fields: university_id, event_title, start_time, end_time`, `500 Error creating event`.

### `GET /events/:eventId`

Success `200`: `{ "success": true, "data": { ...event } }`.
Errors: `404 Event not found`, `500 Error fetching event`.

### `PUT /events/:eventId`

Body: partial event fields.
Success `200`: `{ "success": true, "message": "Event updated successfully" }`.
Errors: `403 Not authorized to update this event`, `404 Event not found`, `500 Error updating event`.

Implementation note: authorization compares `event.created_by` with `req.user.user_id`, but JWT middleware sets `req.user.id`.

### `DELETE /events/:eventId`

Success `200`: `{ "success": true, "message": "Event deleted successfully" }`.
Errors: `403 Not authorized to delete this event`, `404 Event not found`, `500 Error deleting event`.

Implementation note: authorization compares `event.created_by` with `req.user.user_id`, but JWT middleware sets `req.user.id`.

### `POST /events/:eventId/rsvp`

Body: `{ "rsvp_status": "going" }`, where status is `going`, `interested`, or `not_going`.
Success `200`: `{ "success": true, "message": "RSVP status updated to: going" }`.
Errors: `400 Invalid RSVP status`, `404 Event not found`, `500 Error updating RSVP`.

### `GET /events/:eventId/attendees`

Success `200`: `{ "success": true, "count": 1, "data": [] }`.
Errors: `500 Error fetching attendees`.

## Study Groups

All `/study-group/*` endpoints require Bearer auth.

### `GET /study-group`

Query: `university_id`, `course_code`, `group_type`, `is_active`, `page` default `1`, `limit` default `1000`.
Success `200`: `{ "success": true, "count": 1, "data": [], "pagination": { "page": 1, "limit": 1000 } }`.
Errors: `500 Error fetching study groups`.

### `GET /study-group/user`

Success `200`: `{ "success": true, "count": 1, "data": [] }`.
Errors: `500 Error fetching user study groups`.

### `POST /study-group`

Body:

```json
{
  "university_id": "uni_1",
  "group_name": "CS101 Study Group",
  "description": "Weekly review",
  "course_code": "CS101",
  "course_name": "Intro to Computer Science",
  "group_type": "public",
  "max_members": 20,
  "meeting_frequency": "weekly",
  "preferred_location_type": "campus"
}
```

Success `201`: `{ "success": true, "message": "Study group created successfully", "data": { ...group } }`.
Errors: `400 Missing required fields: university_id, group_name`, `500 Error creating study group`.

### `GET /study-group/:groupId`

Success `200`: `{ "success": true, "data": { ...group } }`.
Errors: `404 Study group not found`, `500 Error fetching study group`.

### `PUT /study-group/:groupId`

Body: partial group fields.
Success `200`: `{ "success": true, "data": { ...originalGroup }, "message": "Study group updated successfully" }`.
Errors: `403 Not authorized to update this study group`, `404 Study group not found`, `500 Error updating study group`.

### `POST /study-group/:groupId/join`

Success `200`: `{ "success": true, "data": { ...group }, "message": "Joined study group successfully" }`.
Errors: `400 Study group is not active`, `400 Already a member`, `400 Study group has reached maximum members`, `404 Study group not found`, `500 Error joining study group`.

### `POST /study-group/:groupId/leave`

Success `200`: `{ "success": true, "message": "Left study group successfully" }`.
Errors: `400 Not a member`, `400 Creator cannot leave study group`, `500 Error leaving study group`.

### `GET /study-group/:groupId/members`

Success `200`: `{ "success": true, "count": 1, "data": [] }`.
Errors: `500 Error fetching group members`.

## Geofencing

All `/geofencing/*` endpoints require Bearer auth.

### `POST /geofencing/location`

Body: `{ "latitude": 34.59, "longitude": -82.82, "accuracy": 50 }`.
Success `200`: `{ "message": "Location updated successfully", "location": { "coordinates": [-82.82, 34.59], "accuracy": 50, "last_updated": "..." } }`.
Errors: `400 Latitude and longitude are required`, `429 too frequent`, `500 Failed to update location`.

### `GET /geofencing/nearby`

Query: `radius` in meters, default `500`.
Success `200`: `{ "message": "Nearby profiles retrieved successfully", "count": 1, "radius": 500, "profiles": [] }`.
Empty success `200`: `{ "user": "user_123", "message": "No nearby profiles found", "radius": 500, "suggestion": "Try increasing the search radius", "profiles": [] }`.
Errors: `500 Failed to retrieve nearby profiles`.

### `GET /geofencing/privacy`

Success `200`: `{ "message": "Privacy settings retrieved successfully", "settings": { ... } }`.
Errors: `500 Failed to retrieve privacy settings`.

### `PUT /geofencing/privacy`

Body: privacy settings accepted by `PrivacyService.validatePrivacySettings`.
Success `200`: `{ "message": "Privacy settings updated successfully", "settings": { ... } }`.
Errors: `400 Invalid setting`, `500 Failed to update privacy settings`.

### `POST /geofencing/location/toggle`

Body: `{ "enabled": true }`.
Success `200`: `{ "message": "Location sharing enabled successfully", "location_sharing_enabled": true }`.
Errors: `400 Enabled field must be a boolean`, `500 Failed to update location sharing`.

### `GET /geofencing/location/history`

Query: `hours` default `24`.
Success `200`: `{ "message": "Location history retrieved successfully", "hours": 24, "locations": [] }`.
Errors: `500 Failed to retrieve location history`.

### `POST /geofencing/incognito`

Body: `{ "enabled": true }`.
Success `200`: `{ "message": "Incognito mode enabled successfully", "...result": "..." }`.
Errors: `400 Enabled field must be a boolean`, `500 Failed to update incognito mode`.

### `GET /geofencing/debug/locations`

Development/debug endpoint from route file. Returns location diagnostics.

### `POST /geofencing/debug/set-test-location`

Development/debug endpoint from route file. Sets test location data.

## Conversations

All `/conversations/*` endpoints require Bearer auth.

Important route ordering note: `GET /conversations/:conversationId` is registered before `GET /conversations/participant/:participantId`, so `/participant/:participantId` may be captured as a `conversationId` route unless ordering is changed.

### `GET /conversations`

Query: `page` default `1`, `limit` default `20`.
Success `200`: `{ "success": true, "data": [], "pagination": { "current": 1, "pages": 1, "total": 0, "hasNext": false, "hasPrev": false } }`.
Errors: `500 Server error while fetching conversations`.

### `GET /conversations/:conversationId`

Success `200`: `{ "success": true, "data": { ...conversation } }`.
Errors: `404 Conversation not found`, `500 Server error while fetching conversation`.

### `POST /conversations`

Body: `{ "participantId": "user_456" }`.
Success `201`: `{ "success": true, "data": { ...conversation } }`.
Errors: `400 Participant ID is required`, `400 Cannot create conversation with yourself`, `404 Current user not found`, `404 Participant user not found`, `500 Server error while creating conversation`.

### `DELETE /conversations/:conversationId`

Success `200`: `{ "success": true, "message": "Conversation deleted successfully" }`.
Errors: `404 Conversation not found`, `500 Server error while deleting conversation`.

### `GET /conversations/participant/:participantId`

Success `200`: `{ "success": true, "data": { ...conversation } }`.
Errors: `404 Conversation not found`, `500 Server error while fetching conversation`.

Implementation note: route should be registered before `/:conversationId` to be reachable reliably.

## Socket.io

Socket URL: same host as the HTTP server.

Authentication: `verifySocketToken` middleware. Client should send the same JWT used for REST according to that middleware's expected socket auth format.

### Client emits `send_message`

Payload:

```json
{
  "receiverId": "user_456_or_email",
  "content": "Hello"
}
```

Server emits:

- `message_sent` to sender with saved message data.
- `receive_message` to receiver if online.
- `error_message` with text if receiver is missing or send fails.

### Client emits `mark_message_read`

Payload: message id string.

Server emits `message_read_success` with the message id when updated.

### Client emits `get_conversations`

Server emits `conversations_list` with up to 50 conversations, or `conversations_error`.

