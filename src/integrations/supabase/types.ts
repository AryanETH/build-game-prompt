export type Json = | string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      direct_messages: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          recipient_id: string;
          sender_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          recipient_id: string;
          sender_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          recipient_id?: string;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "direct_messages_recipient_id_fkey";
            columns: ["recipient_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey";
            columns: ["sender_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      follows: {
        Row: {
          created_at: string;
          follower_id: string;
          following_id: string;
          id: string;
        };
        Insert: {
          created_at?: string;
          follower_id: string;
          following_id: string;
          id?: string;
        };
        Update: {
          created_at?: string;
          follower_id?: string;
          following_id?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey";
            columns: ["follower_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follows_following_id_fkey";
            columns: ["following_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      game_comments: {
        Row: {
          content: string;
          created_at: string;
          game_id: string;
          id: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          game_id: string;
          id?: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          game_id?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_comments_game_id_fkey";
            columns: ["game_id"];
            referencedRelation: "games";
            referencedColumns: ["id"];
          }
        ];
      };
      game_likes: {
        Row: {
          created_at: string;
          game_id: string;
          id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          game_id: string;
          id?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          game_id?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_likes_game_id_fkey";
            columns: ["game_id"];
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_likes_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      games: {
        Row: {
          city: string | null;
          control_mapping: Json | null;
          country: string | null;
          cover_url: string | null;
          created_at: string;
          description: string | null;
          emoji: string | null;
          graphics: Json | null;
          id: string;
          is_multiplayer: boolean | null;
          is_public: boolean;
          latitude: number | null;
          longitude: number | null;
          original_game_id: string | null;
          prompt: string | null;
          sound_url: string | null;
          title: string | null;
          user_id: string | null;
        };
        Insert: {
          city?: string | null;
          control_mapping?: Json | null;
          country?: string | null;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          emoji?: string | null;
          graphics?: Json | null;
          id?: string;
          is_multiplayer?: boolean | null;
          is_public?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          original_game_id?: string | null;
          prompt?: string | null;
          sound_url?: string | null;
          title?: string | null;
          user_id?: string | null;
        };
        Update: {
          city?: string | null;
          control_mapping?: Json | null;
          country?: string | null;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          emoji?: string | null;
          graphics?: Json | null;
          id?: string;
          is_multiplayer?: boolean | null;
          is_public?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          original_game_id?: string | null;
          prompt?: string | null;
          sound_url?: string | null;
          title?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "games_original_game_id_fkey";
            columns: ["original_game_id"];
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "games_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          created_at: string;
          id: number;
          payload: Json;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          payload: Json;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          payload?: Json;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          display_name: string | null;
          has_completed_onboarding: boolean | null;
          id: string;
          is_safety_enabled: boolean | null;
        };
        Insert: {
          avatar_url?: string | null;
          display_name?: string | null;
          has_completed_onboarding?: boolean | null;
          id: string;
          is_safety_enabled?: boolean | null;
        };
        Update: {
          avatar_url?: string | null;
          display_name?: string | null;
          has_completed_onboarding?: boolean | null;
          id?: string;
          is_safety_enabled?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      user_activities: {
        Row: {
          activity_type: string;
          created_at: string;
          game_id: string | null;
          id: string;
          user_id: string;
        };
        Insert: {
          activity_type: string;
          created_at?: string;
          game_id?: string | null;
          id?: string;
          user_id: string;
        };
        Update: {
          activity_type?: string;
          created_at?: string;
          game_id?: string | null;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_activities_game_id_fkey";
            columns: ["game_id"];
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_activities_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}