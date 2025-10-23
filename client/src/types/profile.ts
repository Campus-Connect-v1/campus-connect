// types/Profile.ts
export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  bio: string | null;
  date_of_birth: string | null;
  gender: string | null;
  graduation_year: number | null;
  is_profile_complete: 0 | 1;
  phone_number: string | null;
  profile_picture_url: string | null;
  program: string | null;
  university_id: string;
  year_of_study: string | null;
  interests: string[];
  social_links: Record<string, string>;
  privacy_settings: Record<string, any>;
  created_at: string;
  posts: string;
}
