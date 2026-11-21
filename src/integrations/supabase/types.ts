export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      contact_details: {
        Row: {
          address: string
          email: string
          email_secondary: string
          emergency_phone: string
          facebook: string
          id: number
          instagram: string
          phone: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
          address?: string
          email?: string
          email_secondary?: string
          emergency_phone?: string
          facebook?: string
          id?: number
          instagram?: string
          phone?: string
          updated_at?: string
          whatsapp?: string
        }
        Update: {
          address?: string
          email?: string
          email_secondary?: string
          emergency_phone?: string
          facebook?: string
          id?: number
          instagram?: string
          phone?: string
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      admin_profiles: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          is_active: boolean
          is_super_admin: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          is_active?: boolean
          is_super_admin?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          is_active?: boolean
          is_super_admin?: boolean
          user_id?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          id: number
          notify_email: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          notify_email?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          notify_email?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contact_tags: {
        Row: {
          assigned_at: string
          contact_id: string
          tag_id: string
        }
        Insert: {
          assigned_at?: string
          contact_id: string
          tag_id: string
        }
        Update: {
          assigned_at?: string
          contact_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_tags_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          email: string
          first_seen_at: string
          id: string
          last_seen_at: string
          name: string | null
          phone: string | null
          source: string | null
          subscribed: boolean
        }
        Insert: {
          email: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          name?: string | null
          phone?: string | null
          source?: string | null
          subscribed?: boolean
        }
        Update: {
          email?: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          name?: string | null
          phone?: string | null
          source?: string | null
          subscribed?: boolean
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          created_at: string
          email: string | null
          handled: boolean
          id: string
          message: string
          name: string
          phone: string | null
          preferred_date: string | null
          service: string | null
          subject: string | null
          type: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          handled?: boolean
          id?: string
          message?: string
          name: string
          phone?: string | null
          preferred_date?: string | null
          service?: string | null
          subject?: string | null
          type?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          handled?: boolean
          id?: string
          message?: string
          name?: string
          phone?: string | null
          preferred_date?: string | null
          service?: string | null
          subject?: string | null
          type?: string
        }
        Relationships: []
      }
      newsletter_history: {
        Row: {
          admin_id: string | null
          created_at: string
          failed_count: number
          html: string
          id: string
          recipient_count: number
          sent_by_email: string | null
          sent_count: number
          subject: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          failed_count?: number
          html: string
          id?: string
          recipient_count?: number
          sent_by_email?: string | null
          sent_count?: number
          subject: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          failed_count?: number
          html?: string
          id?: string
          recipient_count?: number
          sent_by_email?: string | null
          sent_count?: number
          subject?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: { _uid?: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: { _uid?: string }
        Returns: boolean
      }
      list_contacts: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_subscribed?: boolean
          p_tag_ids?: string[]
        }
        Returns: Json
      }
      newsletter_recipient_count: {
        Args: { p_tag_ids?: string[] }
        Returns: number
      }
      newsletter_recipients: {
        Args: { p_tag_ids?: string[] }
        Returns: { email: string; id: string; name: string | null }[]
      }
      set_contact_tags: {
        Args: { p_contact_id: string; p_tag_ids: string[] }
        Returns: undefined
      }
      submit_inquiry: {
        Args: {
          p_email?: string
          p_message?: string
          p_name: string
          p_phone?: string
          p_preferred_date?: string
          p_service?: string
          p_subject?: string
          p_type: string
        }
        Returns: string
      }
      subscribe_newsletter: {
        Args: { p_email: string; p_name?: string; p_phone?: string }
        Returns: undefined
      }
      unsubscribe_contact: {
        Args: { p_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
