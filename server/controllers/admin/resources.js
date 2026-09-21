// Registry of what the admin app is allowed to touch.
//
// Every table name, column name and sort key used in SQL below comes from THIS
// file, never from a request. Request data only ever arrives as a bound
// parameter. That is what makes a single generic controller safe here: an
// attacker can choose values, never identifiers.

export const RESOURCES = {
  universities: {
    table: "universities",
    pk: "university_id",
    // `uni_<n>`, because middleware/validations.js enforces /^uni_\d+$/ on
    // registration. A uuid here would make the university unusable for signup.
    idPrefix: "uni",
    label: "Universities",
    columns: [
      "name", "domain", "address", "city", "state", "country", "logo_url",
      "is_verified", "primary_color", "secondary_color", "accent_color",
      "text_color",
    ],
    required: ["name", "domain"],
    searchable: ["name", "domain", "city", "country"],
    sort: "created_at DESC",
    create: true, update: true, delete: true,
    // Every FK pointing here is ON DELETE CASCADE, so removing a university
    // takes its whole campus with it -- including its students, and by
    // extension their posts, connections and messages.
    cascade: [
      { table: "users", fk: "university_id", label: "users" },
      { table: "university_departments", fk: "university_id", label: "departments" },
      { table: "campus_buildings", fk: "university_id", label: "buildings" },
      { table: "events", fk: "university_id", label: "events" },
      { table: "study_groups", fk: "university_id", label: "study groups" },
    ],
  },

  departments: {
    table: "university_departments",
    pk: "department_id",
    idPrefix: "dep",
    label: "Departments",
    columns: ["university_id", "department_code", "department_name", "description"],
    required: ["university_id", "department_code", "department_name"],
    searchable: ["department_name", "department_code"],
    sort: "created_at DESC",
    create: true, update: true, delete: true,
  },

  buildings: {
    table: "campus_buildings",
    pk: "building_id",
    idPrefix: "bld",
    label: "Buildings",
    columns: [
      "university_id", "building_code", "building_name", "address", "latitude",
      "longitude", "description", "building_type", "floors", "is_accessible",
    ],
    required: ["university_id", "building_code", "building_name"],
    searchable: ["building_name", "building_code"],
    sort: "created_at DESC",
    create: true, update: true, delete: true,
    cascade: [{ table: "campus_facilities", fk: "building_id", label: "facilities" }],
  },

  facilities: {
    table: "campus_facilities",
    pk: "facility_id",
    idPrefix: "fac",
    label: "Facilities",
    columns: [
      "building_id", "facility_name", "floor", "room_number", "capacity",
      "facility_type", "description", "operating_hours", "is_reservable",
    ],
    required: ["building_id", "facility_name"],
    searchable: ["facility_name", "room_number"],
    sort: "created_at DESC",
    create: true, update: true, delete: true,
  },

  // Students are not created here -- they register through the app. Operators
  // can look them up and deactivate them, nothing more.
  users: {
    table: "users",
    pk: "user_id",
    label: "Users",
    columns: ["is_active", "is_email_verified", "is_edu_verified"],
    required: [],
    searchable: ["email", "first_name", "last_name", "program"],
    sort: "created_at DESC",
    select: `user_id, university_id, email, first_name, last_name, program,
             graduation_year, year_of_study, auth_provider, is_active,
             is_email_verified, is_edu_verified, is_profile_complete,
             last_login, created_at`,
    create: false, update: true, delete: true,
    cascade: [
      { table: "posts", fk: "user_id", label: "posts" },
      { table: "connections", fk: "requester_id", label: "connections made" },
      { table: "event_attendees", fk: "user_id", label: "event RSVPs" },
      { table: "group_members", fk: "user_id", label: "group memberships" },
    ],
  },

  events: {
    table: "events",
    pk: "event_id",
    label: "Events",
    columns: ["is_public", "requires_rsvp"],
    required: [],
    searchable: ["event_title", "event_type"],
    sort: "start_time DESC",
    create: false, update: true, delete: true,
  },

  study_groups: {
    table: "study_groups",
    pk: "group_id",
    label: "Study groups",
    columns: ["is_active"],
    required: [],
    searchable: ["group_name", "course_code"],
    sort: "created_at DESC",
    create: false, update: true, delete: true,
  },

  posts: {
    table: "posts",
    pk: "post_id",
    label: "Posts",
    columns: ["is_active"],
    required: [],
    searchable: ["content"],
    sort: "created_at DESC",
    create: false, update: true, delete: true,
  },
};

export const getResource = (name) =>
  Object.prototype.hasOwnProperty.call(RESOURCES, name)
    ? RESOURCES[name]
    : null;
