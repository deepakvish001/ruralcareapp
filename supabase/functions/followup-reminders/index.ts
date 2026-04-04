import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const today = new Date();
    const threeDaysOut = new Date(today);
    threeDaysOut.setDate(threeDaysOut.getDate() + 3);

    const todayStr = today.toISOString().split("T")[0];
    const futureStr = threeDaysOut.toISOString().split("T")[0];

    // Find visits with follow-up dates in the next 3 days
    const { data: visits, error: visitError } = await supabase
      .from("visits")
      .select("id, patient_id, follow_up_date, recorded_by, patients(name)")
      .gte("follow_up_date", todayStr)
      .lte("follow_up_date", futureStr)
      .not("recorded_by", "is", null)
      .not("follow_up_date", "is", null);

    if (visitError) {
      console.error("Error fetching visits:", visitError);
      throw visitError;
    }

    if (!visits || visits.length === 0) {
      return new Response(JSON.stringify({ message: "No upcoming follow-ups", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check existing notifications to avoid duplicates (same user + same visit follow-up date)
    let insertedCount = 0;

    for (const visit of visits) {
      const patient = visit.patients as any;
      const patientName = patient?.name || "a patient";
      const followUpDate = visit.follow_up_date;
      const userId = visit.recorded_by;

      // Deduplicate: check if a followup notification for this date already exists today
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", userId)
        .eq("type", "followup")
        .gte("created_at", todayStr + "T00:00:00Z")
        .ilike("body", `%${followUpDate}%`)
        .limit(1);

      if (existing && existing.length > 0) continue;

      const daysUntil = Math.ceil(
        (new Date(followUpDate!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      const urgency = daysUntil <= 0 ? "today" : daysUntil === 1 ? "tomorrow" : `in ${daysUntil} days`;

      const { error: insertError } = await supabase.from("notifications").insert({
        user_id: userId,
        title: "Follow-up Reminder",
        body: `Follow-up visit for ${patientName} is due ${urgency} (${followUpDate})`,
        type: "followup",
      });

      if (insertError) {
        console.error("Error inserting notification:", insertError);
      } else {
        insertedCount++;
      }
    }

    return new Response(
      JSON.stringify({ message: `Sent ${insertedCount} follow-up reminders`, count: insertedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("followup-reminders error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
