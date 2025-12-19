// Database types (will be generated from Supabase)
// For now, manual types based on schema

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: 'parent' | 'admin' | 'child';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      parents: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          subscription_tier: 'basic' | 'standard' | 'premium' | null;
          subscription_status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
          trial_ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['parents']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['parents']['Insert']>;
      };
      children: {
        Row: {
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
        };
        Insert: Omit<Database['public']['Tables']['children']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['children']['Insert']>;
      };
      modules: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          track: 'money_basics' | 'entrepreneurship' | 'advanced' | 'project_based' | 'online_class';
          order_index: number;
          difficulty_level: number;
          xp_reward: number;
          is_published: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['modules']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['modules']['Insert']>;
      };
      // Add more types as needed
    };
  };
}





