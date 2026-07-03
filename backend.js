(function createTrankuiBackend() {
  const config = window.TRANKUI_CONFIG || {};
  const configured = Boolean(
    config.supabaseUrl &&
    config.supabasePublishableKey &&
    !config.supabaseUrl.includes("YOUR_PROJECT")
  );

  if (!configured || !window.supabase) {
    window.trankuiBackend = {
      configured: false,
      error: "Il backend Trankui non e ancora configurato.",
    };
    return;
  }

  const client = window.supabase.createClient(
    config.supabaseUrl,
    config.supabasePublishableKey,
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
  );

  function authRedirectUrl() {
    const path = window.location.pathname.endsWith("/")
      ? window.location.pathname
      : window.location.pathname.replace(/[^/]+$/, "");
    return `${window.location.origin}${path}`;
  }

  function unwrap(result) {
    if (result.error) throw result.error;
    return result.data;
  }

  async function session() {
    const data = unwrap(await client.auth.getSession());
    return data.session;
  }

  async function signUp({ name, email, password }) {
    return unwrap(await client.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: authRedirectUrl(),
      },
    }));
  }

  async function signIn({ email, password }) {
    return unwrap(await client.auth.signInWithPassword({ email, password }));
  }

  async function resendConfirmation(email) {
    return unwrap(await client.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: authRedirectUrl() },
    }));
  }

  async function requestPasswordReset(email) {
    return unwrap(await client.auth.resetPasswordForEmail(email, { redirectTo: authRedirectUrl() }));
  }

  async function updatePassword(password) {
    return unwrap(await client.auth.updateUser({ password }));
  }

  async function signOut() {
    unwrap(await client.auth.signOut());
  }

  function onAuthChange(callback) {
    return client.auth.onAuthStateChange((event, currentSession) => callback(currentSession, event));
  }

  async function roles() {
    return unwrap(await client.from("roles").select("id,name,category,slug").order("category").order("name"));
  }

  async function ownProfile() {
    const current = await session();
    if (!current) return null;
    const profile = unwrap(await client.from("profiles").select("*").eq("id", current.user.id).single());
    const secondaryRoles = unwrap(await client.from("secondary_roles")
      .select("id,role_id,other_role_name,position,roles(id,name,category,slug)")
      .eq("profile_id", current.user.id).order("position"));
    const contactResult = await client.from("private_contacts").select("phone").eq("profile_id", current.user.id).maybeSingle();
    if (contactResult.error) throw contactResult.error;
    return { ...profile, email: current.user.email, phone: contactResult.data?.phone || "", secondaryRoles };
  }

  async function saveProfile(profile, secondaryRoleIds) {
    const current = await session();
    if (!current) throw new Error("Sessione scaduta");
    const id = current.user.id;
    const profilePayload = {
      full_name: profile.full_name,
      primary_role_id: profile.primary_role_id,
      primary_other_role_name: profile.primary_other_role_name || null,
      bio: profile.bio || "",
      city: profile.city || "",
      region: profile.region || "Sardegna",
      travel_area: profile.travel_area || "",
      years_experience: Number(profile.years_experience || 0),
      portfolio_url: profile.portfolio_url || null,
      equipment: profile.equipment || "",
      brands: profile.brands || [],
      production_types: profile.production_types || [],
      avatar_url: profile.avatar_url || null,
      instagram_url: profile.instagram_url || null,
      facebook_url: profile.facebook_url || null,
      tiktok_url: profile.tiktok_url || null,
      linkedin_url: profile.linkedin_url || null,
      availability_visible: Boolean(profile.availability_visible),
      profile_status: profile.profile_status || "draft",
    };
    unwrap(await client.from("profiles").update(profilePayload).eq("id", id).select("id").single());
    unwrap(await client.from("private_contacts").upsert({ profile_id: id, phone: profile.phone || null }));
    unwrap(await client.from("secondary_roles").delete().eq("profile_id", id));
    if (secondaryRoleIds.length) {
      unwrap(await client.from("secondary_roles").insert(secondaryRoleIds.map((role, position) => ({
        profile_id: id,
        role_id: role.role_id,
        other_role_name: role.other_role_name || null,
        position,
      }))));
    }
    return ownProfile();
  }

  async function uploadAvatar(file) {
    const current = await session();
    if (!current) throw new Error("Sessione scaduta");
    const extension = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${current.user.id}/profile-${Date.now()}.${extension}`;
    unwrap(await client.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type }));
    const { data } = client.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  }

  async function publicProfiles() {
    return unwrap(await client.from("profiles")
      .select("id,full_name,primary_role_id,primary_other_role_name,bio,city,region,travel_area,years_experience,portfolio_url,equipment,brands,production_types,avatar_url,instagram_url,facebook_url,tiktok_url,linkedin_url,verified,created_at,roles:primary_role_id(id,name,category,slug),secondary_roles(role_id,other_role_name,position,roles(id,name,category,slug))")
      .eq("profile_status", "active"));
  }

  async function availabilityForRange(from, to) {
    return unwrap(await client.from("availability").select("profile_id,work_date,status,source")
      .gte("work_date", from).lte("work_date", to));
  }

  async function setAvailability(workDate, status) {
    const current = await session();
    if (!current) throw new Error("Sessione scaduta");
    return unwrap(await client.from("availability").upsert({
      profile_id: current.user.id,
      work_date: workDate,
      status,
      source: "manual",
    }, { onConflict: "profile_id,work_date" }).select().single());
  }

  async function listPosts() {
    return unwrap(await client.from("posts")
      .select("*,owner:owner_id(id,full_name,avatar_url,verified),role:role_id(id,name,category),post_applications(id,applicant_id,message,status,created_at,applicant:applicant_id(id,full_name,avatar_url,verified))")
      .order("created_at", { ascending: false }));
  }

  async function createPost(payload) {
    const current = await session();
    if (!current) throw new Error("Sessione scaduta");
    return unwrap(await client.from("posts").insert({ ...payload, owner_id: current.user.id }).select().single());
  }

  async function applyToPost(postId, message) {
    const current = await session();
    if (!current) throw new Error("Sessione scaduta");
    return unwrap(await client.from("post_applications").insert({
      post_id: postId,
      applicant_id: current.user.id,
      message: message || "",
    }).select().single());
  }

  async function selectApplicant(applicationId) {
    return unwrap(await client.rpc("select_post_applicant", { application_id: applicationId }));
  }

  async function collaborations() {
    return unwrap(await client.from("collaborations")
      .select("*,requester:requester_id(id,full_name,avatar_url,verified),professional:professional_id(id,full_name,avatar_url,verified),role:role_id(id,name,category)")
      .order("created_at", { ascending: false }));
  }

  async function requestCollaboration(payload) {
    const current = await session();
    if (!current) throw new Error("Sessione scaduta");
    return unwrap(await client.from("collaborations").insert({
      ...payload,
      requester_id: current.user.id,
      status: "pending",
    }).select().single());
  }

  async function transitionCollaboration(id, nextStatus) {
    return unwrap(await client.rpc("transition_collaboration", { target_id: id, next_status: nextStatus }));
  }

  async function confirmComplete(id) {
    return unwrap(await client.rpc("confirm_collaboration_complete", { target_id: id }));
  }

  async function messages(collaborationId) {
    return unwrap(await client.from("messages")
      .select("id,collaboration_id,sender_id,body,created_at,sender:sender_id(id,full_name,avatar_url)")
      .eq("collaboration_id", collaborationId).order("created_at"));
  }

  async function sendMessage(collaborationId, body) {
    const current = await session();
    if (!current) throw new Error("Sessione scaduta");
    return unwrap(await client.from("messages").insert({
      collaboration_id: collaborationId,
      sender_id: current.user.id,
      body,
    }).select().single());
  }

  function subscribeToMessages(collaborationId, callback) {
    return client.channel(`collaboration:${collaborationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `collaboration_id=eq.${collaborationId}`,
      }, callback)
      .subscribe();
  }

  async function submitReview(payload) {
    const current = await session();
    if (!current) throw new Error("Sessione scaduta");
    return unwrap(await client.from("reviews").insert({ ...payload, author_id: current.user.id }).select().single());
  }

  async function publishedReviews(profileId) {
    return unwrap(await client.rpc("published_reviews", { target_profile: profileId }));
  }

  async function ownReviews() {
    return unwrap(await client.from("reviews").select("*").order("created_at", { ascending: false }));
  }

  async function calendarConnections() {
    const current = await session();
    if (!current) return [];
    return unwrap(await client.from("calendar_connections").select("*").eq("profile_id", current.user.id));
  }

  async function saveCalendarConnection(provider, payload) {
    const current = await session();
    if (!current) throw new Error("Sessione scaduta");
    return unwrap(await client.from("calendar_connections").upsert({
      profile_id: current.user.id,
      provider,
      ...payload,
    }, { onConflict: "profile_id,provider" }).select().single());
  }

  async function connectGoogleCalendar() {
    return unwrap(await client.auth.linkIdentity({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/calendar.readonly",
        redirectTo: `${authRedirectUrl()}?calendar=google`,
      },
    }));
  }

  async function syncGoogleCalendar() {
    const current = await session();
    const token = current?.provider_token;
    if (!token) throw new Error("Ricollega Google Calendar per autorizzare la sincronizzazione");
    const timeMin = new Date();
    const timeMax = new Date();
    timeMax.setFullYear(timeMax.getFullYear() + 1);
    const response = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ timeMin: timeMin.toISOString(), timeMax: timeMax.toISOString(), items: [{ id: "primary" }] }),
    });
    if (!response.ok) throw new Error("Google Calendar non ha autorizzato la lettura libero/occupato");
    const data = await response.json();
    const dates = new Set();
    for (const period of data.calendars?.primary?.busy || []) {
      const cursor = new Date(period.start);
      const end = new Date(period.end);
      while (cursor < end) { dates.add(cursor.toISOString().slice(0, 10)); cursor.setDate(cursor.getDate() + 1); }
    }
    await Promise.all([...dates].map((date) => setAvailability(date, "busy")));
    await saveCalendarConnection("google", { status: "connected", external_calendar_id: "primary", last_synced_at: new Date().toISOString() });
    return dates.size;
  }

  async function deleteAccount() {
    const current = await session();
    if (!current) throw new Error("Sessione scaduta");
    return unwrap(await client.functions.invoke("delete-account", { body: { confirmation: "DELETE" } }));
  }

  async function collaborationContact(collaborationId) {
    const result = unwrap(await client.rpc("collaboration_contact", { target_collaboration: collaborationId }));
    return result?.[0] || null;
  }

  async function recordConsent(policyKey, policyVersion, granted) {
    const current = await session();
    if (!current) throw new Error("Sessione scaduta");
    return unwrap(await client.from("consents").insert({
      profile_id: current.user.id,
      policy_key: policyKey,
      policy_version: policyVersion,
      granted,
    }).select().single());
  }

  window.trankuiBackend = {
    configured: true,
    client,
    session,
    signUp,
    signIn,
    resendConfirmation,
    requestPasswordReset,
    updatePassword,
    signOut,
    onAuthChange,
    roles,
    ownProfile,
    saveProfile,
    uploadAvatar,
    publicProfiles,
    availabilityForRange,
    setAvailability,
    listPosts,
    createPost,
    applyToPost,
    selectApplicant,
    collaborations,
    requestCollaboration,
    transitionCollaboration,
    confirmComplete,
    messages,
    sendMessage,
    subscribeToMessages,
    submitReview,
    publishedReviews,
    ownReviews,
    calendarConnections,
    saveCalendarConnection,
    connectGoogleCalendar,
    syncGoogleCalendar,
    deleteAccount,
    collaborationContact,
    recordConsent,
  };
})();
