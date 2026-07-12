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

async function withTimeout<T>(operation: Promise<T>, ms: number, message: string): Promise<T> {
  let timeoutId = 0;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });
  try {
    return await Promise.race([operation, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
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

  if (collaborationIds.length) {
    await deleteMatching(adminClient, "reviews", (query) => query.in("collaboration_id", collaborationIds));
    await deleteMatching(adminClient, "messages", (query) => query.in("collaboration_id", collaborationIds));
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

    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
    const adminClient = createClient(url, serviceKey);

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user?.email) throw userError || new Error("Utente non trovato");

    const { data: avatarFiles } = await adminClient.storage.from("avatars").list(user.id);
    if (avatarFiles?.length) {
      await adminClient.storage.from("avatars").remove(avatarFiles.map((file) => `${user.id}/${file.name}`));
    }

    await withTimeout(deleteAccountData(adminClient, user.id), 14000, "La cancellazione dei dati collegati ha impiegato troppo tempo.");

    const { error: deleteError } = await withTimeout(
      adminClient.auth.admin.deleteUser(user.id),
      10000,
      "La cancellazione dell'utente ha impiegato troppo tempo.",
    );
    if (deleteError) throw deleteError;

    const emailSent = await sendDeletedEmail(user.email);
    return new Response(JSON.stringify({ deleted: true, email_sent: emailSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Operazione non riuscita";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
