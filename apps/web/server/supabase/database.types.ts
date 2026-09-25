export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      brand_events: {
        Row: {
          brand_id: string
          created_at: string
          created_by: string | null
          happened_on: string
          id: string
          note: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          created_by?: string | null
          happened_on: string
          id?: string
          note: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          created_by?: string | null
          happened_on?: string
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_memberships: {
        Row: {
          brand_id: string
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          role: string
          user_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_memberships_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          guidelines: string
          id: string
          key_rule: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          guidelines?: string
          id?: string
          key_rule: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          guidelines?: string
          id?: string
          key_rule?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      issue_types: {
        Row: {
          active: boolean
          code: string
          label: string
          severity: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          code: string
          label: string
          severity: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          code?: string
          label?: string
          severity?: string
          sort_order?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      replies: {
        Row: {
          brand_id: string
          created_at: string
          customer_message: string
          external_id: string
          id: string
          received_at: string
          reply_body: string
          sent_at: string
          source: string
          specialist_id: string
          subject: string
          ticket_ref: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          customer_message: string
          external_id: string
          id?: string
          received_at: string
          reply_body: string
          sent_at: string
          source: string
          specialist_id: string
          subject: string
          ticket_ref: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          customer_message?: string
          external_id?: string
          id?: string
          received_at?: string
          reply_body?: string
          sent_at?: string
          source?: string
          specialist_id?: string
          subject?: string
          ticket_ref?: string
        }
        Relationships: [
          {
            foreignKeyName: "replies_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replies_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_issues: {
        Row: {
          issue_code: string
          review_id: string
        }
        Insert: {
          issue_code: string
          review_id: string
        }
        Update: {
          issue_code?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_issues_issue_code_fkey"
            columns: ["issue_code"]
            isOneToOne: false
            referencedRelation: "issue_types"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "review_issues_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          brand_id: string
          comment: string
          created_at: string
          id: string
          is_exemplar: boolean
          reply_id: string
          reviewer_id: string
          score: number
          updated_at: string
        }
        Insert: {
          brand_id: string
          comment?: string
          created_at?: string
          id?: string
          is_exemplar?: boolean
          reply_id: string
          reviewer_id: string
          score: number
          updated_at?: string
        }
        Update: {
          brand_id?: string
          comment?: string
          created_at?: string
          id?: string
          is_exemplar?: boolean
          reply_id?: string
          reviewer_id?: string
          score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reply_brand_fkey"
            columns: ["reply_id", "brand_id"]
            isOneToOne: false
            referencedRelation: "replies"
            referencedColumns: ["id", "brand_id"]
          },
          {
            foreignKeyName: "reviews_reply_brand_fkey"
            columns: ["reply_id", "brand_id"]
            isOneToOne: false
            referencedRelation: "reviewed_replies"
            referencedColumns: ["id", "brand_id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      brand_weekly_scores: {
        Row: {
          avg_score: number | null
          brand_id: string | null
          critical_count: number | null
          review_count: number | null
          week: string | null
        }
        Relationships: [
          {
            foreignKeyName: "replies_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      reviewed_replies: {
        Row: {
          brand_id: string | null
          id: string | null
          issue_codes: string[] | null
          sent_at: string | null
          specialist_id: string | null
          subject: string | null
          ticket_ref: string | null
        }
        Insert: {
          brand_id?: string | null
          id?: string | null
          issue_codes?: never
          sent_at?: string | null
          specialist_id?: string | null
          subject?: string | null
          ticket_ref?: string | null
        }
        Update: {
          brand_id?: string | null
          id?: string | null
          issue_codes?: never
          sent_at?: string | null
          specialist_id?: string | null
          subject?: string | null
          ticket_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "replies_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replies_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_brand_scores: {
        Row: {
          avg_score: number | null
          brand_id: string | null
          critical_count: number | null
          review_count: number | null
          specialist_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "replies_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replies_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_issue_counts: {
        Row: {
          brand_id: string | null
          flagged_count: number | null
          issue_code: string | null
          last_sent_at: string | null
          specialist_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "replies_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replies_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_issues_issue_code_fkey"
            columns: ["issue_code"]
            isOneToOne: false
            referencedRelation: "issue_types"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Functions: {
      save_review: {
        Args: {
          p_comment: string
          p_issue_codes: string[]
          p_reply_id: string
          p_score: number
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

