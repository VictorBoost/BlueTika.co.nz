 
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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      abuse_flags: {
        Row: {
          created_at: string | null
          details: string | null
          flag_type: string | null
          id: string
          ip_hash: string | null
          owner_id: string | null
          reviewed: boolean | null
          session_id: string | null
          severity: string | null
          widget_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          flag_type?: string | null
          id?: string
          ip_hash?: string | null
          owner_id?: string | null
          reviewed?: boolean | null
          session_id?: string | null
          severity?: string | null
          widget_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          flag_type?: string | null
          id?: string
          ip_hash?: string | null
          owner_id?: string | null
          reviewed?: boolean | null
          session_id?: string | null
          severity?: string | null
          widget_id?: string | null
        }
        Relationships: []
      }
      account_suspensions: {
        Row: {
          bypass_attempt_count: number
          created_at: string | null
          id: string
          is_active: boolean | null
          suspension_ends_at: string | null
          suspension_started_at: string | null
          suspension_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bypass_attempt_count?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          suspension_ends_at?: string | null
          suspension_started_at?: string | null
          suspension_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bypass_attempt_count?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          suspension_ends_at?: string | null
          suspension_started_at?: string | null
          suspension_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      accounting_entries: {
        Row: {
          amount: number
          contract_id: string | null
          created_at: string | null
          description: string
          entry_date: string
          entry_type: string
          gst_included: boolean | null
          id: string
          provider_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          contract_id?: string | null
          created_at?: string | null
          description: string
          entry_date: string
          entry_type: string
          gst_included?: boolean | null
          id?: string
          provider_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          contract_id?: string | null
          created_at?: string | null
          description?: string
          entry_date?: string
          entry_type?: string
          gst_included?: boolean | null
          id?: string
          provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounting_entries_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_entries_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      additional_charges: {
        Row: {
          amount: number
          approved_at: string | null
          client_id: string
          commission_amount: number | null
          commission_rate: number | null
          contract_id: string
          created_at: string | null
          declined_at: string | null
          id: string
          net_to_provider: number | null
          paid_at: string | null
          payment_processing_fee: number | null
          platform_fee: number | null
          provider_id: string
          reason: string
          status: string
          stripe_payment_intent_id: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          client_id: string
          commission_amount?: number | null
          commission_rate?: number | null
          contract_id: string
          created_at?: string | null
          declined_at?: string | null
          id?: string
          net_to_provider?: number | null
          paid_at?: string | null
          payment_processing_fee?: number | null
          platform_fee?: number | null
          provider_id: string
          reason: string
          status?: string
          stripe_payment_intent_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          client_id?: string
          commission_amount?: number | null
          commission_rate?: number | null
          contract_id?: string
          created_at?: string | null
          declined_at?: string | null
          id?: string
          net_to_provider?: number | null
          paid_at?: string | null
          payment_processing_fee?: number | null
          platform_fee?: number | null
          provider_id?: string
          reason?: string
          status?: string
          stripe_payment_intent_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "additional_charges_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "additional_charges_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "additional_charges_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_login_logs: {
        Row: {
          created_at: string | null
          email: string
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          ip_address?: string | null
          success: boolean
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      agent_performance: {
        Row: {
          agent_id: string | null
          avg_response_time_minutes: number | null
          conversations_handled: number | null
          created_at: string | null
          date: string | null
          id: string
          owner_id: string | null
          resolution_rate: number | null
        }
        Insert: {
          agent_id?: string | null
          avg_response_time_minutes?: number | null
          conversations_handled?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          owner_id?: string | null
          resolution_rate?: number | null
        }
        Update: {
          agent_id?: string | null
          avg_response_time_minutes?: number | null
          conversations_handled?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          owner_id?: string | null
          resolution_rate?: number | null
        }
        Relationships: []
      }
      ai_brain: {
        Row: {
          about: string | null
          faqs: string | null
          id: string
          owner_id: string | null
          rules: string | null
          services: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          about?: string | null
          faqs?: string | null
          id?: string
          owner_id?: string | null
          rules?: string | null
          services?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          about?: string | null
          faqs?: string | null
          id?: string
          owner_id?: string | null
          rules?: string | null
          services?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_brains: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          tone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          tone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          tone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      analytics_daily: {
        Row: {
          avg_bot_messages: number | null
          conversations_by_domain: Json | null
          created_at: string | null
          date: string | null
          handoff_rate: number | null
          id: string
          owner_id: string | null
          top_questions: Json | null
          total_conversations: number | null
        }
        Insert: {
          avg_bot_messages?: number | null
          conversations_by_domain?: Json | null
          created_at?: string | null
          date?: string | null
          handoff_rate?: number | null
          id?: string
          owner_id?: string | null
          top_questions?: Json | null
          total_conversations?: number | null
        }
        Update: {
          avg_bot_messages?: number | null
          conversations_by_domain?: Json | null
          created_at?: string | null
          date?: string | null
          handoff_rate?: number | null
          id?: string
          owner_id?: string | null
          top_questions?: Json | null
          total_conversations?: number | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auth_audit_logs: {
        Row: {
          created_at: string | null
          email: string | null
          event_type: string | null
          failure_reason: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          event_type?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          event_type?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bids: {
        Row: {
          amount: number
          created_at: string | null
          estimated_timeline: string | null
          id: string
          is_visible: boolean | null
          message: string
          project_id: string
          provider_id: string
          status: string | null
          trade_certificate_url: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          estimated_timeline?: string | null
          id?: string
          is_visible?: boolean | null
          message: string
          project_id: string
          provider_id: string
          status?: string | null
          trade_certificate_url?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          estimated_timeline?: string | null
          id?: string
          is_visible?: boolean | null
          message?: string
          project_id?: string
          provider_id?: string
          status?: string | null
          trade_certificate_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bids_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_accounts: {
        Row: {
          bot_type: string
          created_at: string | null
          generation_batch: number
          id: string
          is_active: boolean | null
          profile_id: string
        }
        Insert: {
          bot_type: string
          created_at?: string | null
          generation_batch: number
          id?: string
          is_active?: boolean | null
          profile_id: string
        }
        Update: {
          bot_type?: string
          created_at?: string | null
          generation_batch?: number
          id?: string
          is_active?: boolean | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_activity_logs: {
        Row: {
          action_step: string
          action_type: string
          bot_id: string
          created_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          success: boolean
        }
        Insert: {
          action_step: string
          action_type: string
          bot_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          success: boolean
        }
        Update: {
          action_step?: string
          action_type?: string
          bot_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "bot_activity_logs_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bot_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_bypass_attempts: {
        Row: {
          attempt_type: string
          bid_id: string | null
          bot_profile_id: string | null
          content_snippet: string
          created_at: string | null
          detection_status: string
          id: string
          project_id: string | null
        }
        Insert: {
          attempt_type: string
          bid_id?: string | null
          bot_profile_id?: string | null
          content_snippet: string
          created_at?: string | null
          detection_status: string
          id?: string
          project_id?: string | null
        }
        Update: {
          attempt_type?: string
          bid_id?: string | null
          bot_profile_id?: string | null
          content_snippet?: string
          created_at?: string | null
          detection_status?: string
          id?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bot_bypass_attempts_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_bypass_attempts_bot_profile_id_fkey"
            columns: ["bot_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_bypass_attempts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      bypass_attempts: {
        Row: {
          content_attempted: string
          created_at: string | null
          detected_patterns: string[]
          escalation_level: number
          id: string
          page_location: string
          user_id: string
        }
        Insert: {
          content_attempted: string
          created_at?: string | null
          detected_patterns: string[]
          escalation_level?: number
          id?: string
          page_location: string
          user_id: string
        }
        Update: {
          content_attempted?: string
          created_at?: string | null
          detected_patterns?: string[]
          escalation_level?: number
          id?: string
          page_location?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bypass_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chatbot_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_sessions: {
        Row: {
          created_at: string | null
          id: string
          lead_score: number | null
          session_id: string
          status: string | null
          updated_at: string | null
          user_id: string
          visitor_email: string | null
          visitor_name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_score?: number | null
          session_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_score?: number | null
          session_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Relationships: []
      }
      commission_settings: {
        Row: {
          id: string
          promo_active: boolean | null
          promo_rate: number | null
          updated_at: string | null
          warning_days: number | null
        }
        Insert: {
          id?: string
          promo_active?: boolean | null
          promo_rate?: number | null
          updated_at?: string | null
          warning_days?: number | null
        }
        Update: {
          id?: string
          promo_active?: boolean | null
          promo_rate?: number | null
          updated_at?: string | null
          warning_days?: number | null
        }
        Relationships: []
      }
      commission_tiers: {
        Row: {
          created_at: string | null
          display_name: string
          id: string
          max_sales: number | null
          min_sales: number
          standard_rate: number
          tier_name: string
          tier_order: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name: string
          id?: string
          max_sales?: number | null
          min_sales: number
          standard_rate: number
          tier_name: string
          tier_order: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          id?: string
          max_sales?: number | null
          min_sales?: number
          standard_rate?: number
          tier_name?: string
          tier_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      connection_test: {
        Row: {
          created_at: string | null
          id: string
          message: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
        }
        Relationships: []
      }
      contract_evidence_photos: {
        Row: {
          confirmed_at: string | null
          contract_id: string
          created_at: string | null
          id: string
          photo_type: string
          photo_urls: string[] | null
          reminder_sent_at: string | null
          status: string
          updated_at: string | null
          uploader_role: string
        }
        Insert: {
          confirmed_at?: string | null
          contract_id: string
          created_at?: string | null
          id?: string
          photo_type: string
          photo_urls?: string[] | null
          reminder_sent_at?: string | null
          status?: string
          updated_at?: string | null
          uploader_role: string
        }
        Update: {
          confirmed_at?: string | null
          contract_id?: string
          created_at?: string | null
          id?: string
          photo_type?: string
          photo_urls?: string[] | null
          reminder_sent_at?: string | null
          status?: string
          updated_at?: string | null
          uploader_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_evidence_photos_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          after_photos_submitted_at: string | null
          bid_id: string
          client_dispute_deadline: string | null
          client_id: string
          completed_at: string | null
          created_at: string | null
          final_amount: number
          funds_released_at: string | null
          google_calendar_event_id: string | null
          id: string
          payment_processing_fee: number | null
          payment_status: string | null
          platform_fee: number | null
          project_id: string
          provider_dispute_deadline: string | null
          provider_id: string
          ready_for_release_at: string | null
          released_by: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          total_amount: number | null
          updated_at: string | null
          work_done_at: string | null
        }
        Insert: {
          after_photos_submitted_at?: string | null
          bid_id: string
          client_dispute_deadline?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string | null
          final_amount: number
          funds_released_at?: string | null
          google_calendar_event_id?: string | null
          id?: string
          payment_processing_fee?: number | null
          payment_status?: string | null
          platform_fee?: number | null
          project_id: string
          provider_dispute_deadline?: string | null
          provider_id: string
          ready_for_release_at?: string | null
          released_by?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
          work_done_at?: string | null
        }
        Update: {
          after_photos_submitted_at?: string | null
          bid_id?: string
          client_dispute_deadline?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string | null
          final_amount?: number
          funds_released_at?: string | null
          google_calendar_event_id?: string | null
          id?: string
          payment_processing_fee?: number | null
          payment_status?: string | null
          platform_fee?: number | null
          project_id?: string
          provider_dispute_deadline?: string | null
          provider_id?: string
          ready_for_release_at?: string | null
          released_by?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
          work_done_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_released_by_fkey"
            columns: ["released_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_logs: {
        Row: {
          bot_messages: number | null
          browser: string | null
          created_at: string | null
          credits_consumed: number | null
          device_type: string | null
          handoff_triggered: boolean | null
          id: string
          ip_hash: string | null
          owner_id: string | null
          session_id: string | null
          total_messages: number | null
          visitor_email: string | null
          visitor_messages: number | null
          website_domain: string | null
          widget_id: string | null
        }
        Insert: {
          bot_messages?: number | null
          browser?: string | null
          created_at?: string | null
          credits_consumed?: number | null
          device_type?: string | null
          handoff_triggered?: boolean | null
          id?: string
          ip_hash?: string | null
          owner_id?: string | null
          session_id?: string | null
          total_messages?: number | null
          visitor_email?: string | null
          visitor_messages?: number | null
          website_domain?: string | null
          widget_id?: string | null
        }
        Update: {
          bot_messages?: number | null
          browser?: string | null
          created_at?: string | null
          credits_consumed?: number | null
          device_type?: string | null
          handoff_triggered?: boolean | null
          id?: string
          ip_hash?: string | null
          owner_id?: string | null
          session_id?: string | null
          total_messages?: number | null
          visitor_email?: string | null
          visitor_messages?: number | null
          website_domain?: string | null
          widget_id?: string | null
        }
        Relationships: []
      }
      credit_caps: {
        Row: {
          created_at: string | null
          id: string
          max_chat_cap: number | null
          max_image_cap: number | null
          max_video_cap: number | null
          monthly_chat_credits: number
          monthly_image_credits: number
          monthly_video_credits: number
          price_display: string | null
          price_nzd: number
          show_price: boolean | null
          stripe_price_id: string | null
          tier: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_chat_cap?: number | null
          max_image_cap?: number | null
          max_video_cap?: number | null
          monthly_chat_credits: number
          monthly_image_credits: number
          monthly_video_credits: number
          price_display?: string | null
          price_nzd: number
          show_price?: boolean | null
          stripe_price_id?: string | null
          tier: string
        }
        Update: {
          created_at?: string | null
          id?: string
          max_chat_cap?: number | null
          max_image_cap?: number | null
          max_video_cap?: number | null
          monthly_chat_credits?: number
          monthly_image_credits?: number
          monthly_video_credits?: number
          price_display?: string | null
          price_nzd?: number
          show_price?: boolean | null
          stripe_price_id?: string | null
          tier?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          created_at: string | null
          credits_balance: number | null
          id: string
          owner_id: string | null
        }
        Insert: {
          created_at?: string | null
          credits_balance?: number | null
          id?: string
          owner_id?: string | null
        }
        Update: {
          created_at?: string | null
          credits_balance?: number | null
          id?: string
          owner_id?: string | null
        }
        Relationships: []
      }
      credits_co_nz: {
        Row: {
          chat_credits: number | null
          created_at: string | null
          id: string
          image_credits: number | null
          last_reset: string | null
          updated_at: string | null
          user_id: string
          video_credits: number | null
        }
        Insert: {
          chat_credits?: number | null
          created_at?: string | null
          id?: string
          image_credits?: number | null
          last_reset?: string | null
          updated_at?: string | null
          user_id: string
          video_credits?: number | null
        }
        Update: {
          chat_credits?: number | null
          created_at?: string | null
          id?: string
          image_credits?: number | null
          last_reset?: string | null
          updated_at?: string | null
          user_id?: string
          video_credits?: number | null
        }
        Relationships: []
      }
      credits_nz: {
        Row: {
          chat_credits: number | null
          created_at: string | null
          id: string
          image_credits: number | null
          last_reset: string | null
          updated_at: string | null
          user_id: string
          video_credits: number | null
        }
        Insert: {
          chat_credits?: number | null
          created_at?: string | null
          id?: string
          image_credits?: number | null
          last_reset?: string | null
          updated_at?: string | null
          user_id: string
          video_credits?: number | null
        }
        Update: {
          chat_credits?: number | null
          created_at?: string | null
          id?: string
          image_credits?: number | null
          last_reset?: string | null
          updated_at?: string | null
          user_id?: string
          video_credits?: number | null
        }
        Relationships: []
      }
      directory_analytics: {
        Row: {
          clicked_at: string | null
          converted_to_project: boolean | null
          id: string
          listing_id: string
          project_id: string | null
          visitor_id: string | null
        }
        Insert: {
          clicked_at?: string | null
          converted_to_project?: boolean | null
          id?: string
          listing_id: string
          project_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          clicked_at?: string | null
          converted_to_project?: boolean | null
          id?: string
          listing_id?: string
          project_id?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directory_analytics_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "directory_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_analytics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_analytics_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      directory_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      directory_listings: {
        Row: {
          business_name: string
          category_id: string
          city: string
          claimed_by: string | null
          created_at: string | null
          description: string
          featured: boolean | null
          id: string
          is_active: boolean | null
          phone: string
          photos: string[] | null
          provider_id: string | null
          slug: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          business_name: string
          category_id: string
          city: string
          claimed_by?: string | null
          created_at?: string | null
          description: string
          featured?: boolean | null
          id?: string
          is_active?: boolean | null
          phone: string
          photos?: string[] | null
          provider_id?: string | null
          slug: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          business_name?: string
          category_id?: string
          city?: string
          claimed_by?: string | null
          created_at?: string | null
          description?: string
          featured?: boolean | null
          id?: string
          is_active?: boolean | null
          phone?: string
          photos?: string[] | null
          provider_id?: string | null
          slug?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directory_listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "directory_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_listings_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "directory_listings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          claim_description: string
          client_refund_amount: number | null
          contract_id: string
          created_at: string | null
          id: string
          provider_payout_amount: number | null
          raised_by: string
          raiser_role: string
          resolution_reason: string | null
          resolution_type: string | null
          resolved_at: string | null
          resolved_by: string | null
          updated_at: string | null
        }
        Insert: {
          claim_description: string
          client_refund_amount?: number | null
          contract_id: string
          created_at?: string | null
          id?: string
          provider_payout_amount?: number | null
          raised_by: string
          raiser_role: string
          resolution_reason?: string | null
          resolution_type?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          updated_at?: string | null
        }
        Update: {
          claim_description?: string
          client_refund_amount?: number | null
          contract_id?: string
          created_at?: string | null
          id?: string
          provider_payout_amount?: number | null
          raised_by?: string
          raiser_role?: string
          resolution_reason?: string | null
          resolution_type?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disputes_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_raised_by_fkey"
            columns: ["raised_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string | null
          email_type: string
          error_message: string | null
          id: string
          recipient_email: string
          sent_at: string | null
          status: string
          subject: string
        }
        Insert: {
          created_at?: string | null
          email_type: string
          error_message?: string | null
          id?: string
          recipient_email: string
          sent_at?: string | null
          status: string
          subject: string
        }
        Update: {
          created_at?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          sent_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      failed_login_lockouts: {
        Row: {
          created_at: string | null
          email: string
          failed_attempts: number | null
          id: string
          locked_until: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          failed_attempts?: number | null
          id?: string
          locked_until?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          failed_attempts?: number | null
          id?: string
          locked_until?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fund_releases: {
        Row: {
          agreed_price: number
          commission_amount: number
          commission_rate: number
          contract_id: string
          created_at: string | null
          id: string
          net_to_provider: number
          notes: string | null
          release_type: string
          released_by: string
        }
        Insert: {
          agreed_price: number
          commission_amount: number
          commission_rate: number
          contract_id: string
          created_at?: string | null
          id?: string
          net_to_provider: number
          notes?: string | null
          release_type: string
          released_by: string
        }
        Update: {
          agreed_price?: number
          commission_amount?: number
          commission_rate?: number
          contract_id?: string
          created_at?: string | null
          id?: string
          net_to_provider?: number
          notes?: string | null
          release_type?: string
          released_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "fund_releases_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: true
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fund_releases_released_by_fkey"
            columns: ["released_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_images: {
        Row: {
          created_at: string | null
          id: string
          replicate_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          replicate_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          replicate_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      generated_videos: {
        Row: {
          created_at: string | null
          id: string
          replicate_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          replicate_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          replicate_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      government_verification_api: {
        Row: {
          api_endpoint_url: string | null
          api_key: string | null
          enabled: boolean | null
          id: string
          last_tested_at: string | null
          test_error_message: string | null
          test_status: string | null
          updated_at: string | null
        }
        Insert: {
          api_endpoint_url?: string | null
          api_key?: string | null
          enabled?: boolean | null
          id?: string
          last_tested_at?: string | null
          test_error_message?: string | null
          test_status?: string | null
          updated_at?: string | null
        }
        Update: {
          api_endpoint_url?: string | null
          api_key?: string | null
          enabled?: boolean | null
          id?: string
          last_tested_at?: string | null
          test_error_message?: string | null
          test_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      images: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          image_url: string | null
          model: string
          prompt: string
          replicate_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          image_url?: string | null
          model: string
          prompt: string
          replicate_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          image_url?: string | null
          model?: string
          prompt?: string
          replicate_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          company_logo_url: string | null
          company_name: string
          contract_id: string
          created_at: string | null
          custom_colors: Json | null
          id: string
          invoice_number: string
          issued_date: string
          provider_id: string
          sent_at: string | null
          updated_at: string | null
        }
        Insert: {
          company_logo_url?: string | null
          company_name: string
          contract_id: string
          created_at?: string | null
          custom_colors?: Json | null
          id?: string
          invoice_number: string
          issued_date: string
          provider_id: string
          sent_at?: string | null
          updated_at?: string | null
        }
        Update: {
          company_logo_url?: string | null
          company_name?: string
          contract_id?: string
          created_at?: string | null
          custom_colors?: Json | null
          id?: string
          invoice_number?: string
          issued_date?: string
          provider_id?: string
          sent_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_suspensions: {
        Row: {
          created_at: string | null
          id: string
          ip_hash: string | null
          owner_id: string | null
          permanent_ban: boolean | null
          suspended_until: string | null
          suspension_count: number | null
          widget_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          owner_id?: string | null
          permanent_ban?: boolean | null
          suspended_until?: string | null
          suspension_count?: number | null
          widget_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          owner_id?: string | null
          permanent_ban?: boolean | null
          suspended_until?: string | null
          suspension_count?: number | null
          widget_id?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          notes: string | null
          phone: string | null
          source: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_nz"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_queue: {
        Row: {
          content_type: string
          created_at: string | null
          decision: string | null
          decision_reason: string | null
          id: string
          item_id: string
          metadata: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          content_type: string
          created_at?: string | null
          decision?: string | null
          decision_reason?: string | null
          id?: string
          item_id: string
          metadata?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          content_type?: string
          created_at?: string | null
          decision?: string | null
          decision_reason?: string | null
          id?: string
          item_id?: string
          metadata?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_queue_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_settings: {
        Row: {
          bot_content_auto: boolean | null
          chat_message_auto: boolean | null
          driver_licence_auto: boolean | null
          id: string
          police_check_auto: boolean | null
          profile_photo_auto: boolean | null
          project_listing_auto: boolean | null
          project_media_auto: boolean | null
          review_auto: boolean | null
          trade_certificate_auto: boolean | null
          updated_at: string | null
        }
        Insert: {
          bot_content_auto?: boolean | null
          chat_message_auto?: boolean | null
          driver_licence_auto?: boolean | null
          id?: string
          police_check_auto?: boolean | null
          profile_photo_auto?: boolean | null
          project_listing_auto?: boolean | null
          project_media_auto?: boolean | null
          review_auto?: boolean | null
          trade_certificate_auto?: boolean | null
          updated_at?: string | null
        }
        Update: {
          bot_content_auto?: boolean | null
          chat_message_auto?: boolean | null
          driver_licence_auto?: boolean | null
          id?: string
          police_check_auto?: boolean | null
          profile_photo_auto?: boolean | null
          project_listing_auto?: boolean | null
          project_media_auto?: boolean | null
          review_auto?: boolean | null
          trade_certificate_auto?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      monalisa_logs: {
        Row: {
          action_type: string
          created_at: string | null
          description: string
          id: string
          metadata: Json | null
          related_contract_id: string | null
          related_project_id: string | null
          related_user_id: string | null
          severity: string
          title: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          description: string
          id?: string
          metadata?: Json | null
          related_contract_id?: string | null
          related_project_id?: string | null
          related_user_id?: string | null
          severity?: string
          title: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          related_contract_id?: string | null
          related_project_id?: string | null
          related_user_id?: string | null
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "monalisa_logs_related_contract_id_fkey"
            columns: ["related_contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monalisa_logs_related_project_id_fkey"
            columns: ["related_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monalisa_logs_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      monalisa_settings: {
        Row: {
          id: string
          is_active: boolean
          last_check_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          is_active?: boolean
          last_check_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          is_active?: boolean
          last_check_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          related_contract_id: string | null
          related_project_id: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          related_contract_id?: string | null
          related_project_id?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          related_contract_id?: string | null
          related_project_id?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_contract_id_fkey"
            columns: ["related_contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_project_id_fkey"
            columns: ["related_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          token: string
          used: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          token: string
          used?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_reset_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_revenue: {
        Row: {
          created_at: string | null
          id: string
          reporter_analytics: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          reporter_analytics?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          reporter_analytics?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_type: string | null
          setting_value: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_type?: string | null
          setting_value: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_type?: string | null
          setting_value?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          average_rating: number | null
          bio: string | null
          city_region: string | null
          commission_tier: string | null
          created_at: string | null
          current_tier: string | null
          date_of_birth: string | null
          domestic_helper_verified: boolean | null
          driver_licence_number: string | null
          driver_licence_url: string | null
          driver_licence_verified: boolean | null
          email: string | null
          first_name: string | null
          full_name: string | null
          google_calendar_access_token: string | null
          google_calendar_refresh_token: string | null
          google_calendar_token_expires_at: string | null
          gst_enabled: boolean | null
          id: string
          is_banned: boolean | null
          is_bot: boolean | null
          is_client: boolean | null
          is_provider: boolean | null
          last_name: string | null
          last_tier_calculation: string | null
          location: string | null
          nzbn_document_url: string | null
          nzbn_number: string | null
          nzbn_verified: boolean | null
          phone: string | null
          phone_number: string | null
          response_rate: number | null
          show_credentials_to_clients: boolean | null
          show_verified_publicly: boolean | null
          stripe_account_id: string | null
          stripe_account_status: string | null
          tier_updated_at: string | null
          total_reviews: number | null
          updated_at: string | null
          uses_marketplace: boolean | null
          uses_tikachat: boolean | null
          verification_rejection_reason: string | null
          verification_reviewed_at: string | null
          verification_status: string | null
          verification_submitted_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          city_region?: string | null
          commission_tier?: string | null
          created_at?: string | null
          current_tier?: string | null
          date_of_birth?: string | null
          domestic_helper_verified?: boolean | null
          driver_licence_number?: string | null
          driver_licence_url?: string | null
          driver_licence_verified?: boolean | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          google_calendar_access_token?: string | null
          google_calendar_refresh_token?: string | null
          google_calendar_token_expires_at?: string | null
          gst_enabled?: boolean | null
          id: string
          is_banned?: boolean | null
          is_bot?: boolean | null
          is_client?: boolean | null
          is_provider?: boolean | null
          last_name?: string | null
          last_tier_calculation?: string | null
          location?: string | null
          nzbn_document_url?: string | null
          nzbn_number?: string | null
          nzbn_verified?: boolean | null
          phone?: string | null
          phone_number?: string | null
          response_rate?: number | null
          show_credentials_to_clients?: boolean | null
          show_verified_publicly?: boolean | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          tier_updated_at?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          uses_marketplace?: boolean | null
          uses_tikachat?: boolean | null
          verification_rejection_reason?: string | null
          verification_reviewed_at?: string | null
          verification_status?: string | null
          verification_submitted_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          city_region?: string | null
          commission_tier?: string | null
          created_at?: string | null
          current_tier?: string | null
          date_of_birth?: string | null
          domestic_helper_verified?: boolean | null
          driver_licence_number?: string | null
          driver_licence_url?: string | null
          driver_licence_verified?: boolean | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          google_calendar_access_token?: string | null
          google_calendar_refresh_token?: string | null
          google_calendar_token_expires_at?: string | null
          gst_enabled?: boolean | null
          id?: string
          is_banned?: boolean | null
          is_bot?: boolean | null
          is_client?: boolean | null
          is_provider?: boolean | null
          last_name?: string | null
          last_tier_calculation?: string | null
          location?: string | null
          nzbn_document_url?: string | null
          nzbn_number?: string | null
          nzbn_verified?: boolean | null
          phone?: string | null
          phone_number?: string | null
          response_rate?: number | null
          show_credentials_to_clients?: boolean | null
          show_verified_publicly?: boolean | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          tier_updated_at?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          uses_marketplace?: boolean | null
          uses_tikachat?: boolean | null
          verification_rejection_reason?: string | null
          verification_reviewed_at?: string | null
          verification_status?: string | null
          verification_submitted_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          booking_type: string | null
          budget: number
          category_id: string | null
          client_id: string
          created_at: string | null
          date_from: string | null
          date_preference: string | null
          date_to: string | null
          description: string
          expires_at: string | null
          id: string
          is_expired: boolean | null
          last_reopened_at: string | null
          location: string
          photos: string[] | null
          reopened_count: number | null
          routine_custom_days: number | null
          routine_frequency: string | null
          routine_start_date: string | null
          selected_days: string[] | null
          specific_date: string | null
          start_date: string | null
          status: string | null
          subcategory_id: string | null
          title: string
          updated_at: string | null
          video_url: string | null
          weeks_count: number | null
        }
        Insert: {
          booking_type?: string | null
          budget: number
          category_id?: string | null
          client_id: string
          created_at?: string | null
          date_from?: string | null
          date_preference?: string | null
          date_to?: string | null
          description: string
          expires_at?: string | null
          id?: string
          is_expired?: boolean | null
          last_reopened_at?: string | null
          location: string
          photos?: string[] | null
          reopened_count?: number | null
          routine_custom_days?: number | null
          routine_frequency?: string | null
          routine_start_date?: string | null
          selected_days?: string[] | null
          specific_date?: string | null
          start_date?: string | null
          status?: string | null
          subcategory_id?: string | null
          title: string
          updated_at?: string | null
          video_url?: string | null
          weeks_count?: number | null
        }
        Update: {
          booking_type?: string | null
          budget?: number
          category_id?: string | null
          client_id?: string
          created_at?: string | null
          date_from?: string | null
          date_preference?: string | null
          date_to?: string | null
          description?: string
          expires_at?: string | null
          id?: string
          is_expired?: boolean | null
          last_reopened_at?: string | null
          location?: string
          photos?: string[] | null
          reopened_count?: number | null
          routine_custom_days?: number | null
          routine_frequency?: string | null
          routine_start_date?: string | null
          selected_days?: string[] | null
          specific_date?: string | null
          start_date?: string | null
          status?: string | null
          subcategory_id?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
          weeks_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_categories: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          provider_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          provider_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_categories_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_references: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          phone_number: string
          provider_id: string
          relationship: string
          subcategory_id: string | null
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id?: string
          phone_number: string
          provider_id: string
          relationship: string
          subcategory_id?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          phone_number?: string
          provider_id?: string
          relationship?: string
          subcategory_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_references_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_references_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_subscriptions: {
        Row: {
          billing_date: number
          created_at: string | null
          grace_period_ends_at: string | null
          id: string
          plan_id: string
          provider_id: string
          status: string
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          billing_date: number
          created_at?: string | null
          grace_period_ends_at?: string | null
          id?: string
          plan_id: string
          provider_id: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_date?: number
          created_at?: string | null
          grace_period_ends_at?: string | null
          id?: string
          plan_id?: string
          provider_id?: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_subscriptions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          id: string
          note: string | null
          outcome: string | null
          reason: string
          reported_project_id: string | null
          reported_user_id: string | null
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          note?: string | null
          outcome?: string | null
          reason: string
          reported_project_id?: string | null
          reported_user_id?: string | null
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          note?: string | null
          outcome?: string | null
          reason?: string
          reported_project_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_project_id_fkey"
            columns: ["reported_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          client_id: string
          comment: string | null
          contract_id: string
          created_at: string | null
          id: string
          is_public: boolean | null
          provider_id: string
          rating: number
          reminder_sent_at: string | null
          reviewee_role: string
          reviewer_role: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          comment?: string | null
          contract_id: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          provider_id: string
          rating: number
          reminder_sent_at?: string | null
          reviewee_role?: string
          reviewer_role?: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          comment?: string | null
          contract_id?: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          provider_id?: string
          rating?: number
          reminder_sent_at?: string | null
          reviewee_role?: string
          reviewer_role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_bookings: {
        Row: {
          client_id: string
          contract_id: string | null
          created_at: string | null
          day_of_week: string
          google_calendar_event_id: string | null
          id: string
          project_id: string
          provider_id: string
          reminder_sent: boolean | null
          reminder_sent_at: string | null
          routine_contract_id: string | null
          session_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          contract_id?: string | null
          created_at?: string | null
          day_of_week: string
          google_calendar_event_id?: string | null
          id?: string
          project_id: string
          provider_id: string
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          routine_contract_id?: string | null
          session_date: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          contract_id?: string | null
          created_at?: string | null
          day_of_week?: string
          google_calendar_event_id?: string | null
          id?: string
          project_id?: string
          provider_id?: string
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          routine_contract_id?: string | null
          session_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_bookings_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_bookings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_bookings_routine_contract_id_fkey"
            columns: ["routine_contract_id"]
            isOneToOne: false
            referencedRelation: "routine_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_contracts: {
        Row: {
          activated_at: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          client_agreed: boolean | null
          client_agreed_at: string | null
          client_id: string
          created_at: string | null
          custom_days: number | null
          frequency: string
          id: string
          last_session_date: string | null
          next_session_date: string | null
          original_contract_id: string
          paused_at: string | null
          paused_by: string | null
          project_id: string
          provider_agreed: boolean | null
          provider_agreed_at: string | null
          provider_id: string
          selected_days: string[] | null
          sessions_completed: number | null
          start_date: string
          status: string
          total_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          activated_at?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          client_agreed?: boolean | null
          client_agreed_at?: string | null
          client_id: string
          created_at?: string | null
          custom_days?: number | null
          frequency: string
          id?: string
          last_session_date?: string | null
          next_session_date?: string | null
          original_contract_id: string
          paused_at?: string | null
          paused_by?: string | null
          project_id: string
          provider_agreed?: boolean | null
          provider_agreed_at?: string | null
          provider_id: string
          selected_days?: string[] | null
          sessions_completed?: number | null
          start_date: string
          status?: string
          total_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          activated_at?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          client_agreed?: boolean | null
          client_agreed_at?: string | null
          client_id?: string
          created_at?: string | null
          custom_days?: number | null
          frequency?: string
          id?: string
          last_session_date?: string | null
          next_session_date?: string | null
          original_contract_id?: string
          paused_at?: string | null
          paused_by?: string | null
          project_id?: string
          provider_agreed?: boolean | null
          provider_agreed_at?: string | null
          provider_id?: string
          selected_days?: string[] | null
          sessions_completed?: number | null
          start_date?: string
          status?: string
          total_revenue?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_contracts_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_contracts_original_contract_id_fkey"
            columns: ["original_contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_contracts_paused_by_fkey"
            columns: ["paused_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_contracts_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          access_token: string
          account_id: string
          account_name: string
          connected_at: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          metadata: Json | null
          platform: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          account_id: string
          account_name: string
          connected_at?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          metadata?: Json | null
          platform: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          account_id?: string
          account_name?: string
          connected_at?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          metadata?: Json | null
          platform?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_nz"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          account_id: string
          caption: string | null
          created_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          platform: string
          post_id: string | null
          post_url: string | null
          posted_at: string | null
          retry_count: number | null
          scheduled_for: string | null
          status: string
          updated_at: string | null
          user_id: string
          video_id: string
        }
        Insert: {
          account_id: string
          caption?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          platform: string
          post_id?: string | null
          post_url?: string | null
          posted_at?: string | null
          retry_count?: number | null
          scheduled_for?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
          video_id: string
        }
        Update: {
          account_id?: string
          caption?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          platform?: string
          post_id?: string | null
          post_url?: string | null
          posted_at?: string | null
          retry_count?: number | null
          scheduled_for?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_nz"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      staff_audit_logs: {
        Row: {
          action: string
          details: Json | null
          id: string
          ip_address: string | null
          record_id: string | null
          record_type: string
          staff_id: string
          staff_name: string
          timestamp: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          record_id?: string | null
          record_type: string
          staff_id: string
          staff_name: string
          timestamp?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          record_id?: string | null
          record_type?: string
          staff_id?: string
          staff_name?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_audit_logs_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          created_at: string | null
          custom_role_label: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string
          password_hash: string
          provider_id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_role_label?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          password_hash: string
          provider_id: string
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_role_label?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          password_hash?: string
          provider_id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_members_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_payment_failures: {
        Row: {
          created_at: string | null
          id: string
          resolved: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          resolved?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          resolved?: boolean | null
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          description: string
          feature_key: string
          id: string
          is_active: boolean | null
          monthly_price: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          feature_key: string
          id?: string
          is_active?: boolean | null
          monthly_price: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          feature_key?: string
          id?: string
          is_active?: boolean | null
          monthly_price?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_date: string | null
          created_at: string | null
          id: string
          overage_video_credits: number | null
          status: string | null
          subscription_revenue_nzd: number | null
          tier: string | null
          total_video_credits: number | null
          user_id: string | null
        }
        Insert: {
          billing_date?: string | null
          created_at?: string | null
          id?: string
          overage_video_credits?: number | null
          status?: string | null
          subscription_revenue_nzd?: number | null
          tier?: string | null
          total_video_credits?: number | null
          user_id?: string | null
        }
        Update: {
          billing_date?: string | null
          created_at?: string | null
          id?: string
          overage_video_credits?: number | null
          status?: string | null
          subscription_revenue_nzd?: number | null
          tier?: string | null
          total_video_credits?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions_co_nz: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions_nz: {
        Row: {
          billing_date: string | null
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          max_video_credits_cap: number | null
          monthly_video_allocation: number | null
          overage_video_credits: number | null
          platform_owned: boolean | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          total_video_credits: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_date?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          max_video_credits_cap?: number | null
          monthly_video_allocation?: number | null
          overage_video_credits?: number | null
          platform_owned?: boolean | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier: string
          total_video_credits?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_date?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          max_video_credits_cap?: number | null
          monthly_video_allocation?: number | null
          overage_video_credits?: number | null
          platform_owned?: boolean | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          total_video_credits?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      team_invitations_nz: {
        Row: {
          accepted: boolean | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invite_token: string
          role: string
          user_id: string
        }
        Insert: {
          accepted?: boolean | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invite_token: string
          role: string
          user_id: string
        }
        Update: {
          accepted?: boolean | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invite_token?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_nz_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_nz"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          owner_id: string | null
          role: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          owner_id?: string | null
          role?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          owner_id?: string | null
          role?: string | null
        }
        Relationships: []
      }
      team_members_nz: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          invited_at: string | null
          is_active: boolean | null
          last_active_at: string | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          invited_at?: string | null
          is_active?: boolean | null
          last_active_at?: string | null
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          invited_at?: string | null
          is_active?: boolean | null
          last_active_at?: string | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_nz_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_nz"
            referencedColumns: ["id"]
          },
        ]
      }
      tier_drop_warnings: {
        Row: {
          current_tier: string
          id: string
          provider_id: string
          tier_dropped_at: string | null
          warning_sent_at: string | null
          warning_tier: string
        }
        Insert: {
          current_tier: string
          id?: string
          provider_id: string
          tier_dropped_at?: string | null
          warning_sent_at?: string | null
          warning_tier: string
        }
        Update: {
          current_tier?: string
          id?: string
          provider_id?: string
          tier_dropped_at?: string | null
          warning_sent_at?: string | null
          warning_tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "tier_drop_warnings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tika_chat_conversations_nz: {
        Row: {
          captured_name: string | null
          created_at: string | null
          escalated: boolean | null
          id: string
          messages: Json | null
          user_id: string | null
          website_url: string | null
        }
        Insert: {
          captured_name?: string | null
          created_at?: string | null
          escalated?: boolean | null
          id?: string
          messages?: Json | null
          user_id?: string | null
          website_url?: string | null
        }
        Update: {
          captured_name?: string | null
          created_at?: string | null
          escalated?: boolean | null
          id?: string
          messages?: Json | null
          user_id?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      trade_certificates: {
        Row: {
          certificate_number: string
          certificate_type: string
          created_at: string | null
          document_url: string
          id: string
          provider_id: string
          updated_at: string | null
        }
        Insert: {
          certificate_number: string
          certificate_type: string
          created_at?: string | null
          document_url: string
          id?: string
          provider_id: string
          updated_at?: string | null
        }
        Update: {
          certificate_number?: string
          certificate_type?: string
          created_at?: string | null
          document_url?: string
          id?: string
          provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_certificates_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credits: {
        Row: {
          chat_credits: number | null
          created_at: string | null
          credit_revenue_nzd: number | null
          credits_balance: number | null
          credits_used: number | null
          id: string
          image_credits: number | null
          last_reset: string | null
          user_id: string | null
          video_credits: number | null
        }
        Insert: {
          chat_credits?: number | null
          created_at?: string | null
          credit_revenue_nzd?: number | null
          credits_balance?: number | null
          credits_used?: number | null
          id?: string
          image_credits?: number | null
          last_reset?: string | null
          user_id?: string | null
          video_credits?: number | null
        }
        Update: {
          chat_credits?: number | null
          created_at?: string | null
          credit_revenue_nzd?: number | null
          credits_balance?: number | null
          credits_used?: number | null
          id?: string
          image_credits?: number | null
          last_reset?: string | null
          user_id?: string | null
          video_credits?: number | null
        }
        Relationships: []
      }
      user_nz: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          first_name: string | null
          id: number
          last_name: string | null
          password_hash: string
          tika_tone: string | null
          updated_at: string
          uses_co_nz: boolean | null
          uses_nz: boolean
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: number
          last_name?: string | null
          password_hash: string
          tika_tone?: string | null
          updated_at?: string
          uses_co_nz?: boolean | null
          uses_nz?: boolean
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: number
          last_name?: string | null
          password_hash?: string
          tika_tone?: string | null
          updated_at?: string
          uses_co_nz?: boolean | null
          uses_nz?: boolean
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      users_nz: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_platform_owner: boolean | null
          password_hash: string | null
          uses_co_nz: boolean | null
          uses_nz: boolean | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_platform_owner?: boolean | null
          password_hash?: string | null
          uses_co_nz?: boolean | null
          uses_nz?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_platform_owner?: boolean | null
          password_hash?: string | null
          uses_co_nz?: boolean | null
          uses_nz?: boolean | null
        }
        Relationships: []
      }
      verification_documents: {
        Row: {
          ai_confidence_score: number | null
          ai_scan_reason: string | null
          ai_scan_result: string | null
          auto_approved: boolean | null
          category_id: string | null
          created_at: string | null
          document_type: string
          file_url: string
          id: string
          provider_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scanned_at: string | null
          status: string | null
          subcategory_id: string | null
          updated_at: string | null
        }
        Insert: {
          ai_confidence_score?: number | null
          ai_scan_reason?: string | null
          ai_scan_result?: string | null
          auto_approved?: boolean | null
          category_id?: string | null
          created_at?: string | null
          document_type: string
          file_url: string
          id?: string
          provider_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scanned_at?: string | null
          status?: string | null
          subcategory_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_confidence_score?: number | null
          ai_scan_reason?: string | null
          ai_scan_result?: string | null
          auto_approved?: boolean | null
          category_id?: string | null
          created_at?: string | null
          document_type?: string
          file_url?: string
          id?: string
          provider_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scanned_at?: string | null
          status?: string | null
          subcategory_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_documents_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_documents_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_documents_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_logs: {
        Row: {
          action: string
          admin_id: string | null
          confidence_score: number | null
          created_at: string | null
          decision_maker: string | null
          document_id: string | null
          document_type: string
          id: string
          metadata: Json | null
          provider_id: string
          reason: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          decision_maker?: string | null
          document_id?: string | null
          document_type: string
          id?: string
          metadata?: Json | null
          provider_id: string
          reason?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          decision_maker?: string | null
          document_id?: string | null
          document_type?: string
          id?: string
          metadata?: Json | null
          provider_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "verification_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_logs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      video_credit_purchases_nz: {
        Row: {
          created_at: string | null
          credits_bought: number | null
          id: string
          price: number | null
          stripe_charge_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          credits_bought?: number | null
          id?: string
          price?: number | null
          stripe_charge_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          credits_bought?: number | null
          id?: string
          price?: number | null
          stripe_charge_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      video_generations_nz: {
        Row: {
          created_at: string | null
          credits_used: number | null
          generator_choice: string | null
          id: string
          posted_to_instagram: boolean | null
          posted_to_tiktok: boolean | null
          posted_to_youtube: boolean | null
          prompt: string
          status: string | null
          user_id: string | null
          video_format: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          credits_used?: number | null
          generator_choice?: string | null
          id?: string
          posted_to_instagram?: boolean | null
          posted_to_tiktok?: boolean | null
          posted_to_youtube?: boolean | null
          prompt: string
          status?: string | null
          user_id?: string | null
          video_format?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          credits_used?: number | null
          generator_choice?: string | null
          id?: string
          posted_to_instagram?: boolean | null
          posted_to_tiktok?: boolean | null
          posted_to_youtube?: boolean | null
          prompt?: string
          status?: string | null
          user_id?: string | null
          video_format?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      videos: {
        Row: {
          completed_at: string | null
          created_at: string | null
          credits_used: number
          error_message: string | null
          id: string
          prompt: string
          quality_tier: string
          replicate_id: string | null
          status: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          credits_used: number
          error_message?: string | null
          id?: string
          prompt: string
          quality_tier: string
          replicate_id?: string | null
          status?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          credits_used?: number
          error_message?: string | null
          id?: string
          prompt?: string
          quality_tier?: string
          replicate_id?: string | null
          status?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          created_at: string | null
          endpoint_id: string | null
          error_message: string | null
          event_type: string | null
          id: string
          owner_id: string | null
          payload: Json | null
          status: string | null
          status_code: number | null
          success: boolean | null
          widget_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint_id?: string | null
          error_message?: string | null
          event_type?: string | null
          id?: string
          owner_id?: string | null
          payload?: Json | null
          status?: string | null
          status_code?: number | null
          success?: boolean | null
          widget_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint_id?: string | null
          error_message?: string | null
          event_type?: string | null
          id?: string
          owner_id?: string | null
          payload?: Json | null
          status?: string | null
          status_code?: number | null
          success?: boolean | null
          widget_id?: string | null
        }
        Relationships: []
      }
      webhook_endpoints: {
        Row: {
          created_at: string | null
          events: string[] | null
          id: string
          is_active: boolean | null
          owner_id: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          events?: string[] | null
          id?: string
          is_active?: boolean | null
          owner_id?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          events?: string[] | null
          id?: string
          is_active?: boolean | null
          owner_id?: string | null
          url?: string | null
        }
        Relationships: []
      }
      widget_config: {
        Row: {
          api_key: string | null
          created_at: string | null
          credits_per_session: number | null
          greeting_message: string | null
          handoff_message: string | null
          id: string
          owner_id: string | null
          primary_color: string | null
          site_name: string | null
          webhook_url: string | null
          widget_id: string | null
        }
        Insert: {
          api_key?: string | null
          created_at?: string | null
          credits_per_session?: number | null
          greeting_message?: string | null
          handoff_message?: string | null
          id?: string
          owner_id?: string | null
          primary_color?: string | null
          site_name?: string | null
          webhook_url?: string | null
          widget_id?: string | null
        }
        Update: {
          api_key?: string | null
          created_at?: string | null
          credits_per_session?: number | null
          greeting_message?: string | null
          handoff_message?: string | null
          id?: string
          owner_id?: string | null
          primary_color?: string | null
          site_name?: string | null
          webhook_url?: string | null
          widget_id?: string | null
        }
        Relationships: []
      }
      widget_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          sender: string | null
          session_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          sender?: string | null
          session_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          sender?: string | null
          session_id?: string | null
        }
        Relationships: []
      }
      widget_sessions: {
        Row: {
          assigned_agent_id: string | null
          created_at: string | null
          credits_used: number | null
          handoff_at: string | null
          id: string
          ip_hash: string | null
          last_message_at: string | null
          profiles: Json | null
          session_id: string | null
          status: string | null
          visitor_email: string | null
          visitor_messages: number | null
          website_domain: string | null
          widget_id: string | null
        }
        Insert: {
          assigned_agent_id?: string | null
          created_at?: string | null
          credits_used?: number | null
          handoff_at?: string | null
          id?: string
          ip_hash?: string | null
          last_message_at?: string | null
          profiles?: Json | null
          session_id?: string | null
          status?: string | null
          visitor_email?: string | null
          visitor_messages?: number | null
          website_domain?: string | null
          widget_id?: string | null
        }
        Update: {
          assigned_agent_id?: string | null
          created_at?: string | null
          credits_used?: number | null
          handoff_at?: string | null
          id?: string
          ip_hash?: string | null
          last_message_at?: string | null
          profiles?: Json | null
          session_id?: string | null
          status?: string | null
          visitor_email?: string | null
          visitor_messages?: number | null
          website_domain?: string | null
          widget_id?: string | null
        }
        Relationships: []
      }
      widget_settings: {
        Row: {
          collect_email: boolean | null
          created_at: string | null
          id: string
          placeholder: string | null
          position: string | null
          primary_color: string | null
          updated_at: string | null
          user_id: string
          welcome_message: string | null
          widget_id: string
        }
        Insert: {
          collect_email?: boolean | null
          created_at?: string | null
          id?: string
          placeholder?: string | null
          position?: string | null
          primary_color?: string | null
          updated_at?: string | null
          user_id: string
          welcome_message?: string | null
          widget_id: string
        }
        Update: {
          collect_email?: boolean | null
          created_at?: string | null
          id?: string
          placeholder?: string | null
          position?: string | null
          primary_color?: string | null
          updated_at?: string | null
          user_id?: string
          welcome_message?: string | null
          widget_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      reporter_analytics: {
        Row: {
          accuracy_rate: number | null
          actioned_reports: number | null
          dismissed_reports: number | null
          pending_reports: number | null
          reporter_id: string | null
          total_reports: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_provider_60day_sales: {
        Args: { provider_uuid: string }
        Returns: number
      }
      delete_bot_profiles: {
        Args: { profile_ids: string[] }
        Returns: undefined
      }
      get_tier_for_sales: { Args: { sales_amount: number }; Returns: string }
      mark_expired_projects: { Args: never; Returns: undefined }
      update_provider_tier: {
        Args: { provider_uuid: string }
        Returns: {
          new_tier: string
          old_tier: string
          sales_amount: number
          tier_changed: boolean
        }[]
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
