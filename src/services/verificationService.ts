import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { aiVerificationService } from "./aiVerificationService";
import { sesEmailService } from "./sesEmailService";

type VerificationDocument = Tables<"verification_documents">;
type Reference = Tables<"provider_references">;

export const verificationService = {
  // Upload verification document with AI auto-verify
  async uploadDocument(file: File, providerId: string, documentType: string, categoryId?: string, subcategoryId?: string) {
    // Upload to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${providerId}/${documentType}_${Date.now()}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("verification-documents")
      .upload(fileName, file);

    if (uploadError) {
      console.error("File upload error:", uploadError);
      return { 
        data: null, 
        error: { 
          message: "Failed to upload file to storage. Please check your internet connection and try again." 
        } 
      };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("verification-documents")
      .getPublicUrl(fileName);

    // Create document record
    const { data, error } = await supabase
      .from("verification_documents")
      .insert({
        provider_id: providerId,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        document_type: documentType,
        file_url: publicUrl,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Document record creation error:", error);
      
      // User-friendly error messages
      if (error.code === "42501") {
        return { 
          data: null, 
          error: { 
            message: "Unable to save document. Please ensure you're logged in and try again. If the issue persists, contact support." 
          } 
        };
      }
      
      return { 
        data: null, 
        error: { 
          message: "Failed to save document record. Please try again or contact support if the issue continues." 
        } 
      };
    }

    if (!data) {
      return { 
        data: null, 
        error: { 
          message: "Document upload completed but no confirmation received. Please refresh and check if your document was saved." 
        } 
      };
    }

    // Update profile to show verification is pending (prevents re-uploads)
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        verification_status: "pending"
      })
      .eq("id", providerId);

    if (profileError) {
      console.error("Failed to update profile status:", profileError);
      // Non-blocking - document is already uploaded
    }

    // Trigger AI verification for supported document types (for owner's reference only - no auto-approval)
    const aiSupportedTypes = ["driver_licence", "driver_licence_back", "police_check", "trade_certificate", "first_aid"];
    if (aiSupportedTypes.includes(documentType)) {
      try {
        const aiResult = await aiVerificationService.verifyDocument(
          data.id,
          publicUrl,
          documentType as any,
          providerId
        );

        console.log("AI verification result (for owner reference only):", aiResult);

        // No auto-approval emails - all documents go to manual review
        return { data: { ...data, aiResult }, error: null };
      } catch (aiError) {
        console.error("AI verification error (non-blocking):", aiError);
        // Continue even if AI fails - document will be manually reviewed
        return { data, error: null };
      }
    }

    console.log("uploadDocument:", { data, error });
    return { data, error: null };
  },

  // Get provider's documents
  async getProviderDocuments(providerId: string, subcategoryId?: string) {
    let query = supabase
      .from("verification_documents")
      .select("*")
      .eq("provider_id", providerId);

    if (subcategoryId) {
      query = query.eq("subcategory_id", subcategoryId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    console.log("getProviderDocuments:", { data, error });
    return { data, error };
  },

  // Add reference
  async addReference(
    providerId: string, 
    subcategoryId: string, 
    referenceData: { full_name: string; relationship: string; phone_number: string }
  ) {
    const { data, error } = await supabase
      .from("provider_references")
      .insert({
        provider_id: providerId,
        subcategory_id: subcategoryId,
        full_name: referenceData.full_name,
        relationship: referenceData.relationship,
        phone_number: referenceData.phone_number,
      })
      .select()
      .single();

    console.log("addReference:", { data, error });
    return { data, error };
  },

  // Get provider's references
  async getProviderReferences(providerId: string, subcategoryId?: string) {
    let query = supabase
      .from("provider_references")
      .select("*")
      .eq("provider_id", providerId);

    if (subcategoryId) {
      query = query.eq("subcategory_id", subcategoryId);
    }

    const { data, error } = await query.order("created_at");
    console.log("getProviderReferences:", { data, error });
    return { data, error };
  },

  // Get pending verifications (admin only)
  async getPendingVerifications() {
    const { data, error } = await supabase
      .from("verification_documents")
      .select(`
        *,
        provider:profiles!verification_documents_provider_id_fkey(id, full_name, email, phone_number),
        category:categories(id, name),
        subcategory:subcategories(id, name)
      `)
      .eq("status", "pending")
      .order("ai_confidence_score", { ascending: true, nullsFirst: false })
      .order("created_at");

    console.log("getPendingVerifications:", { data, error });
    return { data, error };
  },

  // Approve/reject document (manual admin review)
  async updateDocumentStatus(documentId: string, status: string, reviewerId: string, rejectionReason?: string) {
    const { data: doc, error: docError } = await supabase
      .from("verification_documents")
      .select("provider_id, document_type")
      .eq("id", documentId)
      .single();

    if (docError || !doc) {
      return { data: null, error: docError };
    }

    const { data, error } = await supabase
      .from("verification_documents")
      .update({
        status,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejectionReason,
      })
      .eq("id", documentId)
      .select()
      .single();

    // Log manual review action
    if (!error) {
      await aiVerificationService.logVerification(
        doc.provider_id,
        documentId,
        doc.document_type,
        status === "approved" ? "manual_approve" : "reject",
        null,
        "admin",
        reviewerId,
        rejectionReason || null
      );

      // Send email notification
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name, first_name")
        .eq("id", doc.provider_id)
        .single();

      if (profile?.email) {
        const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://bluetika.co.nz";
        if (status === "approved") {
          await sesEmailService.sendDocumentManuallyApproved(
            profile.email,
            profile.full_name || profile.first_name || "Service Provider",
            doc.document_type.replace(/_/g, " "),
            baseUrl
          );
        } else {
          await sesEmailService.sendDocumentRejected(
            profile.email,
            profile.full_name || profile.first_name || "Service Provider",
            doc.document_type.replace(/_/g, " "),
            rejectionReason || "Document did not meet verification requirements",
            baseUrl
          );
        }
      }
    }

    console.log("updateDocumentStatus:", { data, error });
    return { data, error };
  },

  // Update provider verification status
  async updateProviderVerificationStatus(providerId: string, status: string, domesticHelperVerified: boolean) {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        verification_status: status,
        domestic_helper_verified: domesticHelperVerified,
      })
      .eq("id", providerId)
      .select()
      .single();

    console.log("updateProviderVerificationStatus:", { data, error });
    return { data, error };
  },

  // Update privacy settings
  async updatePrivacySettings(providerId: string, showPublicly: boolean, showToClients: boolean) {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        show_verified_publicly: showPublicly,
        show_credentials_to_clients: showToClients,
      })
      .eq("id", providerId)
      .select()
      .single();

    console.log("updatePrivacySettings:", { data, error });
    return { data, error };
  },
};