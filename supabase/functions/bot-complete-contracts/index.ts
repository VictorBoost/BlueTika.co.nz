import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Realistic review templates by category
const providerReviews: Record<string, string[]> = {
  "Cleaning": [
    "Client was very organized with clear instructions about what needed to be cleaned. Communication was excellent throughout the job. Would definitely work with them again!",
    "Great client! House was ready for cleaning and they provided all necessary supplies. Very respectful and understanding. Highly recommended!",
    "Professional and courteous client. Clear about expectations and very appreciative of the work done. Payment was prompt. Pleasure to work with!"
  ],
  "Handyman": [
    "Excellent client who knew exactly what repairs were needed. Provided detailed list and was flexible with timing. Very happy to have worked on this project!",
    "Client was well-prepared with all materials ready. Great communication and understanding when minor issues came up. Would work for them again!",
    "Very professional client. Clear instructions, reasonable expectations, and appreciated quality workmanship. Prompt payment. 5 stars!"
  ],
  "Movers": [
    "Everything was packed and ready to go as promised. Client was organized and helpful. Made the move smooth and efficient. Great experience!",
    "Professional client who had everything labeled and ready. Clear directions to both properties. Respectful and understanding. Highly recommend!",
    "Well-organized client made this move easy. Everything was ready on time and they were very appreciative of careful handling. Pleasure to work with!"
  ],
  "Electrical": [
    "Client had all permits sorted and knew exactly what electrical work was required. Professional and safety-conscious. Great to work with!",
    "Very knowledgeable client who asked good questions. Appreciated quality electrical work and understood the time needed. Would work for them again!",
    "Professional client with realistic expectations. Site was ready and accessible. Clear communication throughout. Highly recommended!"
  ],
  "Plumbing": [
    "Client described the plumbing issue clearly and had the area accessible. Very understanding and professional. Payment was prompt. Excellent!",
    "Great client! Knew exactly what plumbing work was needed. Site was ready and they appreciated quality workmanship. Would work for them again!",
    "Professional and courteous client. Clear about the plumbing requirements and very respectful. Prompt payment. 5 stars!"
  ],
  "Landscaping": [
    "Client had a clear vision for their garden and was open to professional suggestions. Great communication and very appreciative. Loved working on this!",
    "Fantastic client! Yard was accessible and they provided refreshments during hot days. Very happy with the transformation. Highly recommend!",
    "Professional client who understood the time needed for quality landscaping. Respectful and appreciative of attention to detail. 5 stars!"
  ],
  "Painting": [
    "Client had the space prepped and ready to paint. Clear about color choices and finish requirements. Very professional. Great experience!",
    "Excellent client who appreciated quality painting work. Flexible with timing and very understanding. Payment was prompt. Would work for them again!",
    "Professional client with realistic expectations. Space was ready and they were very happy with the finished result. Highly recommended!"
  ],
  "Domestic Helper": [
    "Wonderful family to work for! Clear about household routines and very respectful. Made me feel welcomed and appreciated. Excellent employer!",
    "Professional and kind client. Clear instructions and very understanding. Great household to work in. Would definitely continue working here!",
    "Respectful and organized client. Clear communication about household needs and always appreciative of work done. Fantastic to work for!"
  ]
};

const clientReviews: Record<string, string[]> = {
  "Cleaning": [
    "Absolutely spotless! They cleaned every corner thoroughly and were very detail-oriented. House looks amazing. Highly recommend their cleaning service!",
    "Fantastic job! Very professional, punctual, and paid attention to all the details I mentioned. My home has never looked better. Will definitely hire again!",
    "Outstanding cleaning service! They went above and beyond, even organizing as they cleaned. Very trustworthy and hardworking. 5 stars!"
  ],
  "Handyman": [
    "Excellent workmanship! Fixed everything on my list perfectly and even spotted a few issues I hadn't noticed. Very skilled and professional. Highly recommend!",
    "Great handyman! Efficient, knowledgeable, and left everything tidy. All repairs done to a high standard. Will definitely use their services again!",
    "Top-notch work! Arrived on time, worked efficiently, and the quality is excellent. Very honest about what needed fixing. Highly recommend!"
  ],
  "Movers": [
    "Incredible service! Moved everything carefully without a single scratch. Very professional and efficient. Made a stressful day easy. Highly recommend!",
    "Best movers I've used! Fast, careful, and very organized. Nothing was damaged and they were so helpful throughout. Will definitely use again!",
    "Outstanding moving service! Professional, careful with fragile items, and completed the move faster than expected. Excellent value. 5 stars!"
  ],
  "Electrical": [
    "Excellent electrician! Very knowledgeable, explained everything clearly, and did quality work. All electrical issues resolved perfectly. Highly recommend!",
    "Top-quality electrical work! Safety-conscious, professional, and efficient. Fixed the wiring issues and everything works perfectly. Will use again!",
    "Outstanding service! Diagnosed the electrical problem quickly and fixed it properly. Very professional and tidy. Highly recommend their expertise!"
  ],
  "Plumbing": [
    "Brilliant plumber! Fixed the leak quickly and explained what caused it. Very professional and tidy. No more water issues. Highly recommend!",
    "Excellent work! Resolved the plumbing problem efficiently and at a fair price. Very knowledgeable and professional. Will definitely use again!",
    "Top-notch plumbing service! Quick diagnosis, quality repairs, and left everything clean. Very reliable and professional. 5 stars!"
  ],
  "Landscaping": [
    "Garden looks absolutely incredible! They transformed our yard beyond expectations. Very creative and hardworking. Neighbors are asking for their details!",
    "Amazing landscaping work! Professional, creative, and the garden now looks stunning. Very detail-oriented and cleaned up perfectly. Highly recommend!",
    "Outstanding landscaping! They understood our vision and delivered beautifully. Very skilled and professional. Yard has never looked better. 5 stars!"
  ],
  "Painting": [
    "Fantastic painting job! Clean lines, smooth finish, and they protected all furniture and floors. Room looks brand new. Highly recommend!",
    "Excellent painter! Very professional, tidy, and the quality is outstanding. Color looks perfect and finish is flawless. Will use again!",
    "Top-quality painting! Prepared surfaces properly and the result is perfect. Very professional and cleaned up thoroughly. Highly recommend!"
  ],
  "Domestic Helper": [
    "Wonderful domestic helper! Very reliable, trustworthy, and excellent with housework. Our home runs so smoothly now. Couldn't be happier!",
    "Fantastic help around the house! Professional, efficient, and very caring. Great with the family and keeps everything organized. Highly recommend!",
    "Excellent domestic helper! Reliable, hardworking, and very respectful. Our household has never been better organized. 5 stars!"
  ]
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find active contracts without evidence photos
    const { data: contracts } = await supabaseClient
      .from("contracts")
      .select(`
        id,
        client_id,
        provider_id,
        project_id,
        final_amount,
        projects(title, category:categories(name))
      `)
      .eq("status", "active")
      .is("work_done_at", null)
      .limit(10);

    if (!contracts || contracts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No contracts ready for completion", completed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = { completed: 0, errors: [] as string[] };

    for (const contract of contracts) {
      try {
        // Only proceed if provider is a bot
        const { data: providerBot } = await supabaseClient
          .from("bot_accounts")
          .select("profile_id")
          .eq("profile_id", contract.provider_id)
          .maybeSingle();

        if (!providerBot) continue;

        const categoryName = contract.projects?.category?.name || "Cleaning";

        // Step 1: Upload "before" evidence photo with realistic caption
        const beforePhotoUrl = `https://picsum.photos/seed/${contract.id}-before/800/600`;
        await supabaseClient
          .from("contract_evidence_photos")
          .insert({
            contract_id: contract.id,
            uploader_role: "provider",
            photo_urls: [beforePhotoUrl],
            status: "approved"
          });

        // Step 2: Upload "after" evidence photo with realistic caption
        const afterPhotoUrl = `https://picsum.photos/seed/${contract.id}-after/800/600`;
        await supabaseClient
          .from("contract_evidence_photos")
          .insert({
            contract_id: contract.id,
            uploader_role: "provider",
            photo_urls: [afterPhotoUrl],
            status: "approved"
          });

        // Step 3: Mark work done
        const workDoneAt = new Date().toISOString();
        
        const { data: settings } = await supabaseClient
          .from("platform_settings")
          .select("setting_value")
          .eq("setting_key", "auto_release_window_seconds")
          .maybeSingle();
        
        const windowSeconds = parseInt(settings?.setting_value || "172800");
        const clientApprovalDeadline = new Date(Date.now() + windowSeconds * 1000).toISOString();

        await supabaseClient
          .from("contracts")
          .update({
            work_done_at: workDoneAt,
            client_approval_deadline: clientApprovalDeadline,
            auto_release_eligible_at: clientApprovalDeadline,
            payment_status: "held",
            status: "awaiting_fund_release"
          })
          .eq("id", contract.id);

        // Step 4: Submit realistic provider review
        const providerReviewTemplates = providerReviews[categoryName] || providerReviews["Cleaning"];
        const providerComment = providerReviewTemplates[Math.floor(Math.random() * providerReviewTemplates.length)];

        await supabaseClient
          .from("reviews")
          .insert({
            contract_id: contract.id,
            client_id: contract.client_id,
            provider_id: contract.provider_id,
            reviewer_role: "provider",
            reviewee_role: "client",
            rating: 5,
            comment: providerComment,
            is_public: true
          });

        // Step 5: Check if client is also a bot, submit their realistic review
        const { data: clientBot } = await supabaseClient
          .from("bot_accounts")
          .select("profile_id")
          .eq("profile_id", contract.client_id)
          .maybeSingle();

        if (clientBot) {
          const clientReviewTemplates = clientReviews[categoryName] || clientReviews["Cleaning"];
          const clientComment = clientReviewTemplates[Math.floor(Math.random() * clientReviewTemplates.length)];

          await supabaseClient
            .from("reviews")
            .insert({
              contract_id: contract.id,
              client_id: contract.client_id,
              provider_id: contract.provider_id,
              reviewer_role: "client",
              reviewee_role: "provider",
              rating: 5,
              comment: clientComment,
              is_public: true
            });

          // Set provider dispute deadline (5 working days from work_done)
          const now = new Date(workDoneAt);
          let daysAdded = 0;
          const deadline = new Date(now);

          while (daysAdded < 5) {
            deadline.setDate(deadline.getDate() + 1);
            const dayOfWeek = deadline.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
              daysAdded++;
            }
          }

          await supabaseClient
            .from("contracts")
            .update({
              provider_dispute_deadline: deadline.toISOString(),
              ready_for_release_at: now.toISOString()
            })
            .eq("id", contract.id);
        }

        // Step 6: Log bot activity
        await supabaseClient
          .from("bot_activity_logs")
          .insert({
            bot_id: contract.provider_id,
            action_type: "complete_work",
            details: { 
              contract_id: contract.id, 
              work_done_at: workDoneAt,
              client_approval_deadline: clientApprovalDeadline,
              photos_uploaded: 2
            }
          });

        // Log review submission
        await supabaseClient
          .from("bot_activity_logs")
          .insert({
            bot_id: contract.provider_id,
            action_type: "submit_review",
            details: { 
              contract_id: contract.id,
              rating: 5,
              role: "provider"
            }
          });

        if (clientBot) {
          await supabaseClient
            .from("bot_activity_logs")
            .insert({
              bot_id: contract.client_id,
              action_type: "submit_review",
              details: { 
                contract_id: contract.id,
                rating: 5,
                role: "client"
              }
            });
        }

        results.completed++;
      } catch (err: any) {
        results.errors.push(`Contract ${contract.id}: ${err.message}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, completed: results.completed, errors: results.errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});