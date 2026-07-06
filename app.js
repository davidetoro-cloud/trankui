const backend = window.trankuiBackend;
const italianAreas = {
  "Abruzzo": ["Chieti", "L'Aquila", "Pescara", "Teramo"], "Basilicata": ["Matera", "Potenza"],
  "Calabria": ["Catanzaro", "Cosenza", "Crotone", "Reggio Calabria", "Vibo Valentia"],
  "Campania": ["Avellino", "Benevento", "Caserta", "Napoli", "Salerno"],
  "Emilia-Romagna": ["Bologna", "Ferrara", "Forli-Cesena", "Modena", "Parma", "Piacenza", "Ravenna", "Reggio Emilia", "Rimini"],
  "Friuli-Venezia Giulia": ["Gorizia", "Pordenone", "Trieste", "Udine"], "Lazio": ["Frosinone", "Latina", "Rieti", "Roma", "Viterbo"],
  "Liguria": ["Genova", "Imperia", "La Spezia", "Savona"],
  "Lombardia": ["Bergamo", "Brescia", "Como", "Cremona", "Lecco", "Lodi", "Mantova", "Milano", "Monza e Brianza", "Pavia", "Sondrio", "Varese"],
  "Marche": ["Ancona", "Ascoli Piceno", "Fermo", "Macerata", "Pesaro e Urbino"], "Molise": ["Campobasso", "Isernia"],
  "Piemonte": ["Alessandria", "Asti", "Biella", "Cuneo", "Novara", "Torino", "Verbano-Cusio-Ossola", "Vercelli"],
  "Puglia": ["Bari", "Barletta-Andria-Trani", "Brindisi", "Foggia", "Lecce", "Taranto"],
  "Sardegna": ["Cagliari", "Nuoro", "Oristano", "Sassari", "Sud Sardegna"],
  "Sicilia": ["Agrigento", "Caltanissetta", "Catania", "Enna", "Messina", "Palermo", "Ragusa", "Siracusa", "Trapani"],
  "Toscana": ["Arezzo", "Firenze", "Grosseto", "Livorno", "Lucca", "Massa-Carrara", "Pisa", "Pistoia", "Prato", "Siena"],
  "Trentino-Alto Adige": ["Bolzano", "Trento"], "Umbria": ["Perugia", "Terni"], "Valle d'Aosta": ["Aosta"],
  "Veneto": ["Belluno", "Padova", "Rovigo", "Treviso", "Venezia", "Verona", "Vicenza"]
};
const specializationGroups = {
  "Commercial & Advertising": ["Spot TV", "Commercial", "Branded Content", "Product Video", "Fashion Film", "Beauty", "Automotive", "Food & Beverage", "Luxury"],
  "Corporate": ["Video Aziendali", "Employer Branding", "Corporate Storytelling", "Formazione / E-learning", "Eventi Aziendali", "Interviste"],
  "Cinema & Fiction": ["Cortometraggi", "Lungometraggi", "Serie TV", "Fiction", "Trailer"],
  "Documentary": ["Documentari", "Docu-Series", "Reportage", "Travel Documentary", "Naturalistico"],
  "Broadcast": ["Programmi TV", "News", "Sport TV", "Live Production"],
  "Eventi": ["Congressi", "Convention", "Festival", "Concerti", "Teatro", "Eventi Sportivi"],
  "Wedding": ["Matrimoni", "Elopement", "Destination Wedding"], "Motorsport": ["Karting", "Motorsport", "Racing", "Rally"],
  "Sport": ["Calcio", "Basket", "Tennis", "Fitness", "Outdoor"], "Music": ["Videoclip Musicali", "Live Music", "Concerti"],
  "Digital & Social": ["Social Media", "YouTube", "TikTok", "Instagram", "Podcast Video"],
  "E-commerce": ["Amazon", "Product Video", "Packshot", "Demo Prodotto"], "Industrial": ["Industria", "Edilizia", "Manufacturing", "Energia"],
  "Specializzazioni Tecniche": ["Drone", "FPV", "Underwater", "Timelapse", "Hyperlapse", "Green Screen", "Virtual Production", "Motion Control"]
};
const specializations = [...new Set(Object.values(specializationGroups).flat())];

const state = {
  authMode: "signup",
  session: null,
  profile: null,
  roles: [],
  profiles: [],
  availability: [],
  posts: [],
  collaborations: [],
  reviews: [],
  receivedReviews: [],
  incomingMessages: [],
  calendarConnections: [],
  editingPostId: null,
  selectedProfileId: null,
  search: { roleId: "", date: isoDate(new Date()), region: "Sardegna", zone: "Cagliari", production: "" },
  availabilityMode: "available",
  month: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  activeChatId: null,
  chatSubscription: null,
  activeReviewId: null,
  notificationTimer: null,
};

const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
const icon = (name) => `<i data-lucide="${name}" aria-hidden="true"></i>`;
const escapeHtml = (value = "") => {
  const clean = value == null || value === "null" || value === "undefined" ? "" : value;
  return String(clean).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
};

function isoDate(date) {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function notificationStorageKey() {
  return `trankui:notifications:${state.session?.user?.id || "guest"}`;
}

function lastNotificationsReadAt() {
  return localStorage.getItem(notificationStorageKey()) || "1970-01-01T00:00:00.000Z";
}

function initials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "T";
}

function avatarContent(profile, alt = "") {
  const fallback = initials(profile?.full_name || profile?.email);
  return profile?.avatar_url
    ? `<img src="${escapeHtml(profile.avatar_url)}" alt="${escapeHtml(alt || `Foto di ${profile.full_name || "profilo"}`)}" onerror="this.parentElement.textContent='${fallback}'" />`
    : fallback;
}

function socialIcon(network) {
  const paths = {
    instagram: `<path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5Zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5ZM17.8 6.2a1.05 1.05 0 1 1-1.05 1.05A1.05 1.05 0 0 1 17.8 6.2Z"/>`,
    facebook: `<path d="M14 8h3V4.2c-.52-.07-2.3-.2-4.42-.2C8.2 4 5.2 6.68 5.2 11.6V16H2v4h3.2v10h4.9V20h4.1l.65-4h-4.75v-4c0-1.15.32-2 1.9-2H14V8Z" transform="translate(2 -4) scale(.8)"/>`,
    tiktok: `<path d="M16.6 2c.32 2.67 1.82 4.26 4.4 4.43v3.72a8.73 8.73 0 0 1-4.35-1.02v7.05A6.18 6.18 0 1 1 11.3 10v3.76a2.49 2.49 0 1 0 1.61 2.33V2h3.69Z"/>`,
    linkedin: `<path d="M5.34 7.5H1.67V20h3.67V7.5ZM3.5 2A2.12 2.12 0 1 0 3.5 6.24 2.12 2.12 0 0 0 3.5 2ZM20.5 12.83c0-3.77-2.01-5.52-4.7-5.52a4.06 4.06 0 0 0-3.68 2.02V7.5H8.45V20h3.67v-6.2c0-1.64.31-3.23 2.35-3.23 2.01 0 2.04 1.88 2.04 3.34V20h3.67l.32-7.17Z"/>`
  };
  return `<svg class="social-brand-icon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">${paths[network] || ""}</svg>`;
}

function normalizeProfileUrl(value, network) {
  const raw = String(value || "").trim();
  if (!raw || raw === "null" || raw === "undefined") return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  const clean = raw.replace(/^@/, "").replace(/^\/+|\/+$/g, "");
  const bases = { instagram: "https://instagram.com/", facebook: "https://facebook.com/", tiktok: "https://tiktok.com/@", linkedin: "https://linkedin.com/in/" };
  return `${bases[network]}${clean}`;
}

function showToast(message, isError = false) {
  const toast = qs("#toast");
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 3200);
}

function redrawIcons() {
  window.lucide?.createIcons();
}

function errorMessage(error) {
  const translations = {
    "Invalid login credentials": "Email o password non corretti.",
    "Email not confirmed": "Conferma prima l'email ricevuta da Trankui.",
    "User already registered": "Questa email e gia registrata. Prova ad accedere.",
    "new row violates row-level security policy for table \"reviews\"": "La collaborazione non risulta ancora conclusa per entrambi. Aggiorna la pagina e riprova.",
    "duplicate key value violates unique constraint \"reviews_collaboration_id_author_id_key\"": "Hai già inviato il feedback per questa collaborazione.",
  };
  if (error?.message?.includes("posts_description_check")) return "I dettagli devono contenere almeno 10 caratteri.";
  return translations[error?.message] || error?.message || "Qualcosa non ha funzionato. Riprova.";
}

function roleById(id) {
  return state.roles.find((role) => role.id === id);
}

function groupedRoleOptions(selected = "", includeEmpty = true) {
  const groups = Map.groupBy ? Map.groupBy(state.roles, (role) => role.category) : state.roles.reduce((map, role) => {
    map.set(role.category, [...(map.get(role.category) || []), role]);
    return map;
  }, new Map());
  const empty = includeEmpty ? `<option value="">Scegli un ruolo</option>` : "";
  return empty + [...groups.entries()].map(([category, roles]) => `
    <optgroup label="${escapeHtml(category)}">
      ${roles.map((role) => `<option value="${role.id}" ${role.id === selected ? "selected" : ""}>${escapeHtml(role.name)}</option>`).join("")}
    </optgroup>`).join("");
}

function optionList(items, selected = "") {
  return items.map((item) => `<option value="${escapeHtml(item)}" ${item === selected ? "selected" : ""}>${escapeHtml(item)}</option>`).join("");
}

function groupedOptions(groups, selected = "", emptyLabel = "Tutti") {
  return `<option value="">${emptyLabel}</option>` + Object.entries(groups).map(([category, items]) =>
    `<optgroup label="${escapeHtml(category)}">${items.map((item) => `<option value="${escapeHtml(item)}" ${item === selected ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}</optgroup>`
  ).join("");
}

function provincesFor(region) { return italianAreas[region] || []; }

function setAuthMode(mode) {
  state.authMode = mode;
  const signup = mode === "signup";
  const signin = mode === "signin";
  const recovery = mode === "recovery";
  const newPassword = mode === "new-password";
  qsa("[data-auth-mode]").forEach((button) => button.classList.toggle("active", button.dataset.authMode === mode));
  qs("#authTitle").textContent = signup ? "Crea il tuo profilo" : signin ? "Bentornato" : recovery ? "Recupera la password" : "Scegli una nuova password";
  qs("#authCopy").textContent = signup ? "Inizia a farti trovare per ruolo, zona e disponibilita." : signin ? "Accedi al tuo spazio professionale." : recovery ? "Ti invieremo un link sicuro via email." : "Inserisci una nuova password di almeno 8 caratteri.";
  qs("#authSubmit").innerHTML = signup ? `${icon("user-plus")}Crea profilo` : signin ? `${icon("log-in")}Accedi` : recovery ? `${icon("mail")}Invia link` : `${icon("key-round")}Aggiorna password`;
  qs("#authName").closest(".field").classList.toggle("hidden", !signup);
  qs("#authEmail").closest(".field").classList.toggle("hidden", newPassword);
  qs("#authPassword").closest(".field").classList.toggle("hidden", recovery);
  qs("#privacyConsentLine").classList.toggle("hidden", !signup);
  qs("#calendarConsentLine").classList.toggle("hidden", !signup);
  qs("#forgotPassword").classList.toggle("hidden", !signin);
  qs("#backToLogin").classList.toggle("hidden", !(recovery || newPassword));
  qs("#authName").required = signup;
  qs("#authEmail").required = !newPassword;
  qs("#authPassword").required = !recovery;
  qs("#privacyConsent").required = signup;
  qs("#authPassword").autocomplete = signup || newPassword ? "new-password" : "current-password";
  qs("#authStatus").textContent = "";
  redrawIcons();
}

async function handleAuth(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const submit = qs("#authSubmit");
  submit.disabled = true;
  qs("#authStatus").textContent = "";
  try {
    if (state.authMode === "signup") {
      const result = await backend.signUp({
        name: form.get("name").trim(),
        email: form.get("email").trim(),
        password: form.get("password"),
      });
      if (result.session) {
        await backend.recordConsent("privacy_terms", "2026-06-30", true);
        await backend.recordConsent("availability_search", "2026-06-30", form.get("calendarConsent") === "on");
        await enterApp(result.session);
      } else {
        qs("#authStatus").innerHTML = `<strong>Controlla la tua email</strong><span>Abbiamo inviato il link di conferma. Controlla anche Spam e Promozioni.</span><button class="auth-text-button" type="button" id="resendConfirmation">Reinvia email di verifica</button>`;
      }
    } else if (state.authMode === "signin") {
      const result = await backend.signIn({ email: form.get("email").trim(), password: form.get("password") });
      await enterApp(result.session);
    } else if (state.authMode === "recovery") {
      await backend.requestPasswordReset(form.get("email").trim());
      qs("#authStatus").innerHTML = `<strong>Email inviata</strong><span>Apri il link ricevuto per scegliere una nuova password.</span>`;
    } else {
      await backend.updatePassword(form.get("password"));
      showToast("Password aggiornata");
      const session = await backend.session();
      await enterApp(session);
    }
  } catch (error) {
    qs("#authStatus").textContent = errorMessage(error);
  } finally {
    submit.disabled = false;
  }
}

async function enterApp(session) {
  state.session = session;
  qs("#authScreen").classList.add("hidden");
  qs("#appShell").classList.remove("hidden");
  await loadAppData();
  startNotificationPolling();
}

function startNotificationPolling() {
  clearInterval(state.notificationTimer);
  state.notificationTimer = setInterval(async () => {
    if (!state.session || document.hidden) return;
    try {
      const [collaborations, reviews, receivedReviews, incomingMessages] = await Promise.all([
        backend.collaborations(), backend.ownReviews(), backend.publishedReviews(state.session.user.id), backend.incomingMessages(),
      ]);
      state.collaborations = collaborations;
      state.reviews = reviews;
      state.receivedReviews = receivedReviews;
      state.incomingMessages = incomingMessages;
      renderActivity();
      renderNotifications();
      redrawIcons();
    } catch (_) { /* The next interval retries silently. */ }
  }, 30000);
}

async function loadAppData() {
  try {
    if (!state.roles.length) state.roles = await backend.roles();
    state.profile = await backend.ownProfile();
    const start = new Date(state.month.getFullYear(), state.month.getMonth(), 1);
    const end = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 0);
    const [profiles, availability, posts, collaborations, reviews, receivedReviews, incomingMessages, calendarConnections] = await Promise.all([
      backend.publicProfiles(),
      backend.availabilityForRange(isoDate(start), isoDate(end)),
      backend.listPosts(),
      backend.collaborations(),
      backend.ownReviews(),
      backend.publishedReviews(state.session.user.id),
      backend.incomingMessages(),
      backend.calendarConnections(),
    ]);
    state.profiles = profiles.map((profile) => profile.id === state.profile?.id
      ? { ...profile, ...state.profile, secondary_roles: profile.secondary_roles }
      : profile);
    state.availability = availability;
    state.posts = posts;
    state.collaborations = collaborations;
    state.reviews = reviews;
    state.receivedReviews = receivedReviews;
    state.incomingMessages = incomingMessages;
    state.calendarConnections = calendarConnections;
    state.search.roleId ||= state.roles[0]?.id || "";
    renderApp();
  } catch (error) {
    showToast(errorMessage(error), true);
  }
}

function renderApp() {
  qs("#sidebarUser").textContent = state.profile?.full_name || state.session?.user?.email || "Profilo Trankui";
  qs("#sidebarAvatar").innerHTML = avatarContent(state.profile);
  renderSearchControls();
  renderSearchResults();
  renderBoard();
  renderActivity();
  renderCalendar();
  renderProfileForm();
  renderIntegrations();
  renderCommunity();
  renderNotifications();
  redrawIcons();
}

function renderSearchControls() {
  qs("#role").innerHTML = groupedRoleOptions(state.search.roleId, false);
  qs("#date").value = state.search.date;
  qs("#region").innerHTML = optionList(Object.keys(italianAreas), state.search.region);
  qs("#zone").innerHTML = `<option value="">Tutte le province</option>${optionList(provincesFor(state.search.region), state.search.zone)}`;
  qs("#production").innerHTML = groupedOptions(specializationGroups, state.search.production, "Tutti gli ambiti");
  qs("#postRole").innerHTML = groupedRoleOptions(state.search.roleId, false);
  qs("#postDate").value = state.search.date;
  qs("#postRegion").innerHTML = optionList(Object.keys(italianAreas), state.search.region);
  qs("#postZone").innerHTML = optionList(provincesFor(state.search.region), state.search.zone);
  qs("#postProduction").innerHTML = groupedOptions(specializationGroups, state.search.production, "Scegli un ambito");
}

function availabilityStatus(profileId, date) {
  return state.availability.find((item) => item.profile_id === profileId && item.work_date === date)?.status;
}

function profileRoleMatch(profile, roleId) {
  if (profile.primary_role_id === roleId) return 0;
  if ((profile.secondary_roles || []).some((item) => item.role_id === roleId)) return 1;
  return 2;
}

function filteredProfiles() {
  return state.profiles
    .filter((profile) => profile.id !== state.session?.user?.id)
    .map((profile) => ({ ...profile, matchRank: profileRoleMatch(profile, state.search.roleId) }))
    .filter((profile) => profile.matchRank < 2)
    .filter((profile) => !state.search.region || profile.region === state.search.region || new RegExp(state.search.region, "i").test(profile.travel_area || ""))
    .filter((profile) => !state.search.zone || profile.city === state.search.zone)
    .filter((profile) => !state.search.production || (profile.production_types || []).includes(state.search.production))
    .filter((profile) => !state.search.date || availabilityStatus(profile.id, state.search.date) === "available")
    .sort((a, b) => a.matchRank - b.matchRank || Number(b.verified) - Number(a.verified) || b.years_experience - a.years_experience);
}

function renderSearchResults() {
  const results = filteredProfiles();
  const role = roleById(state.search.roleId);
  qs("#resultCount").textContent = `${results.length} ${results.length === 1 ? "professionista disponibile" : "professionisti disponibili"}`;
  qs("#resultContext").textContent = `${role?.name || "Ruolo"} · ${formatDate(state.search.date)} · ${state.search.zone || state.search.region}${state.search.production ? ` · ${state.search.production}` : ""}`;
  qs("#availabilityAlert").innerHTML = state.profile?.availability_visible
    ? `${icon("calendar-check")}<div><strong>Il tuo calendario e visibile nelle ricerche</strong><span>Aggiorna le date quando cambia la tua agenda.</span></div>`
    : `${icon("calendar-x")}<div><strong>Il tuo profilo non compare ancora per disponibilita</strong><span>Completa il profilo e abilita la visibilita del calendario.</span></div><button class="tiny-button" type="button" data-go="profile">Completa profilo</button>`;

  qs("#resultsList").innerHTML = results.length ? results.map((profile) => {
    const primary = profile.roles?.name || profile.primary_other_role_name || "Professionista";
    return `<article class="result-card ${profile.id === state.selectedProfileId ? "selected" : ""}" data-profile="${profile.id}">
      <div class="avatar">${avatarContent(profile)}</div>
      <div class="result-main"><div class="result-title"><strong>${escapeHtml(profile.full_name)}</strong>${profile.verified ? icon("badge-check") : ""}</div>
      <span>${escapeHtml(primary)} · ${escapeHtml(profile.city)}</span>
      <small>${profile.matchRank === 0 ? "Ruolo principale" : "Competenza secondaria"} · ${profile.years_experience} anni di esperienza</small></div>
      <span class="availability-pill">Disponibile</span>
    </article>`;
  }).join("") : `<div class="empty-state">${icon("search-x")}<strong>Nessun risultato esatto</strong><span>Prova un'altra data o pubblica una richiesta in bacheca.</span><button class="secondary-button" data-go="board">Apri bacheca</button></div>`;

  if (!results.some((item) => item.id === state.selectedProfileId)) state.selectedProfileId = results[0]?.id || null;
  renderSelectedProfile();
}

async function renderSelectedProfile() {
  const profile = state.profiles.find((item) => item.id === state.selectedProfileId);
  if (!profile) {
    qs("#profilePanel").innerHTML = `<div class="empty-state">${icon("user-search")}<span>Seleziona un professionista per vedere il profilo.</span></div>`;
    redrawIcons();
    return;
  }
  const primary = profile.roles?.name || profile.primary_other_role_name || "Professionista";
  const secondary = (profile.secondary_roles || []).map((item) => item.roles?.name || item.other_role_name).filter(Boolean);
  const expertise = (profile.production_types || []).filter((item) => specializations.includes(item));
  const socialLinks = [["instagram_url", "instagram", "Instagram"], ["facebook_url", "facebook", "Facebook"], ["tiktok_url", "tiktok", "TikTok"], ["linkedin_url", "linkedin", "LinkedIn"]].filter(([key]) => profile[key] && profile[key] !== "null");
  qs("#profilePanel").innerHTML = `<article class="professional-profile">
    <header class="profile-hero"><div class="avatar large">${avatarContent(profile)}</div>
      <div class="profile-identity"><p class="eyebrow">${profile.verified ? "Profilo verificato" : "Profilo professionale"}</p><h2>${escapeHtml(profile.full_name)}</h2><span>${escapeHtml(primary)}</span><small>${icon("map-pin")}${escapeHtml(profile.city)}, ${escapeHtml(profile.region)}</small></div></header>
    <div class="trust-row"><div class="profile-stat">${icon("briefcase")}<span><strong>${profile.years_experience}</strong><small>anni di esperienza</small></span></div><div class="profile-stat">${icon(profile.verified ? "badge-check" : "clock-3")}<span><strong>${profile.verified ? "Verificato" : "In verifica"}</strong><small>identità professionale</small></span></div></div>
    <section class="profile-section"><h3>Profilo</h3><p class="profile-bio">${escapeHtml(profile.bio || "Bio professionale non ancora inserita.")}</p></section>
    ${secondary.length ? `<section class="profile-section"><h3>Competenze secondarie</h3><div class="tag-row">${secondary.map((role) => `<span>${escapeHtml(role)}</span>`).join("")}</div></section>` : ""}
    ${expertise.length ? `<section class="profile-section"><h3>Ambiti di specializzazione</h3><div class="tag-row">${expertise.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div></section>` : ""}
    <section class="profile-section"><h3>Dettagli operativi</h3><dl class="profile-facts"><div>${icon("plane")}<span><dt>Trasferte</dt><dd>${escapeHtml(profile.travel_area || "Da concordare")}</dd></span></div><div>${icon("camera")}<span><dt>Attrezzatura</dt><dd>${escapeHtml(profile.equipment || "Da chiedere")}</dd></span></div><div>${icon("tags")}<span><dt>Brand utilizzati</dt><dd>${escapeHtml((profile.brands || []).join(", ") || "Non indicati")}</dd></span></div></dl></section>
    ${(profile.portfolio_url || socialLinks.length) ? `<div class="profile-links">${profile.portfolio_url ? `<a class="secondary-button" href="${escapeHtml(profile.portfolio_url)}" target="_blank" rel="noopener">${icon("external-link")}Portfolio</a>` : ""}${socialLinks.map(([key, network, label]) => `<a class="social-icon-button" href="${escapeHtml(profile[key])}" target="_blank" rel="noopener" title="${label}" aria-label="${label}">${socialIcon(network)}</a>`).join("")}</div>` : ""}
    <button class="primary-button full-button profile-contact-button" type="button" data-request="${profile.id}">${icon("message-circle")}Contatta in chat</button>
    <section class="profile-section profile-reputation" id="publicReviews"><span>Caricamento reputazione...</span></section>
  </article>`;
  redrawIcons();
  try {
    const reviews = await backend.publishedReviews(profile.id);
    const host = qs("#publicReviews");
    if (!host || state.selectedProfileId !== profile.id) return;
    const overallRating = reviews.length ? reviews.reduce((sum, review) => sum + (review.punctuality + review.communication + review.reliability + review.organization + review.problem_solving) / 5, 0) / reviews.length : 0;
    host.innerHTML = reviews.length ? `<div class="review-summary"><div><p class="eyebrow">Reputazione</p><span class="review-score"><strong>${overallRating.toFixed(1)}</strong>${icon("star")}</span><small>${reviews.length} ${reviews.length === 1 ? "recensione" : "recensioni"} blind</small></div><p>${icon("eye-off")}I feedback diventano pubblici solo dopo la recensione reciproca.</p></div><div class="public-review-grid">${reviews.slice(0, 6).map((review) => {
      const average = (review.punctuality + review.communication + review.reliability + review.organization + review.problem_solving) / 5;
      return `<blockquote><div><strong>${average.toFixed(1)}</strong>${icon("star")}</div><p>${escapeHtml(review.public_comment || "Collaborazione consigliata")}</p><footer>${escapeHtml(review.author_name)} · ${new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" }).format(new Date(review.created_at))}</footer></blockquote>`;
    }).join("")}</div>` : `<div class="review-empty">${icon("star")}<div><strong>Nessuna recensione pubblicata</strong><span>I feedback compariranno dopo una collaborazione recensita da entrambe le persone.</span></div></div>`;
  } catch (_) {
    const host = qs("#publicReviews");
    if (host) host.innerHTML = "";
  }
}

async function openPublicProfile(profileId) {
  state.selectedProfileId = profileId;
  await renderSelectedProfile();
  const source = qs("#profilePanel");
  if (!source || !source.innerHTML.trim()) return showToast("Profilo non disponibile", true);
  qs("#publicProfileContent").innerHTML = source.innerHTML.replace('id="publicReviews"', 'class="public-reviews"');
  qs("#publicProfileBackdrop").classList.remove("hidden");
  document.body.classList.add("modal-open");
  redrawIcons();
}

function closePublicProfile() {
  qs("#publicProfileBackdrop").classList.add("hidden");
  document.body.classList.remove("modal-open");
}

async function sendCollaborationRequest(profileId) {
  try {
    let collaboration = state.collaborations.find((item) =>
      otherParticipant(item)?.id === profileId && ["pending", "accepted"].includes(item.status)
    );
    if (!collaboration) {
      collaboration = await backend.requestCollaboration({
        professional_id: profileId,
        role_id: state.search.roleId,
        work_date: state.search.date,
        zone: state.search.zone,
        production_type: state.search.production,
        note: "Contatto avviato dalla ricerca professionisti.",
      });
      await loadAppData();
      collaboration = state.collaborations.find((item) => item.id === collaboration.id);
    }
    closePublicProfile();
    await openChat(collaboration.id);
  } catch (error) {
    showToast(errorMessage(error), true);
  }
}

function renderBoard() {
  const postCard = (post) => {
    const own = post.owner_id === state.session?.user?.id;
    const applied = (post.post_applications || []).some((item) => item.applicant_id === state.session?.user?.id);
    return `<article class="board-card ${own ? "board-card-own" : ""}"><div class="board-card-head"><div><p class="eyebrow">${escapeHtml(post.production_type)}</p><h3>${escapeHtml(post.role?.name || post.other_role_name || "Ruolo")}</h3></div><div class="board-card-status">${own ? `<span class="owner-chip">Pubblicata da te</span>` : ""}<span class="status-chip">${escapeHtml(statusLabel(post.status))}</span></div></div>
      <p>${escapeHtml(post.description)}</p><div class="board-meta"><span>${icon("calendar")}${formatDate(post.work_date)}</span><span>${icon("map-pin")}${escapeHtml(post.zone)}</span>${post.budget ? `<span>${icon("euro")}${escapeHtml(post.budget)}</span>` : ""}</div>
      <small>Pubblicata da ${escapeHtml(post.owner?.full_name || "Professionista Trankui")}</small>
      ${own ? `<div class="owner-post-actions"><div class="application-list"><strong>${post.post_applications?.length || 0} candidature</strong>${(post.post_applications || []).map((application) => `<div><span>${escapeHtml(application.applicant?.full_name || "Candidato")}</span>${application.status === "pending" ? `<button class="tiny-button" data-select-applicant="${application.id}">Seleziona</button>` : `<span>${escapeHtml(application.status)}</span>`}</div>`).join("")}</div><button class="secondary-button" type="button" data-edit-post="${post.id}">${icon("pencil")}Modifica</button></div>` : `<button class="secondary-button" ${applied || post.status !== "open" ? "disabled" : ""} data-apply="${post.id}">${applied ? "Candidatura inviata" : "Candidati"}</button>`}
    </article>`;
  };
  const ownPosts = state.posts.filter((post) => post.owner_id === state.session?.user?.id);
  const communityPosts = state.posts.filter((post) => post.owner_id !== state.session?.user?.id);
  qs("#boardList").innerHTML = state.posts.length ? `<section class="board-group"><div class="board-group-title"><div><p class="eyebrow">GESTIONE</p><h3>Le tue richieste</h3></div><span>${ownPosts.length}</span></div>${ownPosts.length ? `<div class="board-group-grid">${ownPosts.map(postCard).join("")}</div>` : `<div class="empty-state compact">${icon("clipboard-list")}<strong>Non hai richieste aperte</strong></div>`}</section><section class="board-group"><div class="board-group-title"><div><p class="eyebrow">COMMUNITY</p><h3>Richieste degli altri professionisti</h3></div><span>${communityPosts.length}</span></div>${communityPosts.length ? `<div class="board-group-grid">${communityPosts.map(postCard).join("")}</div>` : `<div class="empty-state compact">${icon("users")}<strong>Nessuna richiesta della community</strong></div>`}</section>` : `<div class="empty-state">${icon("clipboard-list")}<strong>Nessuna richiesta aperta</strong><span>Pubblica la prima esigenza della community.</span></div>`;
}

async function createPost(event) {
  event.preventDefault();
  const formElement = event.currentTarget;
  const form = new FormData(formElement);
  const descriptionInput = qs("#postDescription");
  const description = String(form.get("description") || "").trim();
  if (description.length < 10) {
    descriptionInput.setCustomValidity("Inserisci almeno 10 caratteri nei dettagli essenziali.");
    descriptionInput.reportValidity();
    descriptionInput.focus();
    return;
  }
  descriptionInput.setCustomValidity("");
  try {
    const payload = {
      role_id: form.get("role"), work_date: form.get("date"), zone: form.get("zone"),
      production_type: form.get("production"), budget: form.get("budget") || null,
      description,
    };
    if (state.editingPostId) await backend.updatePost(state.editingPostId, payload);
    else await backend.createPost(payload);
    const wasEditing = Boolean(state.editingPostId);
    state.editingPostId = null;
    formElement.reset();
    formElement.classList.add("hidden");
    qs("#postDescriptionCount").textContent = "0/2000";
    qs("#postFormSubmitLabel").textContent = "Pubblica";
    qs("#cancelPost").textContent = "Annulla";
    showToast(wasEditing ? "Richiesta aggiornata" : "Richiesta pubblicata");
    await loadAppData();
  } catch (error) {
    showToast(errorMessage(error), true);
  }
}

function otherParticipant(collaboration) {
  return collaboration.requester_id === state.session?.user?.id ? collaboration.professional : collaboration.requester;
}

function statusLabel(status) {
  return ({ open: "Aperta", closed: "Chiusa", pending: "In attesa", accepted: "Accettata", rejected: "Rifiutata", cancelled: "Annullata", completed: "Conclusa" })[status] || status;
}

function renderActivity() {
  const pending = state.collaborations.filter((item) => item.status === "pending").length;
  const accepted = state.collaborations.filter((item) => item.status === "accepted").length;
  const completed = state.collaborations.filter((item) => item.status === "completed").length;
  qs("#activitySummary").innerHTML = `<div><strong>${pending}</strong><span>in attesa</span></div><div><strong>${accepted}</strong><span>attive</span></div><div><strong>${completed}</strong><span>concluse</span></div>`;
  const reviewedIds = new Set(state.reviews.map((review) => review.collaboration_id));
  const toReview = state.collaborations.filter((item) => item.status === "completed" && !reviewedIds.has(item.id));
  qs("#feedbackQueue").innerHTML = toReview.map((item) => `<div class="feedback-callout">${icon("star")}<div><strong>Com'e andata con ${escapeHtml(otherParticipant(item)?.full_name || "il collaboratore")}?</strong><span>Il feedback reciproco costruisce la reputazione operativa.</span></div><button class="primary-button" data-review="${item.id}">Lascia feedback</button></div>`).join("");
  qs("#requestList").innerHTML = state.collaborations.length ? state.collaborations.map((item) => {
    const other = otherParticipant(item);
    const incoming = item.professional_id === state.session?.user?.id;
    return `<article class="request-card"><div class="request-card-main"><button class="avatar avatar-button" type="button" data-open-profile="${other?.id || ""}">${avatarContent(other)}</button><div><h3><button class="profile-name-button" type="button" data-open-profile="${other?.id || ""}">${escapeHtml(other?.full_name || "Professionista")}</button></h3><span>${escapeHtml(item.role?.name || "Collaborazione")} · ${formatDate(item.work_date)} · ${escapeHtml(item.zone)}</span><p>${escapeHtml(item.note)}</p></div></div>
      <div class="request-actions"><span class="status-chip">${statusLabel(item.status)}</span>
      ${item.status === "pending" && incoming ? `<button class="primary-button" data-transition="accepted" data-collaboration="${item.id}">Accetta</button><button class="secondary-button" data-transition="rejected" data-collaboration="${item.id}">Rifiuta</button>` : ""}
      ${item.status === "accepted" ? `<button class="secondary-button" data-chat="${item.id}">${icon("messages-square")}Chat</button>${((item.requester_id === state.session?.user?.id && item.requester_completed) || (item.professional_id === state.session?.user?.id && item.professional_completed)) ? `<span class="completion-wait">${icon("clock")}In attesa della conferma dell'altra persona</span>` : `<button class="primary-button" data-complete="${item.id}">Lavoro concluso</button>`}` : ""}
      ${item.status === "completed" && !reviewedIds.has(item.id) ? `<button class="primary-button" data-review="${item.id}">${icon("star")}Lascia recensione</button>` : ""}
      </div></article>`;
  }).join("") : `<div class="empty-state">${icon("inbox")}<strong>Nessuna attivita</strong><span>Le richieste di collaborazione compariranno qui.</span></div>`;
}

function notificationItems() {
  const lastRead = lastNotificationsReadAt();
  const messages = state.incomingMessages.filter((item) => item.created_at > lastRead).map((item) => ({
    type: "message", date: item.created_at, collaborationId: item.collaboration_id,
    title: `Nuovo messaggio da ${item.sender?.full_name || "un professionista"}`,
    detail: item.body,
  }));
  const requests = state.collaborations.filter((item) =>
    item.status === "pending" && item.professional_id === state.session?.user?.id && item.created_at > lastRead
  ).map((item) => ({
    type: "request", date: item.created_at,
    title: `Nuova richiesta da ${item.requester?.full_name || "un professionista"}`,
    detail: `${item.role?.name || "Collaborazione"} · ${formatDate(item.work_date)}`,
  }));
  const feedback = state.receivedReviews.filter((item) => item.created_at > lastRead).map((item) => ({
    type: "feedback", date: item.created_at,
    title: `Nuovo feedback da ${item.author_name || "un collaboratore"}`,
    detail: item.public_comment || "La recensione reciproca è ora visibile.",
  }));
  const reviewedIds = new Set(state.reviews.map((review) => review.collaboration_id));
  const reminders = state.collaborations.filter((item) => item.status === "completed" && !reviewedIds.has(item.id) && (item.completed_at || item.updated_at) > lastRead).map((item) => ({
    type: "review", date: item.completed_at || item.updated_at, collaborationId: item.id,
    title: `Lascia un feedback a ${otherParticipant(item)?.full_name || "un collaboratore"}`,
    detail: "La collaborazione risulta conclusa.",
  }));
  return [...messages, ...requests, ...feedback, ...reminders].sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderNotifications() {
  const items = notificationItems();
  const badge = qs("#notificationBadge");
  badge.textContent = items.length > 99 ? "99+" : String(items.length);
  badge.classList.toggle("hidden", !items.length);
  qs("#notificationSummary").textContent = items.length ? `${items.length} ${items.length === 1 ? "aggiornamento" : "aggiornamenti"}` : "Tutto aggiornato";
  qs("#notificationList").innerHTML = items.length ? items.map((item) => `<button class="notification-item" type="button" data-notification-type="${item.type}" ${item.collaborationId ? `data-notification-collaboration="${item.collaborationId}"` : ""}>${icon(item.type === "message" ? "message-circle" : item.type === "feedback" || item.type === "review" ? "star" : "user-plus")}<span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small></span></button>`).join("") : `<div class="notification-empty">${icon("bell-check")}<span>Nessuna nuova notifica.</span></div>`;
  redrawIcons();
}

async function openChat(collaborationId) {
  try {
    const collaboration = state.collaborations.find((item) => item.id === collaborationId);
    if (!collaboration) throw new Error("Conversazione non disponibile. Aggiorna la pagina e riprova.");
    const other = otherParticipant(collaboration);
    state.activeChatId = collaborationId;
    qs("#chatTitle").textContent = other?.full_name || "Conversazione";
    qs("#chatAvatar").innerHTML = avatarContent(other);
    qs("#chatContext").textContent = `${collaboration?.role?.name || "Collaborazione"} · ${formatDate(collaboration?.work_date)}`;
    qs("#chatBackdrop").classList.remove("hidden");
    document.body.classList.add("modal-open");
    await refreshChat();
    state.chatSubscription?.unsubscribe?.();
    state.chatSubscription = backend.subscribeToMessages(collaborationId, refreshChat);
    qs("#chatInput").focus();
    redrawIcons();
  } catch (error) {
    showToast(errorMessage(error), true);
  }
}

async function refreshChat() {
  if (!state.activeChatId) return;
  const messages = await backend.messages(state.activeChatId);
  const currentUserId = state.session?.user?.id;
  qs("#chatMessages").innerHTML = messages.length ? messages.map((message) => {
    const mine = message.sender_id === currentUserId;
    const time = new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" }).format(new Date(message.created_at));
    return `<div class="chat-row ${mine ? "mine" : "theirs"}"><div class="chat-bubble"><p>${escapeHtml(message.body)}</p><time>${time}</time></div></div>`;
  }).join("") : `<div class="chat-empty">${icon("messages-square")}<strong>Inizia la conversazione</strong><span>Condividi call time, dettagli operativi e prossimi passi.</span></div>`;
  const panel = qs("#chatMessages");
  panel.scrollTop = panel.scrollHeight;
  redrawIcons();
}

function closeChat() {
  state.chatSubscription?.unsubscribe?.();
  state.chatSubscription = null;
  state.activeChatId = null;
  qs("#chatBackdrop").classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function openReview(collaborationId) {
  const collaboration = state.collaborations.find((item) => item.id === collaborationId);
  if (!collaboration) return showToast("Collaborazione non disponibile. Aggiorna la pagina e riprova.", true);
  const recipient = otherParticipant(collaboration);
  if (!recipient?.id) return showToast("Non riesco a identificare il collaboratore.", true);
  state.activeReviewId = collaborationId;
  qs("#reviewTitle").textContent = `Com'è andata con ${recipient?.full_name || "il collaboratore"}?`;
  qs("#reviewContext").textContent = `${collaboration?.role?.name || "Collaborazione"} · ${formatDate(collaboration.work_date)}`;
  qs("#reviewBackdrop").classList.remove("hidden");
  document.body.classList.add("modal-open");
  redrawIcons();
}

function closeReview() {
  state.activeReviewId = null;
  qs("#reviewBackdrop").classList.add("hidden");
  document.body.classList.remove("modal-open");
}

async function submitReview(event) {
  event.preventDefault();
  const formElement = event.currentTarget;
  const collaboration = state.collaborations.find((item) => item.id === state.activeReviewId);
  if (!collaboration) return showToast("Collaborazione non disponibile. Riapri il feedback e riprova.", true);
  const recipient = otherParticipant(collaboration);
  if (!recipient?.id) return showToast("Collaboratore non disponibile.", true);
  const form = new FormData(formElement);
  const button = qs("#submitReviewButton");
  button.disabled = true;
  button.querySelector("span").textContent = "Invio in corso...";
  try {
    await backend.submitReview({
      collaboration_id: collaboration.id, recipient_id: recipient.id, recommend: form.get("recommend") === "on",
      punctuality: Number(form.get("punctuality")), communication: Number(form.get("communication")),
      reliability: Number(form.get("reliability")), organization: Number(form.get("organization")),
      problem_solving: Number(form.get("problem_solving")), public_comment: form.get("public_comment").trim(), private_note: form.get("private_note").trim(),
    });
    closeReview();
    formElement.reset();
    showToast("Feedback salvato. Sarà visibile dopo la recensione reciproca.");
    await loadAppData();
  } catch (error) {
    showToast(errorMessage(error), true);
  } finally {
    button.disabled = false;
    button.querySelector("span").textContent = "Invia feedback";
  }
}

function monthDays() {
  const year = state.month.getFullYear();
  const month = state.month.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const total = new Date(year, month + 1, 0).getDate();
  return [...Array(firstWeekday).fill(null), ...Array.from({ length: total }, (_, index) => new Date(year, month, index + 1))];
}

function renderCalendar() {
  const ownAvailability = new Map(state.availability.filter((item) => item.profile_id === state.session?.user?.id).map((item) => [item.work_date, item.status]));
  const labels = { available: "Disponibile", maybe: "Forse", busy: "Occupato" };
  const monthName = new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" }).format(state.month);
  qs("#availabilityGrid").innerHTML = `<div class="availability-toolbar"><div><span class="toolbar-label">Segna le giornate come</span><div class="availability-modes">${Object.entries(labels).map(([value, label]) => `<button class="availability-mode ${state.availabilityMode === value ? "active" : ""}" data-mode="${value}"><span class="mode-dot ${value}"></span>${label}</button>`).join("")}</div></div><p>Seleziona uno stato, poi clicca sui giorni che vuoi aggiornare.</p></div>
    <div class="month-calendar"><div class="month-calendar-head"><button class="calendar-arrow" data-month="-1" title="Mese precedente">${icon("chevron-left")}</button><h3>${monthName}</h3><button class="calendar-arrow" data-month="1" title="Mese successivo">${icon("chevron-right")}</button></div>
    <div class="calendar-weekdays">${["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((day) => `<span>${day}</span>`).join("")}</div>
    <div class="calendar-month-grid">${monthDays().map((date) => date ? `<button class="calendar-day ${ownAvailability.get(isoDate(date)) || ""} ${isoDate(date) === isoDate(new Date()) ? "today" : ""}" data-day="${isoDate(date)}" title="${labels[ownAvailability.get(isoDate(date))] || "Nessuno stato"}"><span>${date.getDate()}</span></button>` : `<span class="calendar-empty"></span>`).join("")}</div>
    <div class="calendar-legend"><span><i class="legend-dot available"></i>Disponibile</span><span><i class="legend-dot maybe"></i>Forse</span><span><i class="legend-dot busy"></i>Occupato</span></div></div>`;
}

async function setDayAvailability(date) {
  try {
    const result = await backend.setAvailability(date, state.availabilityMode);
    const index = state.availability.findIndex((item) => item.profile_id === result.profile_id && item.work_date === result.work_date);
    if (index >= 0) state.availability[index] = result; else state.availability.push(result);
    renderCalendar();
    redrawIcons();
  } catch (error) {
    showToast(errorMessage(error), true);
  }
}

function renderProfileForm() {
  const profile = state.profile || {};
  const selectedSecondary = new Set((profile.secondaryRoles || []).map((item) => item.role_id));
  const secondaryNames = (profile.secondaryRoles || []).map((item) => item.roles?.name || item.other_role_name).filter(Boolean);
  const selectedSpecializations = new Set(profile.production_types || []);
  const profileRegion = profile.region && italianAreas[profile.region] ? profile.region : "Sardegna";
  qs("#profileForm").innerHTML = `<div class="profile-photo-editor"><div class="avatar profile-photo-preview">${profile.avatar_url ? `<img src="${escapeHtml(profile.avatar_url)}" alt="Foto profilo" />` : initials(profile.full_name)}</div><div><strong>Foto profilo</strong><span>JPG, PNG o WebP, massimo 5 MB.</span><label class="secondary-button" for="avatarFile">${icon("camera")}Carica foto</label><input class="visually-hidden" id="avatarFile" type="file" accept="image/jpeg,image/png,image/webp" data-avatar-file /><input type="hidden" name="avatar_url" value="${escapeHtml(profile.avatar_url)}" /></div></div>
    <div class="form-section"><div class="field"><label>Nome e cognome *</label><input name="full_name" value="${escapeHtml(profile.full_name)}" required /></div>
    <div class="field"><label>Ruolo principale *</label><select name="primary_role_id" required>${groupedRoleOptions(profile.primary_role_id)}</select></div>
    <div class="field"><label>Regione *</label><select name="region" data-profile-region required>${optionList(Object.keys(italianAreas), profileRegion)}</select></div>
    <div class="field"><label>Provincia *</label><select name="city" data-profile-province required><option value="">Scegli</option>${optionList(provincesFor(profileRegion), profile.city)}</select></div>
    <div class="field"><label>Anni di esperienza</label><input name="years_experience" type="number" min="0" max="80" value="${profile.years_experience || 0}" /></div>
    <div class="field full"><label>Bio</label><textarea name="bio" maxlength="1200">${escapeHtml(profile.bio)}</textarea></div>
    <div class="field"><label>Disponibilita a trasferte</label><input name="travel_area" value="${escapeHtml(profile.travel_area)}" placeholder="Es. Tutta la Sardegna" /></div>
    <div class="field"><label>Telefono privato</label><input name="phone" value="${escapeHtml(profile.phone)}" placeholder="Visibile solo dopo un match" /></div>
    <div class="field"><label>Portfolio</label><input name="portfolio_url" type="url" value="${escapeHtml(profile.portfolio_url)}" placeholder="https://" /></div>
    <div class="field"><label>Brand utilizzati</label><input name="brands" value="${escapeHtml((profile.brands || []).join(", "))}" placeholder="Sony, ARRI, Aputure" /></div>
    <div class="field full"><label>Attrezzatura principale</label><textarea name="equipment">${escapeHtml(profile.equipment)}</textarea></div>
    <div class="field social-field"><label>${socialIcon("instagram")}Instagram</label><input name="instagram_url" value="${escapeHtml(profile.instagram_url)}" placeholder="Link o nome utente" /></div>
    <div class="field social-field"><label>${socialIcon("facebook")}Facebook</label><input name="facebook_url" value="${escapeHtml(profile.facebook_url)}" placeholder="Link o nome utente" /></div>
    <div class="field social-field"><label>${socialIcon("tiktok")}TikTok</label><input name="tiktok_url" value="${escapeHtml(profile.tiktok_url)}" placeholder="Link o @nomeutente" /></div>
    <div class="field social-field"><label>${socialIcon("linkedin")}LinkedIn</label><input name="linkedin_url" value="${escapeHtml(profile.linkedin_url)}" placeholder="Link o nome profilo" /></div></div>
    <details class="compact-multiselect"><summary><span><strong>Competenze secondarie</strong><small>Opzionali · massimo 5</small></span><span class="multiselect-summary" data-secondary-summary>${secondaryNames.length ? escapeHtml(secondaryNames.join(", ")) : "Nessuna selezionata"}</span>${icon("chevron-down")}</summary><div class="multiselect-popover"><input type="search" placeholder="Cerca un ruolo" data-role-search />
      <div class="multiselect-list">${state.roles.map((role) => `<label data-role-label="${escapeHtml(role.name.toLowerCase())}"><span>${escapeHtml(role.name)}</span><input type="checkbox" name="secondary_roles" value="${role.id}" data-label="${escapeHtml(role.name)}" ${selectedSecondary.has(role.id) ? "checked" : ""} ${role.id === profile.primary_role_id ? "disabled" : ""}/></label>`).join("")}</div></div></details>
    <details class="compact-multiselect"><summary><span><strong>Ambiti di specializzazione</strong><small>Opzionali · massimo 5</small></span><span class="multiselect-summary" data-specialization-summary>${selectedSpecializations.size ? escapeHtml([...selectedSpecializations].join(", ")) : "Nessuno selezionato"}</span>${icon("chevron-down")}</summary><div class="multiselect-popover"><p class="multiselect-help">Seleziona gli ambiti in cui lavori più frequentemente o in cui ritieni di avere maggiore esperienza. Queste informazioni aiuteranno gli altri professionisti a trovarti per produzioni specifiche.</p><input type="search" placeholder="Cerca un ambito" data-specialization-search />
      <div class="multiselect-list grouped">${Object.entries(specializationGroups).map(([category, items]) => `<div class="multiselect-group"><strong>${escapeHtml(category)}</strong>${items.map((item) => `<label data-specialization-label="${escapeHtml(item.toLowerCase())}"><span>${escapeHtml(item)}</span><input type="checkbox" name="specializations" value="${escapeHtml(item)}" data-label="${escapeHtml(item)}" ${selectedSpecializations.has(item) ? "checked" : ""}/></label>`).join("")}</div>`).join("")}</div></div></details>
    <label class="consent-line"><input name="availability_visible" type="checkbox" ${profile.availability_visible ? "checked" : ""}/><span>Mostra il mio profilo nelle ricerche quando risulto disponibile.</span></label>
    <button class="primary-button" type="submit">${icon("save")}Salva profilo</button>`;
}

async function saveProfile(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const selected = form.getAll("secondary_roles");
  const selectedSpecializations = form.getAll("specializations");
  if (selected.length > 5) return showToast("Puoi scegliere al massimo 5 competenze secondarie", true);
  if (selectedSpecializations.length > 5) return showToast("Puoi scegliere al massimo 5 ambiti di specializzazione", true);
  const fullName = form.get("full_name").trim();
  const primaryRoleId = form.get("primary_role_id");
  const city = form.get("city");
  try {
    state.profile = await backend.saveProfile({
      full_name: fullName, primary_role_id: primaryRoleId, bio: form.get("bio"), city,
      region: form.get("region"), travel_area: form.get("travel_area"), years_experience: form.get("years_experience"),
      portfolio_url: form.get("portfolio_url"), equipment: form.get("equipment"),
      avatar_url: form.get("avatar_url"), instagram_url: normalizeProfileUrl(form.get("instagram_url"), "instagram"), facebook_url: normalizeProfileUrl(form.get("facebook_url"), "facebook"),
      tiktok_url: normalizeProfileUrl(form.get("tiktok_url"), "tiktok"), linkedin_url: normalizeProfileUrl(form.get("linkedin_url"), "linkedin"),
      brands: form.get("brands").split(",").map((item) => item.trim()).filter(Boolean),
      production_types: selectedSpecializations, phone: form.get("phone"),
      availability_visible: form.get("availability_visible") === "on",
      profile_status: fullName && primaryRoleId && city ? "active" : "draft",
    }, selected.map((roleId, position) => ({ role_id: roleId, position })));
    showToast("Profilo aggiornato");
    await loadAppData();
  } catch (error) {
    showToast(errorMessage(error), true);
  }
}

function renderIntegrations() {
  const connection = (provider) => state.calendarConnections.find((item) => item.provider === provider);
  const google = connection("google");
  const apple = connection("apple");
  qs("#integrationsGrid").innerHTML = `<article class="integration-card"><div class="integration-icon">${icon("calendar-days")}</div><div><h3>Google Calendar</h3><span>${google?.last_synced_at ? `Ultimo aggiornamento ${new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(google.last_synced_at))}` : "Autorizza la lettura dello stato libero/occupato."}</span></div><button class="${google?.status === "connected" ? "secondary-button" : "primary-button"}" type="button" ${google?.status === "connected" ? "data-sync-google" : "data-connect-google"}>${google?.status === "connected" ? `${icon("refresh-cw")}Sincronizza` : `${icon("link")}Collega Google`}</button></article>
    <article class="integration-card"><div class="integration-icon">${icon("calendar-range")}</div><div><h3>Apple Calendar</h3><span>Importa un file .ics esportato da Calendario.</span></div><label class="${apple?.status === "connected" ? "secondary-button" : "primary-button"}" for="appleCalendarFile">${apple?.status === "connected" ? `${icon("refresh-cw")}Aggiorna` : `${icon("upload")}Importa .ics`}</label><input class="visually-hidden" id="appleCalendarFile" type="file" accept="text/calendar,.ics" data-apple-calendar /></article>
    <p class="integration-note">Trankui non legge titoli, clienti o dettagli degli eventi: usa soltanto lo stato libero/occupato dopo autorizzazione esplicita.</p>`;
}

async function importAppleCalendar(file) {
  const text = await file.text();
  const dates = [...text.matchAll(/^DTSTART(?:;VALUE=DATE)?(?:;[^:]*)?:(\d{8})/gm)].map((match) => `${match[1].slice(0, 4)}-${match[1].slice(4, 6)}-${match[1].slice(6, 8)}`);
  const uniqueDates = [...new Set(dates)];
  if (!uniqueDates.length) throw new Error("Il file non contiene eventi importabili");
  await Promise.all(uniqueDates.slice(0, 366).map((date) => backend.setAvailability(date, "busy")));
  await backend.saveCalendarConnection("apple", { status: "connected", external_calendar_id: file.name, last_synced_at: new Date().toISOString() });
  showToast(`${uniqueDates.length} giornate occupate importate da Apple Calendar`);
  await loadAppData();
}

function renderCommunity(query = qs("#communitySearch")?.value || "") {
  const active = state.profiles.length;
  const verified = state.profiles.filter((profile) => profile.verified).length;
  const needle = query.trim().toLowerCase();
  const visibleProfiles = state.profiles.filter((profile) => {
    const roleNames = [profile.roles?.name, ...(profile.secondary_roles || []).map((item) => item.roles?.name || item.other_role_name)];
    const searchable = [profile.full_name, profile.city, profile.region, ...roleNames, ...(profile.production_types || [])].filter(Boolean).join(" ").toLowerCase();
    return !needle || searchable.includes(needle);
  });
  qs("#betaStats").innerHTML = `<div><strong>${active}</strong><span>profili attivi</span></div><div><strong>${verified}</strong><span>verificati</span></div><div><strong>${state.collaborations.filter((item) => item.status === "completed").length}</strong><span>collaborazioni concluse</span></div>`;
  qs("#userDirectory").innerHTML = visibleProfiles.map((profile) => `<button class="community-card" type="button" data-open-profile="${profile.id}"><div class="avatar">${avatarContent(profile)}</div><div><strong>${escapeHtml(profile.full_name)}</strong><span>${escapeHtml(profile.roles?.name || profile.primary_other_role_name || "Professionista")} · ${escapeHtml(profile.city)}</span></div>${profile.verified ? icon("badge-check") : ""}</button>`).join("") || `<div class="empty-state">${needle ? "Nessun professionista corrisponde alla ricerca." : "La community iniziera a comparire qui."}</div>`;
}

function switchView(view) {
  qsa(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  qsa(".view").forEach((item) => item.classList.toggle("active-view", item.id === `view-${view}`));
  const titles = {
    search: ["Crew finder", "Trova un collaboratore affidabile in pochi minuti"], board: ["Bacheca", "Richieste aperte della community"],
    requests: ["Attivita", "Gestisci richieste, match e feedback"], calendar: ["Disponibilita", "Aggiorna quando puoi lavorare"],
    profile: ["Profilo", "Racconta come lavori, senza rumore"], admin: ["Community", "La rete professionale Trankui"],
  };
  qs("#pageEyebrow").textContent = titles[view][0];
  qs("#pageTitle").textContent = titles[view][1];
  redrawIcons();
}

document.addEventListener("click", async (event) => {
  const authMode = event.target.closest("[data-auth-mode]");
  if (authMode) return setAuthMode(authMode.dataset.authMode);
  if (event.target.closest("#forgotPassword")) return setAuthMode("recovery");
  if (event.target.closest("#backToLogin")) return setAuthMode("signin");
  if (event.target.closest("#resendConfirmation")) {
    const email = qs("#authEmail").value.trim();
    if (!email) return showToast("Inserisci prima la tua email", true);
    try { await backend.resendConfirmation(email); qs("#authStatus").innerHTML = `<strong>Email reinviata</strong><span>Controlla anche Spam e Promozioni.</span>`; }
    catch (error) { showToast(errorMessage(error), true); }
    return;
  }
  const nav = event.target.closest("[data-view]");
  if (nav) return switchView(nav.dataset.view);
  const go = event.target.closest("[data-go]");
  if (go) return switchView(go.dataset.go);
  const profile = event.target.closest("[data-profile]");
  if (profile) { state.selectedProfileId = profile.dataset.profile; await renderSelectedProfile(); return; }
  const publicProfile = event.target.closest("[data-open-profile]");
  if (publicProfile?.dataset.openProfile) return openPublicProfile(publicProfile.dataset.openProfile);
  const request = event.target.closest("[data-request]");
  if (request) return sendCollaborationRequest(request.dataset.request);
  const apply = event.target.closest("[data-apply]");
  if (apply) {
    const message = window.prompt("Messaggio per chi ha pubblicato la richiesta", "Sono disponibile e interessato alla produzione.");
    if (message === null) return;
    try { await backend.applyToPost(apply.dataset.apply, message); showToast("Candidatura inviata"); await loadAppData(); } catch (error) { showToast(errorMessage(error), true); }
    return;
  }
  const editPost = event.target.closest("[data-edit-post]");
  if (editPost) {
    const post = state.posts.find((item) => item.id === editPost.dataset.editPost && item.owner_id === state.session?.user?.id);
    if (!post) return showToast("Puoi modificare solo le richieste che hai pubblicato.", true);
    state.editingPostId = post.id;
    qs("#postRole").value = post.role_id;
    qs("#postDate").value = post.work_date;
    qs("#postZone").value = post.zone;
    qs("#postProduction").value = post.production_type;
    qs("#postBudget").value = post.budget || "";
    qs("#postDescription").value = post.description;
    qs("#postDescriptionCount").textContent = `${post.description.length}/2000`;
    qs("#postFormSubmitLabel").textContent = "Salva modifiche";
    qs("#cancelPost").textContent = "Annulla modifica";
    qs("#postForm").classList.remove("hidden");
    qs("#postForm").scrollIntoView({ behavior: "smooth", block: "start" });
    redrawIcons();
    return;
  }
  const select = event.target.closest("[data-select-applicant]");
  if (select) { try { await backend.selectApplicant(select.dataset.selectApplicant); showToast("Collaboratore selezionato"); await loadAppData(); } catch (error) { showToast(errorMessage(error), true); } return; }
  const transition = event.target.closest("[data-transition]");
  if (transition) { try { await backend.transitionCollaboration(transition.dataset.collaboration, transition.dataset.transition); showToast("Richiesta aggiornata"); await loadAppData(); } catch (error) { showToast(errorMessage(error), true); } return; }
  const complete = event.target.closest("[data-complete]");
  if (complete) { try { const result = await backend.confirmComplete(complete.dataset.complete); await loadAppData(); if (result.status === "completed") openReview(result.id); else showToast("Conferma registrata. Attendi quella dell'altra persona."); } catch (error) { showToast(errorMessage(error), true); } return; }
  const chat = event.target.closest("[data-chat]");
  if (chat) return openChat(chat.dataset.chat);
  const review = event.target.closest("[data-review]");
  if (review) return openReview(review.dataset.review);
  const notification = event.target.closest("[data-notification-type]");
  if (notification) {
    qs("#notificationPanel").classList.add("hidden");
    qs("#notificationButton").setAttribute("aria-expanded", "false");
    if (notification.dataset.notificationType === "message") return openChat(notification.dataset.notificationCollaboration);
    if (notification.dataset.notificationType === "review") return openReview(notification.dataset.notificationCollaboration);
    return switchView("requests");
  }
  const googleCalendar = event.target.closest("[data-connect-google]");
  if (googleCalendar) { try { await backend.connectGoogleCalendar(); } catch (error) { showToast(errorMessage(error), true); } return; }
  const syncGoogle = event.target.closest("[data-sync-google]");
  if (syncGoogle) { try { syncGoogle.disabled = true; const count = await backend.syncGoogleCalendar(); showToast(`${count} giornate occupate sincronizzate`); await loadAppData(); } catch (error) { showToast(errorMessage(error), true); } finally { syncGoogle.disabled = false; } return; }
  const day = event.target.closest("[data-day]");
  if (day) return setDayAvailability(day.dataset.day);
  const mode = event.target.closest("[data-mode]");
  if (mode) { state.availabilityMode = mode.dataset.mode; renderCalendar(); redrawIcons(); return; }
  const month = event.target.closest("[data-month]");
  if (month) { state.month = new Date(state.month.getFullYear(), state.month.getMonth() + Number(month.dataset.month), 1); await loadAppData(); return; }
});

qs("#authForm").addEventListener("submit", handleAuth);
qs("#searchForm").addEventListener("submit", (event) => {
  event.preventDefault(); const form = new FormData(event.currentTarget);
  state.search = { roleId: form.get("role"), date: form.get("date"), region: form.get("region"), zone: form.get("zone"), production: form.get("production") };
  renderSearchResults(); redrawIcons();
});
qs("#region").addEventListener("change", (event) => {
  qs("#zone").innerHTML = `<option value="">Tutte le province</option>${optionList(provincesFor(event.target.value))}`;
});
qs("#postRegion").addEventListener("change", (event) => {
  qs("#postZone").innerHTML = optionList(provincesFor(event.target.value));
});
qs("#postForm").addEventListener("submit", createPost);
qs("#postDescription").addEventListener("input", (event) => {
  event.target.setCustomValidity("");
  qs("#postDescriptionCount").textContent = `${event.target.value.length}/2000`;
});
qs("#profileForm").addEventListener("submit", saveProfile);
qs("#communitySearch").addEventListener("input", (event) => { renderCommunity(event.target.value); redrawIcons(); });
qs("#reviewForm").addEventListener("submit", submitReview);
qs("#closeReview").addEventListener("click", closeReview);
qs("#reviewBackdrop").addEventListener("click", (event) => { if (event.target === event.currentTarget) closeReview(); });
qs("#closePublicProfile").addEventListener("click", closePublicProfile);
qs("#publicProfileBackdrop").addEventListener("click", (event) => { if (event.target === event.currentTarget) closePublicProfile(); });
qs("#togglePostForm").addEventListener("click", () => qs("#postForm").classList.toggle("hidden"));
qs("#cancelPost").addEventListener("click", () => {
  state.editingPostId = null;
  qs("#postForm").reset();
  qs("#postForm").classList.add("hidden");
  qs("#postFormSubmitLabel").textContent = "Pubblica";
  qs("#cancelPost").textContent = "Annulla";
  qs("#postDescriptionCount").textContent = "0/2000";
});
qs("#openBoard").addEventListener("click", () => { switchView("board"); qs("#postForm").classList.remove("hidden"); });
qs("#openAvailability").addEventListener("click", () => switchView("calendar"));
qs("#notificationButton").addEventListener("click", () => {
  const panel = qs("#notificationPanel");
  panel.classList.toggle("hidden");
  qs("#notificationButton").setAttribute("aria-expanded", String(!panel.classList.contains("hidden")));
});
qs("#markNotificationsRead").addEventListener("click", () => {
  localStorage.setItem(notificationStorageKey(), new Date().toISOString());
  renderNotifications();
});
qs("#openProfile").addEventListener("click", () => switchView("profile"));
qs("#openDeleteAccount").addEventListener("click", () => {
  qs("#deleteAccountConfirmation").value = "";
  qs("#confirmDeleteAccount").disabled = true;
  qs("#deleteAccountBackdrop").classList.remove("hidden");
  document.body.classList.add("modal-open");
});
qs("#closeDeleteAccount").addEventListener("click", () => {
  qs("#deleteAccountBackdrop").classList.add("hidden");
  document.body.classList.remove("modal-open");
});
qs("#deleteAccountConfirmation").addEventListener("input", (event) => {
  qs("#confirmDeleteAccount").disabled = event.target.value.trim().toUpperCase() !== "CANCELLA";
});
qs("#confirmDeleteAccount").addEventListener("click", async () => {
  const button = qs("#confirmDeleteAccount");
  button.disabled = true;
  try {
    const result = await backend.deleteAccount();
    state.session = null;
    qs("#deleteAccountBackdrop").classList.add("hidden");
    qs("#appShell").classList.add("hidden");
    qs("#authScreen").classList.remove("hidden");
    setAuthMode("signin");
    qs("#authStatus").innerHTML = `<strong>Account cancellato</strong><span>${result.email_sent ? "Ti abbiamo inviato una conferma via email." : "La cancellazione è stata completata."}</span>`;
  } catch (error) {
    showToast(errorMessage(error), true);
    button.disabled = false;
  }
});
qs("#closeChat").addEventListener("click", closeChat);
qs("#chatBackdrop").addEventListener("click", (event) => { if (event.target === event.currentTarget) closeChat(); });
qs("#chatForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = qs("#chatInput");
  const body = input.value.trim();
  if (!body || !state.activeChatId) return;
  input.disabled = true;
  try { await backend.sendMessage(state.activeChatId, body); input.value = ""; await refreshChat(); }
  catch (error) { showToast(errorMessage(error), true); }
  finally { input.disabled = false; input.focus(); }
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (state.activeChatId) closeChat();
  if (state.activeReviewId) closeReview();
  if (!qs("#publicProfileBackdrop").classList.contains("hidden")) closePublicProfile();
  if (!qs("#deleteAccountBackdrop").classList.contains("hidden")) { qs("#deleteAccountBackdrop").classList.add("hidden"); document.body.classList.remove("modal-open"); }
});

qs("#logoutButton").addEventListener("click", async () => { clearInterval(state.notificationTimer); await backend.signOut(); state.session = null; qs("#appShell").classList.add("hidden"); qs("#authScreen").classList.remove("hidden"); });
qs("#profileForm").addEventListener("input", (event) => {
  if (event.target.matches("[data-role-search]")) qsa("[data-role-label]").forEach((label) => label.classList.toggle("hidden", !label.dataset.roleLabel.includes(event.target.value.toLowerCase())));
  if (event.target.matches("[data-specialization-search]")) qsa("[data-specialization-label]").forEach((label) => label.classList.toggle("hidden", !label.dataset.specializationLabel.includes(event.target.value.toLowerCase())));
  if (event.target.name === "secondary_roles") {
    if (qsa('input[name="secondary_roles"]:checked').length > 5) { event.target.checked = false; return showToast("Massimo 5 competenze secondarie", true); }
    qs("[data-secondary-summary]").textContent = qsa('input[name="secondary_roles"]:checked').map((input) => input.dataset.label).join(", ") || "Nessuna selezionata";
  }
  if (event.target.name === "specializations") {
    if (qsa('input[name="specializations"]:checked').length > 5) { event.target.checked = false; return showToast("Massimo 5 ambiti di specializzazione", true); }
    qs("[data-specialization-summary]").textContent = qsa('input[name="specializations"]:checked').map((input) => input.dataset.label).join(", ") || "Nessuno selezionato";
  }
});
qs("#profileForm").addEventListener("change", async (event) => {
  if (event.target.matches("[data-profile-region]")) {
    qs("[data-profile-province]").innerHTML = `<option value="">Scegli</option>${optionList(provincesFor(event.target.value))}`;
    return;
  }
  if (!event.target.matches("[data-avatar-file]")) return;
  const file = event.target.files?.[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) return showToast("La foto non può superare 5 MB", true);
  try {
    event.target.disabled = true;
    const url = await backend.uploadAvatar(file);
    qs('input[name="avatar_url"]', qs("#profileForm")).value = url;
    qs(".profile-photo-preview").innerHTML = `<img src="${escapeHtml(url)}" alt="Anteprima foto profilo" />`;
    showToast("Foto caricata. Salva il profilo per confermare.");
  } catch (error) { showToast(errorMessage(error), true); }
  finally { event.target.disabled = false; }
});
qs("#integrationsGrid").addEventListener("change", async (event) => {
  if (!event.target.matches("[data-apple-calendar]")) return;
  try { await importAppleCalendar(event.target.files?.[0]); }
  catch (error) { showToast(errorMessage(error), true); }
});

async function init() {
  redrawIcons();
  setAuthMode("signup");
  if (!backend?.configured) {
    qs("#authStatus").textContent = backend?.error || "Backend non configurato";
    qs("#authSubmit").disabled = true;
    return;
  }
  const session = await backend.session();
  if (session) {
    if (new URLSearchParams(window.location.search).get("calendar") === "google") {
      const count = await backend.syncGoogleCalendar();
      showToast(`${count} giornate occupate importate da Google Calendar`);
      history.replaceState({}, "", window.location.pathname);
    }
    await enterApp(session);
  }
  backend.onAuthChange(async (nextSession, event) => {
    if (event === "PASSWORD_RECOVERY") {
      state.session = nextSession;
      qs("#authScreen").classList.remove("hidden");
      qs("#appShell").classList.add("hidden");
      setAuthMode("new-password");
      return;
    }
    if (nextSession && !state.session) await enterApp(nextSession);
  });
}

init();
