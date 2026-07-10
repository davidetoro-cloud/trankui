import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type NotificationPayload = {
  type: "message" | "request" | "application" | "match" | "review" | "completion";
  collaboration_id?: string;
  message_id?: string;
  application_id?: string;
  review_id?: string;
};

const defaultPreferences = {
  channels: { push: false, sound: true, email: false },
  topics: { messages: true, requests: true, matches: true, reviews: true, availability: true },
};

function text(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function truncate(value: string, max = 140) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] || char));
}

function emailHtml(title: string, body: string, actionUrl: string) {
  const safeTitle = escapeHtml(title);
  const safeBody = escapeHtml(body);
  const safeUrl = escapeHtml(actionUrl);
  return `<!doctype html>
<html lang="it">
  <body style="margin:0;background:#f5f7fb;padding:0;font-family:Montserrat,Arial,sans-serif;color:#2b2d31;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f7fb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e5e7eb;border-radius:24px;overflow:hidden;">
            <tr>
              <td style="padding:34px 34px 18px;">
                <img src="https://trankui.com/clipboard.png?v=20260706-official-logo" width="180" alt="Trankui" style="display:block;max-width:180px;height:auto;border:0;">
              </td>
            </tr>
            <tr>
              <td style="padding:8px 34px 34px;">
                <p style="margin:0 0 12px;color:#0068ff;font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;">Aggiornamento</p>
                <h1 style="margin:0 0 14px;font-size:30px;line-height:1.12;color:#2b2d31;">${safeTitle}</h1>
                <p style="margin:0 0 24px;font-size:17px;line-height:1.55;color:#5f6368;">${safeBody}</p>
                <a href="${safeUrl}" style="display:inline-block;background:#0068ff;color:#ffffff;text-decoration:none;border-radius:999px;padding:14px 22px;font-size:15px;font-weight:800;">Apri Trankui</a>
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc;border-top:1px solid #edf0f5;padding:22px 34px;">
                <p style="margin:0;font-size:13px;line-height:1.5;color:#8a8f98;">Ricevi questa email perché hai attivato le notifiche email nelle impostazioni del profilo.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) throw new Error("Autorizzazione mancante");
    const body = await request.json() as NotificationPayload;
    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const siteUrl = Deno.env.get("SITE_URL") || "https://trankui.com";
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
    const adminClient = createClient(url, serviceKey);
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw userError || new Error("Utente non trovato");

    let recipientId = "";
    let topic: keyof typeof defaultPreferences.topics = "messages";
    let title = "Nuovo aggiornamento su Trankui";
    let messageBody = "Hai un nuovo aggiornamento.";
    const actionUrl = siteUrl;

    if (body.type === "message") {
      const { data: message, error } = await adminClient.from("messages")
        .select("id,collaboration_id,sender_id,body,sender:sender_id(full_name),collaboration:collaboration_id(requester_id,professional_id,role:role_id(name),work_date,zone)")
        .eq("id", body.message_id)
        .single();
      if (error) throw error;
      const collaboration = message.collaboration as any;
      if (message.sender_id !== user.id || ![collaboration.requester_id, collaboration.professional_id].includes(user.id)) throw new Error("Notifica non consentita");
      recipientId = collaboration.requester_id === user.id ? collaboration.professional_id : collaboration.requester_id;
      topic = "messages";
      title = `Nuovo messaggio da ${text((message.sender as any)?.full_name, "un professionista")}`;
      messageBody = truncate(text(message.body, "Apri Trankui per leggere la conversazione."));
    }

    if (body.type === "request" || body.type === "match" || body.type === "completion") {
      const { data: collaboration, error } = await adminClient.from("collaborations")
        .select("id,requester_id,professional_id,status,note,work_date,zone,role:role_id(name),requester:requester_id(full_name),professional:professional_id(full_name)")
        .eq("id", body.collaboration_id)
        .single();
      if (error) throw error;
      if (![collaboration.requester_id, collaboration.professional_id].includes(user.id)) throw new Error("Notifica non consentita");
      recipientId = collaboration.requester_id === user.id ? collaboration.professional_id : collaboration.requester_id;
      const role = text((collaboration.role as any)?.name, "Collaborazione");
      if (body.type === "request") {
        if (user.id !== collaboration.requester_id) throw new Error("Notifica non consentita");
        topic = "requests";
        title = `Nuova richiesta da ${text((collaboration.requester as any)?.full_name, "un professionista")}`;
        messageBody = `${role} · ${text(collaboration.zone)} · ${text(collaboration.work_date)}`;
      } else if (body.type === "completion") {
        topic = "reviews";
        title = "Collaborazione segnata come conclusa";
        messageBody = "Quando entrambi confermate la chiusura, potrete lasciare il feedback blind.";
      } else {
        topic = "matches";
        title = `Match ${collaboration.status}`;
        messageBody = `${role} · ${text(collaboration.zone)} · ${text(collaboration.work_date)}`;
      }
    }

    if (body.type === "application") {
      const { data: application, error } = await adminClient.from("post_applications")
        .select("id,applicant_id,message,applicant:applicant_id(full_name),post:post_id(owner_id,role:role_id(name),work_date,zone)")
        .eq("id", body.application_id)
        .single();
      if (error) throw error;
      if (application.applicant_id !== user.id) throw new Error("Notifica non consentita");
      recipientId = (application.post as any).owner_id;
      topic = "requests";
      title = `Nuova candidatura da ${text((application.applicant as any)?.full_name, "un professionista")}`;
      messageBody = `${text((application.post as any)?.role?.name, "Richiesta")} · ${text((application.post as any)?.zone)} · ${text((application.post as any)?.work_date)}`;
    }

    if (body.type === "review") {
      const { data: review, error } = await adminClient.from("reviews")
        .select("id,author_id,recipient_id,public_comment,author:author_id(full_name)")
        .eq("id", body.review_id)
        .single();
      if (error) throw error;
      if (review.author_id !== user.id) throw new Error("Notifica non consentita");
      recipientId = review.recipient_id;
      topic = "reviews";
      title = `Nuovo feedback da ${text((review.author as any)?.full_name, "un collaboratore")}`;
      messageBody = text(review.public_comment, "Hai ricevuto un nuovo feedback blind.");
    }

    if (!recipientId || recipientId === user.id) return new Response(JSON.stringify({ sent: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: preferenceRow } = await adminClient.from("notification_preferences")
      .select("channels,topics")
      .eq("profile_id", recipientId)
      .maybeSingle();
    const preferences = {
      channels: { ...defaultPreferences.channels, ...(preferenceRow?.channels || {}) },
      topics: { ...defaultPreferences.topics, ...(preferenceRow?.topics || {}) },
    };
    if (preferences.topics[topic] === false) {
      return new Response(JSON.stringify({ sent: false, muted: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let pushSent = 0;
    let emailSent = false;
    const pushPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const pushPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    if (preferences.channels.push && pushPublicKey && pushPrivateKey) {
      webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT") || "mailto:welcome@trankui.com", pushPublicKey, pushPrivateKey);
      const { data: subscriptions } = await adminClient.from("push_subscriptions")
        .select("id,endpoint,p256dh,auth")
        .eq("profile_id", recipientId);
      await Promise.all((subscriptions || []).map(async (subscription) => {
        try {
          await webpush.sendNotification({
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          }, JSON.stringify({ title, body: messageBody, url: actionUrl, tag: `${body.type}:${body.collaboration_id || body.message_id || body.application_id || body.review_id || ""}` }));
          pushSent += 1;
        } catch (error) {
          const statusCode = (error as any)?.statusCode;
          if (statusCode === 404 || statusCode === 410) await adminClient.from("push_subscriptions").delete().eq("id", subscription.id);
        }
      }));
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (preferences.channels.email && resendKey) {
      const { data: recipientUser } = await adminClient.auth.admin.getUserById(recipientId);
      if (recipientUser.user?.email) {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: Deno.env.get("NOTIFICATION_FROM") || "Trankui <welcome@trankui.com>",
            to: [recipientUser.user.email],
            subject: title,
            html: emailHtml(title, messageBody, actionUrl),
          }),
        });
        emailSent = response.ok;
      }
    }

    return new Response(JSON.stringify({ sent: true, push_sent: pushSent, email_sent: emailSent }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Notifica non inviata";
    return new Response(JSON.stringify({ error: message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
