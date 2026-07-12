import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AdminClient = ReturnType<typeof createClient>;

function accountDeletedEmailHtml() {
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
                <p style="margin:0 0 12px;color:#0068ff;font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;">Account</p>
                <h1 style="margin:0 0 14px;font-size:30px;line-height:1.12;color:#2b2d31;">Account cancellato</h1>
                <p style="margin:0 0 18px;font-size:17px;line-height:1.55;color:#5f6368;">Abbiamo eliminato definitivamente il tuo account Trankui e i dati collegati.</p>
                <p style="margin:0;font-size:17px;line-height:1.55;color:#5f6368;">Grazie per aver fatto parte della community. Se vorrai tornare, potrai creare un nuovo profilo in qualsiasi momento.</p>
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc;border-top:1px solid #edf0f5;padding:22px 34px;">
                <p style="margin:0;font-size:13px;line-height:1.5;color:#8a8f98;">Il team Trankui</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function isMissingTable(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "42P01";
}

function readableError(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error.trim();
  if (typeof error === "object" && error !== null) {
    const candidate = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    const parts = [candidate.message, candidate.details, candidate.hint, candidate.code]
      .filter((value) => typeof value === "string" && value.trim());
    if (parts.length) return parts.join(" ");
  }
  return "Operazione non riuscita";
}

function readBearerToken(authorization: string) {
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) throw new Error("Autorizzazione non valida");
  const token = match[1].trim();
  if (token.split(".").length !== 3) throw new Error("Sessione non valida. Effettua nuovamente l'accesso.");
  return token;
}

async function deleteMatching(adminClient: AdminClient, table: string, buildQuery: (query: any) => unknown) {
  const query = adminClient.from(table).delete();
  const { error } = await buildQuery(query) as { error: unknown };
  if (error && !isMissingTable(error)) throw error;
}

async function sendDeletedEmail(email: string) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return false;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Trankui <welcome@trankui.com>",
        to: [email],
        subject: "Il tuo account Trankui è stato cancellato",
        html: accountDeletedEmailHtml(),
      }),
      signal: controller.signal,
    });
    return response.ok;
  } catch (_error) {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function deleteAccountData(adminClient: AdminClient, userId: string) {
  const { data: collaborations, error: collaborationReadError } = await adminClient
    .from("collaborations")
    .select("id")
    .or(`requester_id.eq.${userId},professional_id.eq.${userId}`);
  if (collaborationReadError && !isMissingTable(collaborationReadError)) throw collaborationReadError;
  const collaborationIds = (collaborations || []).map((item) => item.id);

  const { data: ownedPosts, error: ownedPostReadError } = await adminClient
    .from("posts")
    .select("id")
    .eq("owner_id", userId);
  if (ownedPostReadError && !isMissingTable(ownedPostReadError)) throw ownedPostReadError;
  const ownedPostIds = (ownedPosts || []).map((item) => item.id);

  if (collaborationIds.length) {
    await deleteMatching(adminClient, "reviews", (query) => query.in("collaboration_id", collaborationIds));
    await deleteMatching(adminClient, "messages", (query) => query.in("collaboration_id", collaborationIds));
  }
  if (ownedPostIds.length) {
    await deleteMatching(adminClient, "post_applications", (query) => query.in("post_id", ownedPostIds));
  }

  await deleteMatching(adminClient, "reviews", (query) => query.or(`author_id.eq.${userId},recipient_id.eq.${userId}`));
  await deleteMatching(adminClient, "messages", (query) => query.eq("sender_id", userId));
  await deleteMatching(adminClient, "collaborations", (query) => query.or(`requester_id.eq.${userId},professional_id.eq.${userId}`));
  await deleteMatching(adminClient, "post_applications", (query) => query.eq("applicant_id", userId));
  await deleteMatching(adminClient, "posts", (query) => query.eq("owner_id", userId));
  await deleteMatching(adminClient, "support_tickets", (query) => query.eq("reporter_id", userId));
  await deleteMatching(adminClient, "push_subscriptions", (query) => query.eq("profile_id", userId));
  await deleteMatching(adminClient, "notification_preferences", (query) => query.eq("profile_id", userId));
  await deleteMatching(adminClient, "calendar_connections", (query) => query.eq("profile_id", userId));
  await deleteMatching(adminClient, "consents", (query) => query.eq("profile_id", userId));
  await deleteMatching(adminClient, "availability", (query) => query.eq("profile_id", userId));
  await deleteMatching(adminClient, "secondary_roles", (query) => query.eq("profile_id", userId));
  await deleteMatching(adminClient, "private_contacts", (query) => query.eq("profile_id", userId));
  await deleteMatching(adminClient, "user_specializations", (query) => query.eq("user_profile_id", userId));
  await deleteMatching(adminClient, "profiles", (query) => query.eq("id", userId));
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) throw new Error("Autorizzazione mancante");

    const body = await request.json();
    if (body.confirmation !== "DELETE") throw new Error("Conferma non valida");

    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !anonKey || !serviceKey) throw new Error("Configurazione Supabase incompleta per la cancellazione account.");
    const accessToken = readBearerToken(authorization);
    const userClient = createClient(url, anonKey);
    const adminClient = createClient(url, serviceKey);

    const { data: { user }, error: userError } = await userClient.auth.getUser(accessToken);
    if (userError || !user?.email) throw userError || new Error("Utente non trovato");

    const { data: avatarFiles } = await adminClient.storage.from("avatars").list(user.id);
    if (avatarFiles?.length) {
      await adminClient.storage.from("avatars").remove(avatarFiles.map((file) => `${user.id}/${file.name}`));
    }

    await deleteAccountData(adminClient, user.id);

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    const emailSent = await sendDeletedEmail(user.email);
    return new Response(JSON.stringify({ deleted: true, email_sent: emailSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = readableError(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
