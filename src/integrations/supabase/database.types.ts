/* eslint-disable @typescript-eslint/no-empty-object-type */
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
        Relationships: [
          {
            foreignKeyName: "account_suspensions_user_id_fkey"
            columns: ["user_id"]
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
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          is_client: boolean | null
          is_provider: boolean | null
          last_name: string | null
          last_tier_calculation: string | null
          location: string | null
          phone: string | null
          phone_number: string | null
          response_rate: number | null
          tier_updated_at: string | null
          total_reviews: number | null
          updated_at: string | null
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
          is_client?: boolean | null
          is_provider?: boolean | null
          last_name?: string | null
          last_tier_calculation?: string | null
          location?: string | null
          phone?: string | null
          phone_number?: string | null
          response_rate?: number | null
          tier_updated_at?: string | null
          total_reviews?: number | null
          updated_at?: string | null
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
          is_client?: boolean | null
          is_provider?: boolean | null
          last_name?: string | null
          last_tier_calculation?: string | null
          location?: string | null
          phone?: string | null
          phone_number?: string | null
          response_rate?: number | null
          tier_updated_at?: string | null
          total_reviews?: number | null
          updated_at?: string | null
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
      verification_documents: {
        Row: {
          category_id: string | null
          created_at: string | null
          document_type: string
          file_url: string
          id: string
          provider_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          subcategory_id: string | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          document_type: string
          file_url: string
          id?: string
          provider_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          subcategory_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          document_type?: string
          file_url?: string
          id?: string
          provider_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_provider_60day_sales: {
        Args: { provider_uuid: string }
        Returns: number
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
