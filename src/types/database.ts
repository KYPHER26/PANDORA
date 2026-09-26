export type ReactionType = "like" | "love" | "emotional" | "funny";
export type NotificationType =
  | "new_memory"
  | "new_photo"
  | "reaction"
  | "comment"
  | "reply"
  | "anniversary";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  couple_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Couple {
  id: string;
  partner_one_id: string | null;
  partner_two_id: string | null;
  relationship_start_date: string | null;
  anniversary_date: string | null;
  quote: string | null;
  cover_image_url: string | null;
  created_at: string;
}

export interface Memory {
  id: string;
  couple_id: string;
  author_id: string;
  title: string;
  content: string | null;
  day_summary: string | null;
  note_to_partner: string | null;
  date: string;
  mood: string | null;
  location: string | null;
  tags: string[];
  is_special: boolean;
  special_label: string | null;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  couple_id: string;
  uploader_id: string;
  memory_id: string | null;
  storage_path: string;
  caption: string | null;
  taken_on: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  memory_id: string;
  couple_id: string;
  author_id: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
}

export interface Reaction {
  id: string;
  memory_id: string;
  couple_id: string;
  user_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  recipient_id: string;
  sender_id: string | null;
  couple_id: string;
  type: NotificationType;
  reference_id: string | null;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

// Minimal Supabase Database type map — enough for the typed client without
// generating the full CLI output. Extend with `supabase gen types` later.
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      couples: { Row: Couple; Insert: Partial<Couple>; Update: Partial<Couple> };
      memories: { Row: Memory; Insert: Partial<Memory>; Update: Partial<Memory> };
      photos: { Row: Photo; Insert: Partial<Photo>; Update: Partial<Photo> };
      comments: { Row: Comment; Insert: Partial<Comment>; Update: Partial<Comment> };
      reactions: { Row: Reaction; Insert: Partial<Reaction>; Update: Partial<Reaction> };
      notifications: {
        Row: NotificationRow;
        Insert: Partial<NotificationRow>;
        Update: Partial<NotificationRow>;
      };
    };
  };
}

export const MOODS = ["😊", "😍", "🥹", "😂", "😐", "😴"] as const;
export type Mood = (typeof MOODS)[number];

export const REACTION_EMOJI: Record<ReactionType, string> = {
  like: "❤️",
  love: "😍",
  emotional: "🥹",
  funny: "😂",
};
