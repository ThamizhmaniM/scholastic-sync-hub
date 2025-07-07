export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_accounts: {
        Row: {
          created_at: string
          id: string
          is_master: boolean
          password_hash: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_master?: boolean
          password_hash: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          is_master?: boolean
          password_hash?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          created_at: string | null
          date: string
          id: string
          status: string
          student_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id: string
          status: string
          student_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          status?: string
          student_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      managed_users: {
        Row: {
          auth_user_id: string | null
          created_at: string
          created_by_admin: string | null
          email: string
          full_name: string | null
          id: string
          password: string
          student_id: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          created_by_admin?: string | null
          email: string
          full_name?: string | null
          id?: string
          password: string
          student_id?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          created_by_admin?: string | null
          email?: string
          full_name?: string | null
          id?: string
          password?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "managed_users_created_by_admin_fkey"
            columns: ["created_by_admin"]
            isOneToOne: false
            referencedRelation: "admin_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          class: string
          created_at: string | null
          gender: string
          id: string
          name: string
          parent_phone: string | null
          school_name: string | null
          subjects: string[]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          class: string
          created_at?: string | null
          gender: string
          id: string
          name: string
          parent_phone?: string | null
          school_name?: string | null
          subjects: string[]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          class?: string
          created_at?: string | null
          gender?: string
          id?: string
          name?: string
          parent_phone?: string | null
          school_name?: string | null
          subjects?: string[]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      weekly_test_marks: {
        Row: {
          created_at: string | null
          id: string
          marks_obtained: number
          remarks: string | null
          student_id: string
          subject: string
          test_date: string
          total_marks: number
          updated_at: string | null
          user_id: string | null
          week_number: number
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          marks_obtained: number
          remarks?: string | null
          student_id: string
          subject: string
          test_date: string
          total_marks?: number
          updated_at?: string | null
          user_id?: string | null
          week_number: number
          year: number
        }
        Update: {
          created_at?: string | null
          id?: string
          marks_obtained?: number
          remarks?: string | null
          student_id?: string
          subject?: string
          test_date?: string
          total_marks?: number
          updated_at?: string | null
          user_id?: string | null
          week_number?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "weekly_test_marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          phone_number: string
          sent_at: string
          status: string
          student_name: string | null
          user_id: string | null
          whatsapp_message_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          phone_number: string
          sent_at?: string
          status?: string
          student_name?: string | null
          user_id?: string | null
          whatsapp_message_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          phone_number?: string
          sent_at?: string
          status?: string
          student_name?: string | null
          user_id?: string | null
          whatsapp_message_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
