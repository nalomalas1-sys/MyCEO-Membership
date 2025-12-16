export interface Child {
  id: string;
  parent_id: string;
  name: string;
  age: number | null;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  profile_picture_url: string | null;
  access_code: string;
  total_xp: number;
  current_level: number;
  current_streak: number;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}





