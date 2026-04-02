import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase configuration");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          auth_id: string;
          role: "admin" | "consultant" | "user";
          first_name: string | null;
          last_name: string | null;
          email: string;
          phone: string | null;
          profile_image_url: string | null;
          bio: string | null;
          location: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      consultants: {
        Row: {
          id: string;
          user_id: string;
          expertise_tags: string[];
          hourly_rate: number;
          chat_rate_per_minute: number;
          video_rate_per_minute: number;
          average_rating: number;
          total_reviews: number;
          is_verified: boolean;
          is_active: boolean;
          languages: string[];
          years_of_experience: number | null;
          certification_url: string | null;
          total_sessions: number;
          total_earnings: number;
          created_at: string;
          updated_at: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          consultant_id: string;
          user_id: string;
          booking_type: "chat" | "video_call" | "voice_call";
          scheduled_at: string;
          duration_minutes: number;
          status: "pending" | "confirmed" | "completed" | "cancelled";
          meeting_url: string | null;
          notes: string | null;
          amount: number;
          payment_id: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      messages: {
        Row: {
          id: string;
          booking_id: string;
          sender_id: string;
          content: string | null;
          message_type: string;
          attachment_url: string | null;
          is_read: boolean;
          read_at: string | null;
          created_at: string;
        };
      };
      courses: {
        Row: {
          id: string;
          consultant_id: string;
          title: string;
          description: string | null;
          price: number;
          thumbnail_url: string | null;
          category: string | null;
          level: string;
          is_published: boolean;
          total_students: number;
          total_earnings: number;
          created_at: string;
          updated_at: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          consultant_id: string;
          user_id: string;
          booking_id: string | null;
          rating: number;
          title: string | null;
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};
