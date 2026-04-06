export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      ai_recommendations: {
        Row: {
          created_at: string;
          id: string;
          input_tokens: number | null;
          model_name: string | null;
          output_tokens: number | null;
          period_from: string;
          period_to: string;
          period_type: string;
          prompt_id: string | null;
          prompt_id_snapshot: string | null;
          prompt_name_snapshot: string | null;
          prompt_snapshot: string | null;
          source_count: number;
          summary: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          input_tokens?: number | null;
          model_name?: string | null;
          output_tokens?: number | null;
          period_from: string;
          period_to: string;
          period_type: string;
          prompt_id?: string | null;
          prompt_id_snapshot?: string | null;
          prompt_name_snapshot?: string | null;
          prompt_snapshot?: string | null;
          source_count?: number;
          summary: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          input_tokens?: number | null;
          model_name?: string | null;
          output_tokens?: number | null;
          period_from?: string;
          period_to?: string;
          period_type?: string;
          prompt_id?: string | null;
          prompt_id_snapshot?: string | null;
          prompt_name_snapshot?: string | null;
          prompt_snapshot?: string | null;
          source_count?: number;
          summary?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_prompt_id_fkey";
            columns: ["prompt_id"];
            isOneToOne: false;
            referencedRelation: "recommendation_prompts";
            referencedColumns: ["id"];
          },
        ];
      };
        appointment_reminders: {
          Row: {
            appointment_id: string;
            cancelled_at: string | null;
            created_at: string;
            id: string;
            offset_minutes: number;
            remind_at: string;
            sent_at: string | null;
            status: string;
            user_id: string;
          };
          Insert: {
            appointment_id: string;
            cancelled_at?: string | null;
            created_at?: string;
            id?: string;
            offset_minutes: number;
            remind_at: string;
            sent_at?: string | null;
            status?: string;
            user_id: string;
          };
          Update: {
            appointment_id?: string;
            cancelled_at?: string | null;
            created_at?: string;
            id?: string;
            offset_minutes?: number;
            remind_at?: string;
            sent_at?: string | null;
            status?: string;
            user_id?: string;
          };
          Relationships: [
            {
              foreignKeyName: "appointment_reminders_appointment_id_fkey";
              columns: ["appointment_id"];
              isOneToOne: false;
              referencedRelation: "appointments";
              referencedColumns: ["id"];
            },
          ];
        };
        appointments: {
          Row: {
            applied_discount_id: string | null;
            amount: number | null;
            appointment_at: string | null;
            appointment_end: string | null;
            category_name: string;
            client_name: string;
            client_phone: string;
            created_at: string;
            discount_amount: number | null;
            extra_amount: number | null;
            id: string;
            notes: string | null;
            service_id: string | null;
            service_name: string;
            service_amount: number | null;
            status: string;
            user_id: string;
          };
        Insert: {
          applied_discount_id?: string | null;
          amount?: number | null;
          appointment_at?: string | null;
          appointment_end?: string | null;
          category_name: string;
          client_name: string;
          client_phone: string;
            created_at?: string;
            discount_amount?: number | null;
            extra_amount?: number | null;
            id?: string;
            notes?: string | null;
            service_id?: string | null;
            service_name: string;
            service_amount?: number | null;
            status: string;
            user_id?: string;
          };
        Update: {
          applied_discount_id?: string | null;
          amount?: number | null;
          appointment_at?: string | null;
          appointment_end?: string | null;
          category_name?: string;
          client_name?: string;
          client_phone?: string;
            created_at?: string;
            discount_amount?: number | null;
            extra_amount?: number | null;
            id?: string;
            notes?: string | null;
            service_id?: string | null;
            service_name?: string;
            service_amount?: number | null;
            status?: string;
            user_id?: string;
          };
        Relationships: [
            {
              foreignKeyName: "appointments_applied_discount_id_fkey";
              columns: ["applied_discount_id"];
              isOneToOne: false;
              referencedRelation: "client_discounts";
              referencedColumns: ["id"];
            },
            {
              foreignKeyName: "appointments_service_id_fkey";
              columns: ["service_id"];
              isOneToOne: false;
              referencedRelation: "services";
              referencedColumns: ["id"];
            },
          ];
        };
      categories: {
        Row: {
          category_name: string;
          created_at: string;
          id: string;
          user_id: string;
        };
        Insert: {
          category_name: string;
          created_at?: string;
          id?: string;
          user_id?: string;
        };
        Update: {
          category_name?: string;
          created_at?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
        client_discounts: {
          Row: {
            appointment_id: string | null;
            client_phone: string;
            created_at: string;
            discount_percent: number;
            expires_at: string | null;
            feedback_token: string | null;
            id: string;
            is_used: boolean;
            note: string | null;
            reserved_at: string | null;
            reserved_for_appointment_id: string | null;
            service_id: string | null;
            service_name_snapshot: string | null;
            source_type: string;
            used_at: string | null;
            used_on_appointment_id: string | null;
            user_id: string;
          };
        Insert: {
          appointment_id?: string | null;
          client_phone: string;
          created_at?: string;
          discount_percent?: number;
          expires_at?: string | null;
            feedback_token?: string | null;
            id?: string;
            is_used?: boolean;
            note?: string | null;
            reserved_at?: string | null;
            reserved_for_appointment_id?: string | null;
            service_id?: string | null;
            service_name_snapshot?: string | null;
            source_type?: string;
            used_at?: string | null;
            used_on_appointment_id?: string | null;
            user_id: string;
          };
        Update: {
          appointment_id?: string | null;
          client_phone?: string;
          created_at?: string;
          discount_percent?: number;
          expires_at?: string | null;
            feedback_token?: string | null;
            id?: string;
            is_used?: boolean;
            note?: string | null;
            reserved_at?: string | null;
            reserved_for_appointment_id?: string | null;
            service_id?: string | null;
            service_name_snapshot?: string | null;
            source_type?: string;
            used_at?: string | null;
            used_on_appointment_id?: string | null;
            user_id?: string;
          };
        Relationships: [
          {
            foreignKeyName: "client_discounts_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
            {
              foreignKeyName: "client_discounts_reserved_for_appointment_id_fkey";
              columns: ["reserved_for_appointment_id"];
              isOneToOne: false;
              referencedRelation: "appointments";
              referencedColumns: ["id"];
            },
            {
              foreignKeyName: "client_discounts_service_id_fkey";
              columns: ["service_id"];
              isOneToOne: false;
              referencedRelation: "services";
              referencedColumns: ["id"];
            },
            {
              foreignKeyName: "client_discounts_used_on_appointment_id_fkey";
              columns: ["used_on_appointment_id"];
              isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
        ];
      };
      client_portal_invites: {
        Row: {
          client_phone: string;
          created_at: string;
          created_by: string;
          expires_at: string;
          id: string;
          owner_user_id: string;
          purpose: string;
          token_hash: string;
          used_at: string | null;
        };
        Insert: {
          client_phone: string;
          created_at?: string;
          created_by: string;
          expires_at: string;
          id?: string;
          owner_user_id: string;
          purpose: string;
          token_hash: string;
          used_at?: string | null;
        };
        Update: {
          client_phone?: string;
          created_at?: string;
          created_by?: string;
          expires_at?: string;
          id?: string;
          owner_user_id?: string;
          purpose?: string;
          token_hash?: string;
          used_at?: string | null;
        };
        Relationships: [];
      };
      client_portal_links: {
        Row: {
          client_auth_user_id: string;
          client_id: string | null;
          client_phone: string;
          created_at: string;
          id: string;
          is_active: boolean;
          last_seen_at: string | null;
          owner_user_id: string;
        };
        Insert: {
          client_auth_user_id: string;
          client_id?: string | null;
          client_phone: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          last_seen_at?: string | null;
          owner_user_id: string;
        };
        Update: {
          client_auth_user_id?: string;
          client_id?: string | null;
          client_phone?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          last_seen_at?: string | null;
          owner_user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "client_portal_links_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      client_portal_profiles: {
        Row: {
          auth_user_id: string;
          created_at: string;
          display_name: string | null;
          last_login_at: string | null;
          notifications_enabled: boolean;
          phone: string;
        };
        Insert: {
          auth_user_id: string;
          created_at?: string;
          display_name?: string | null;
          last_login_at?: string | null;
          notifications_enabled?: boolean;
          phone: string;
        };
        Update: {
          auth_user_id?: string;
          created_at?: string;
          display_name?: string | null;
          last_login_at?: string | null;
          notifications_enabled?: boolean;
          phone?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          phone: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          phone: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          phone?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      discount_rules: {
        Row: {
          created_at: string;
          discount_percent: number;
          id: string;
          is_active: boolean;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          discount_percent?: number;
          id?: string;
          is_active?: boolean;
          user_id: string;
        };
        Update: {
          created_at?: string;
          discount_percent?: number;
          id?: string;
          is_active?: boolean;
          user_id?: string;
        };
        Relationships: [];
      };
      feedback_responses: {
        Row: {
          created_at: string;
          feedback_text: string;
          id: string;
          period_bucket: string;
          score_booking: number | null;
          score_comfort: number | null;
          score_explanation: number | null;
          score_recommendation: number | null;
          score_result: number | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          feedback_text: string;
          id?: string;
          period_bucket?: string;
          score_booking?: number | null;
          score_comfort?: number | null;
          score_explanation?: number | null;
          score_recommendation?: number | null;
          score_result?: number | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          feedback_text?: string;
          id?: string;
          period_bucket?: string;
          score_booking?: number | null;
          score_comfort?: number | null;
          score_explanation?: number | null;
          score_recommendation?: number | null;
          score_result?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      feedback_tokens: {
        Row: {
          appointment_id: string | null;
          created_at: string;
          expires_at: string;
          id: string;
          is_active: boolean;
          token: string;
          used_at: string | null;
          user_id: string;
        };
        Insert: {
          appointment_id?: string | null;
          created_at?: string;
          expires_at: string;
          id?: string;
          is_active?: boolean;
          token: string;
          used_at?: string | null;
          user_id: string;
        };
        Update: {
          appointment_id?: string | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
          is_active?: boolean;
          token?: string;
          used_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "feedback_tokens_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
        ];
      };
        owner_notification_settings: {
          Row: {
            created_at: string;
            reminder_offsets_minutes: number[];
            updated_at: string;
            user_id: string;
          };
          Insert: {
            created_at?: string;
            reminder_offsets_minutes?: number[];
            updated_at?: string;
            user_id: string;
          };
          Update: {
            created_at?: string;
            reminder_offsets_minutes?: number[];
            updated_at?: string;
            user_id?: string;
          };
          Relationships: [];
        };
        push_subscriptions: {
        Row: {
          audience: string;
          auth: string;
          auth_user_id: string;
          created_at: string;
          endpoint: string;
          id: string;
          owner_user_id: string;
          p256dh: string;
        };
        Insert: {
          audience: string;
          auth: string;
          auth_user_id: string;
          created_at?: string;
          endpoint: string;
          id?: string;
          owner_user_id: string;
          p256dh: string;
        };
        Update: {
          audience?: string;
          auth?: string;
          auth_user_id?: string;
          created_at?: string;
          endpoint?: string;
          id?: string;
          owner_user_id?: string;
          p256dh?: string;
        };
        Relationships: [];
      };
      recommendation_jobs: {
        Row: {
          duration_ms: number | null;
          error_code: string | null;
          error_message: string | null;
          finished_at: string | null;
          id: string;
          input_tokens: number | null;
          model_name: string | null;
          output_tokens: number | null;
          period_from: string;
          period_to: string;
          period_type: string;
          prompt_chars: number | null;
          prompt_id: string | null;
          requested_at: string;
          result_id: string | null;
          source_count: number | null;
          started_at: string | null;
          status: string;
          user_id: string;
        };
        Insert: {
          duration_ms?: number | null;
          error_code?: string | null;
          error_message?: string | null;
          finished_at?: string | null;
          id?: string;
          input_tokens?: number | null;
          model_name?: string | null;
          output_tokens?: number | null;
          period_from: string;
          period_to: string;
          period_type: string;
          prompt_chars?: number | null;
          prompt_id?: string | null;
          requested_at?: string;
          result_id?: string | null;
          source_count?: number | null;
          started_at?: string | null;
          status?: string;
          user_id: string;
        };
        Update: {
          duration_ms?: number | null;
          error_code?: string | null;
          error_message?: string | null;
          finished_at?: string | null;
          id?: string;
          input_tokens?: number | null;
          model_name?: string | null;
          output_tokens?: number | null;
          period_from?: string;
          period_to?: string;
          period_type?: string;
          prompt_chars?: number | null;
          prompt_id?: string | null;
          requested_at?: string;
          result_id?: string | null;
          source_count?: number | null;
          started_at?: string | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recommendation_jobs_prompt_id_fkey";
            columns: ["prompt_id"];
            isOneToOne: false;
            referencedRelation: "recommendation_prompts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recommendation_jobs_result_id_fkey";
            columns: ["result_id"];
            isOneToOne: false;
            referencedRelation: "ai_recommendations";
            referencedColumns: ["id"];
          },
        ];
      };
      recommendation_prompts: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          is_default: boolean;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          is_default?: boolean;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          is_default?: boolean;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          category_id: string | null;
          created_at: string;
          id: string;
          name: string;
          price: number | null;
          user_id: string;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          price?: number | null;
          user_id?: string;
        };
        Update: {
          category_id?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          price?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      cleanup_recommendation_jobs: {
        Args: { retention?: string };
        Returns: number;
      };
      create_feedback_token: {
        Args: { p_expires_in?: string };
        Returns: string;
      };
      submit_feedback: {
        Args: {
          p_feedback_text: string;
          p_score_booking?: number;
          p_score_comfort?: number;
          p_score_explanation?: number;
          p_score_recommendation?: number;
          p_score_result?: number;
          p_token: string;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
