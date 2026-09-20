export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      activities: {
        Row: {
          correct_payload: Json;
          created_at: string;
          difficulty: number;
          id: string;
          interaction_type: Database["public"]["Enums"]["interaction_type"];
          ld_tags: string[];
          media: Json;
          order_in_unit: number;
          prompt: string | null;
          slug: string;
          title: string;
          unit: string;
        };
        Insert: {
          correct_payload?: Json;
          created_at?: string;
          difficulty?: number;
          id?: string;
          interaction_type: Database["public"]["Enums"]["interaction_type"];
          ld_tags?: string[];
          media?: Json;
          order_in_unit?: number;
          prompt?: string | null;
          slug: string;
          title: string;
          unit: string;
        };
        Update: {
          correct_payload?: Json;
          created_at?: string;
          difficulty?: number;
          id?: string;
          interaction_type?: Database["public"]["Enums"]["interaction_type"];
          ld_tags?: string[];
          media?: Json;
          order_in_unit?: number;
          prompt?: string | null;
          slug?: string;
          title?: string;
          unit?: string;
        };
        Relationships: [];
      };
      activity_attempts: {
        Row: {
          activity_id: string;
          child_id: string;
          correct: boolean;
          created_at: string;
          hints_used: number;
          id: string;
          latency_ms: number | null;
          meta: Json;
          session_id: string | null;
          transcript: string | null;
        };
        Insert: {
          activity_id: string;
          child_id: string;
          correct: boolean;
          created_at?: string;
          hints_used?: number;
          id?: string;
          latency_ms?: number | null;
          meta?: Json;
          session_id?: string | null;
          transcript?: string | null;
        };
        Update: {
          activity_id?: string;
          child_id?: string;
          correct?: boolean;
          created_at?: string;
          hints_used?: number;
          id?: string;
          latency_ms?: number | null;
          meta?: Json;
          session_id?: string | null;
          transcript?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "activity_attempts_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_attempts_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_attempts_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      children: {
        Row: {
          age: number | null;
          avatar_emoji: string | null;
          buddy_id: string | null;
          created_at: string;
          id: string;
          join_code: string | null;
          name: string;
          parent_id: string;
          updated_at: string;
        };
        Insert: {
          age?: number | null;
          avatar_emoji?: string | null;
          buddy_id?: string | null;
          created_at?: string;
          id?: string;
          join_code?: string | null;
          name: string;
          parent_id: string;
          updated_at?: string;
        };
        Update: {
          age?: number | null;
          avatar_emoji?: string | null;
          buddy_id?: string | null;
          created_at?: string;
          id?: string;
          join_code?: string | null;
          name?: string;
          parent_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      class_children: {
        Row: {
          added_at: string;
          child_id: string;
          class_id: string;
        };
        Insert: {
          added_at?: string;
          child_id: string;
          class_id: string;
        };
        Update: {
          added_at?: string;
          child_id?: string;
          class_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "class_children_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "class_children_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
        ];
      };
      class_themes: {
        Row: {
          assigned_at: string;
          assigned_by: string | null;
          class_id: string;
          theme_id: string;
        };
        Insert: {
          assigned_at?: string;
          assigned_by?: string | null;
          class_id: string;
          theme_id: string;
        };
        Update: {
          assigned_at?: string;
          assigned_by?: string | null;
          class_id?: string;
          theme_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "class_themes_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "class_themes_theme_id_fkey";
            columns: ["theme_id"];
            isOneToOne: false;
            referencedRelation: "themes";
            referencedColumns: ["id"];
          },
        ];
      };
      classes: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          teacher_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          teacher_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          teacher_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      learning_dispositions: {
        Row: {
          code: string;
          color: string | null;
          description: string | null;
          id: string;
          name: string;
          sort_order: number;
        };
        Insert: {
          code: string;
          color?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          sort_order?: number;
        };
        Update: {
          code?: string;
          color?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          child_id: string;
          ended_at: string | null;
          id: string;
          started_at: string;
        };
        Insert: {
          child_id: string;
          ended_at?: string | null;
          id?: string;
          started_at?: string;
        };
        Update: {
          child_id?: string;
          ended_at?: string | null;
          id?: string;
          started_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_child_id_fkey";
            columns: ["child_id"];
            isOneToOne: false;
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
        ];
      };
      theme_items: {
        Row: {
          created_at: string;
          id: string;
          kind: string;
          position: number;
          theme_id: string;
          value: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          kind: string;
          position?: number;
          theme_id: string;
          value: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          kind?: string;
          position?: number;
          theme_id?: string;
          value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "theme_items_theme_id_fkey";
            columns: ["theme_id"];
            isOneToOne: false;
            referencedRelation: "themes";
            referencedColumns: ["id"];
          },
        ];
      };
      themes: {
        Row: {
          color: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          emoji: string | null;
          id: string;
          is_starter: boolean;
          slug: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          emoji?: string | null;
          id?: string;
          is_starter?: boolean;
          slug: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          emoji?: string | null;
          id?: string;
          is_starter?: boolean;
          slug?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      gen_join_code: { Args: never; Returns: string };
      get_child_themes: {
        Args: { _child_id: string };
        Returns: {
          color: string;
          emoji: string;
          id: string;
          slug: string;
          title: string;
        }[];
      };
      get_theme_by_slug: {
        Args: { _slug: string };
        Returns: {
          color: string;
          emoji: string;
          id: string;
          item_id: string;
          item_position: number;
          kind: string;
          slug: string;
          title: string;
          value: string;
        }[];
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      log_child_attempt: {
        Args: {
          _activity_slug: string;
          _child_id: string;
          _correct: boolean;
          _hints_used?: number;
          _latency_ms?: number;
          _meta?: Json;
          _transcript?: string;
        };
        Returns: string;
      };
      resolve_child_by_join_code: {
        Args: { _code: string };
        Returns: {
          id: string;
          name: string;
        }[];
      };
    };
    Enums: {
      app_role: "admin" | "teacher" | "parent";
      interaction_type:
        | "pronounce"
        | "trace"
        | "listen_choose"
        | "read_blend"
        | "decode"
        | "tap_choice"
        | "drag_match"
        | "sort"
        | "sequence"
        | "speak_back";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "teacher", "parent"],
      interaction_type: [
        "pronounce",
        "trace",
        "listen_choose",
        "read_blend",
        "decode",
        "tap_choice",
        "drag_match",
        "sort",
        "sequence",
        "speak_back",
      ],
    },
  },
} as const;
