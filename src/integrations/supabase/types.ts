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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          body: string
          cohort_id: string | null
          created_at: string
          created_by: string | null
          id: string
          title: string
        }
        Insert: {
          body?: string
          cohort_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          title: string
        }
        Update: {
          body?: string
          cohort_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          city: string | null
          course_id: string | null
          created_at: string
          date_of_birth: string | null
          education: string | null
          email: string
          experience_level: string | null
          full_name: string
          gender: string | null
          goals: string
          has_computer: boolean
          id: string
          learning_mode: string | null
          occupation: string | null
          phone: string
          preferred_schedule: string | null
          preferred_start: string | null
          questions: string | null
          referral_source: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["application_status"]
          student_id: string | null
        }
        Insert: {
          city?: string | null
          course_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          education?: string | null
          email: string
          experience_level?: string | null
          full_name: string
          gender?: string | null
          goals?: string
          has_computer?: boolean
          id?: string
          learning_mode?: string | null
          occupation?: string | null
          phone: string
          preferred_schedule?: string | null
          preferred_start?: string | null
          questions?: string | null
          referral_source?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          student_id?: string | null
        }
        Update: {
          city?: string | null
          course_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          education?: string | null
          email?: string
          experience_level?: string | null
          full_name?: string
          gender?: string | null
          goals?: string
          has_computer?: boolean
          id?: string
          learning_mode?: string | null
          occupation?: string | null
          phone?: string
          preferred_schedule?: string | null
          preferred_start?: string | null
          questions?: string | null
          referral_source?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          accepts_link: boolean
          allowed_formats: string[]
          brief: string
          cohort_id: string
          created_at: string
          created_by: string | null
          due_at: string
          id: string
          is_open: boolean
          max_file_mb: number
          max_score: number
          resource_url: string | null
          submit_token: string
          title: string
        }
        Insert: {
          accepts_link?: boolean
          allowed_formats?: string[]
          brief?: string
          cohort_id: string
          created_at?: string
          created_by?: string | null
          due_at: string
          id?: string
          is_open?: boolean
          max_file_mb?: number
          max_score?: number
          resource_url?: string | null
          submit_token?: string
          title: string
        }
        Update: {
          accepts_link?: boolean
          allowed_formats?: string[]
          brief?: string
          cohort_id?: string
          created_at?: string
          created_by?: string | null
          due_at?: string
          id?: string
          is_open?: boolean
          max_file_mb?: number
          max_score?: number
          resource_url?: string | null
          submit_token?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          id: string
          marked_at: string
          note: string | null
          session_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Insert: {
          id?: string
          marked_at?: string
          note?: string | null
          session_id: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Update: {
          id?: string
          marked_at?: string
          note?: string | null
          session_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      class_sessions: {
        Row: {
          cohort_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          instructor: string | null
          location: string | null
          meeting_link: string | null
          starts_at: string
          topic: string
        }
        Insert: {
          cohort_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          instructor?: string | null
          location?: string | null
          meeting_link?: string | null
          starts_at: string
          topic: string
        }
        Update: {
          cohort_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          instructor?: string | null
          location?: string | null
          meeting_link?: string | null
          starts_at?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_sessions_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      cohorts: {
        Row: {
          capacity: number
          course_id: string
          created_at: string
          end_date: string | null
          id: string
          mode: string
          name: string
          schedule: string
          start_date: string
          status: string
        }
        Insert: {
          capacity?: number
          course_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          mode?: string
          name: string
          schedule?: string
          start_date: string
          status?: string
        }
        Update: {
          capacity?: number
          course_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          mode?: string
          name?: string
          schedule?: string
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohorts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string
          duration_weeks: number
          fee: number
          id: string
          is_active: boolean
          level: string
          outline: string[]
          slug: string
          sort_order: number
          summary: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string
          duration_weeks?: number
          fee?: number
          id?: string
          is_active?: boolean
          level?: string
          outline?: string[]
          slug: string
          sort_order?: number
          summary?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          duration_weeks?: number
          fee?: number
          id?: string
          is_active?: boolean
          level?: string
          outline?: string[]
          slug?: string
          sort_order?: number
          summary?: string
          title?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          cohort_id: string
          created_at: string
          id: string
          status: string
          student_id: string
        }
        Insert: {
          cohort_id: string
          created_at?: string
          id?: string
          status?: string
          student_id: string
        }
        Update: {
          cohort_id?: string
          created_at?: string
          id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id: string
          phone?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          accent: string
          brand_name: string
          created_at: string
          id: string
          logo_url: string | null
          singleton: boolean
          tagline: string
          updated_at: string
        }
        Insert: {
          accent?: string
          brand_name?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          singleton?: boolean
          tagline?: string
          updated_at?: string
        }
        Update: {
          accent?: string
          brand_name?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          singleton?: boolean
          tagline?: string
          updated_at?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          assignment_id: string
          content: string
          feedback: string | null
          file_url: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          score: number | null
          student_id: string
          submitted_at: string
        }
        Insert: {
          assignment_id: string
          content?: string
          feedback?: string | null
          file_url?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          score?: number | null
          student_id: string
          submitted_at?: string
        }
        Update: {
          assignment_id?: string
          content?: string
          feedback?: string | null
          file_url?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          score?: number | null
          student_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_in_cohort: {
        Args: { _cohort_id: string; _user_id: string }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      account_status: "active" | "suspended"
      app_role: "admin" | "instructor" | "student"
      application_status: "pending" | "approved" | "rejected"
      attendance_status: "present" | "late" | "absent" | "excused"
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
    Enums: {
      account_status: ["active", "suspended"],
      app_role: ["admin", "instructor", "student"],
      application_status: ["pending", "approved", "rejected"],
      attendance_status: ["present", "late", "absent", "excused"],
    },
  },
} as const
