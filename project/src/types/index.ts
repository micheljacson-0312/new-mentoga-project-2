export type UserRole = "admin" | "consultant" | "user";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";
export type CallType = "chat" | "video_call" | "voice_call";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface UserProfile {
  id: string;
  auth_id: string;
  role: UserRole;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  profile_image_url: string | null;
  bio: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export interface Consultant {
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
  slug: string | null;
  banner_image_url: string | null;
  created_at: string;
  updated_at: string;
  user?: UserProfile;
}

export interface Booking {
  id: string;
  consultant_id: string;
  user_id: string;
  booking_type: CallType;
  scheduled_at: string;
  duration_minutes: number;
  status: BookingStatus;
  meeting_url: string | null;
  notes: string | null;
  amount: number;
  payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  booking_id?: string | null;
  conversation_id?: string | null;
  sender_id: string;
  content: string | null;
  message_type: string;
  attachment_url?: string | null;
  audio_url?: string | null;
  video_url?: string | null;
  metadata?: any;
  is_billed?: boolean;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  consultant_id: string;
  client_id: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  consultant?: UserProfile;
  client?: UserProfile;
}

export interface Course {
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
}

export interface Review {
  id: string;
  consultant_id: string;
  user_id: string;
  booking_id: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
  updated_at: string;
}
