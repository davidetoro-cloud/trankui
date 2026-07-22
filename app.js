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
  recentMessages: [],
  calendarConnections: [],
  supportTickets: [],
  betaFeedbackItems: [],
  supportMessages: [
    { role: "assistant", body: "Ciao, sono l'assistente Trankui. Posso spiegarti come usare profilo, ricerca, bacheca, chat, calendario e recensioni. Se invece hai trovato un'anomalia, puoi aprire un ticket qui accanto." }
  ],
  editingPostId: null,
  pendingDeletePostId: null,
  archivedCollaborationIds: new Set(),
  activityFilter: "todo",
  selectedProfileId: null,
  search: { roleId: "", date: isoDate(new Date()), region: "Sardegna", zone: "Cagliari", production: "" },
  searchDates: new Set([isoDate(new Date())]),
  searchMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  searchSubmitted: false,
  communityPage: 1,
  onboardingStep: 0,
  availabilityMode: "available",
  selectedAvailabilityDates: new Set(),
  month: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  activeChatId: null,
  activeChatIds: [],
  activeChatPeerId: null,
  chatSubscriptions: [],
  activeReviewId: null,
  notificationPreferences: null,
  notificationTimer: null,
  lastNotificationSignature: "",
  profileEditing: false,
  pendingWelcomeSession: null,
  workspaceMode: "member",
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

function selectedSearchDates() {
  return [...state.searchDates].sort();
}

function searchDateLabel() {
  const dates = selectedSearchDates();
  if (!dates.length) return "Scegli date";
  if (dates.length === 1) return formatDate(dates[0]);
  return `${dates.length} date selezionate`;
}

function searchDateContext() {
  const dates = selectedSearchDates();
  if (!dates.length) return "Qualsiasi data";
  if (dates.length === 1) return formatDate(dates[0]);
  return `${dates.length} date · ${formatDate(dates[0])}`;
}

function syncSearchDateInput() {
  const dates = selectedSearchDates();
  const input = qs("#date");
  if (input) input.value = dates.join(",");
  const label = qs("#searchDateLabel");
  if (label) label.textContent = searchDateLabel();
  state.search.date = dates[0] || "";
}

function mergeAvailability(records = []) {
  records.forEach((record) => {
    const index = state.availability.findIndex((item) => item.profile_id === record.profile_id && item.work_date === record.work_date);
    if (index >= 0) state.availability[index] = record;
    else state.availability.push(record);
  });
}

async function ensureAvailabilityForSearchDates() {
  const dates = selectedSearchDates();
  if (!dates.length) return;
  const records = await backend.availabilityForRange(dates[0], dates[dates.length - 1]);
  mergeAvailability(records);
}

function notificationStorageKey() {
  return `trankui:notifications:${state.session?.user?.id || "guest"}`;
}

function soundNotificationStorageKey() {
  return `trankui:sound-notifications:${state.session?.user?.id || "guest"}`;
}

function notificationPreferenceStorageKey() {
  return `trankui:notification-preferences:${state.session?.user?.id || "guest"}`;
}

function supportTicketStorageKey() {
  return `trankui:support-tickets:${state.session?.user?.id || "guest"}`;
}

function archivedCollaborationsStorageKey() {
  return `trankui:archived-collaborations:${state.session?.user?.id || "guest"}`;
}

function localArchivedCollaborationIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(archivedCollaborationsStorageKey()) || "[]"));
  } catch (_) {
    return new Set();
  }
}

function persistArchivedCollaborationIds() {
  localStorage.setItem(archivedCollaborationsStorageKey(), JSON.stringify([...state.archivedCollaborationIds]));
}

function lastNotificationsReadAt() {
  return localStorage.getItem(notificationStorageKey()) || "1970-01-01T00:00:00.000Z";
}

function defaultNotificationPreferences() {
  return {
    channels: { push: false, sound: true, email: false },
    topics: { messages: true, requests: true, matches: true, reviews: true, availability: true },
  };
}

function notificationPreferences() {
  const defaults = defaultNotificationPreferences();
  try {
    const stored = JSON.parse(localStorage.getItem(notificationPreferenceStorageKey()) || "{}");
    const legacySound = localStorage.getItem(soundNotificationStorageKey());
    return {
      channels: { ...defaults.channels, ...(state.notificationPreferences?.channels || {}), ...(stored.channels || {}), ...(legacySound === "off" ? { sound: false } : {}) },
      topics: { ...defaults.topics, ...(state.notificationPreferences?.topics || {}), ...(stored.topics || {}) },
    };
  } catch (_) {
    return {
      channels: { ...defaults.channels, ...(state.notificationPreferences?.channels || {}) },
      topics: { ...defaults.topics, ...(state.notificationPreferences?.topics || {}) },
    };
  }
}

function saveNotificationPreferences(preferences) {
  state.notificationPreferences = preferences;
  localStorage.setItem(notificationPreferenceStorageKey(), JSON.stringify(preferences));
  localStorage.setItem(soundNotificationStorageKey(), preferences.channels.sound ? "on" : "off");
  if (backend?.saveNotificationPreferences && state.session) {
    backend.saveNotificationPreferences(preferences).then((saved) => {
      if (!saved) return;
      state.notificationPreferences = {
        channels: { ...defaultNotificationPreferences().channels, ...(saved.channels || {}) },
        topics: { ...defaultNotificationPreferences().topics, ...(saved.topics || {}) },
      };
      localStorage.setItem(notificationPreferenceStorageKey(), JSON.stringify(state.notificationPreferences));
    }).catch(() => {});
  }
}

function updateNotificationPreference(group, key, value) {
  const preferences = notificationPreferences();
  preferences[group][key] = value;
  saveNotificationPreferences(preferences);
  return preferences;
}

function soundNotificationsEnabled() {
  return notificationPreferences().channels.sound;
}

function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

function pushNotificationsSupported() {
  return Boolean("Notification" in window && "serviceWorker" in navigator && "PushManager" in window && window.TRANKUI_CONFIG?.vapidPublicKey);
}

async function ensurePushSubscription() {
  if (!pushNotificationsSupported()) throw new Error("Questo browser non supporta ancora le notifiche push mobile.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Permesso notifiche non concesso.");
  const registration = await navigator.serviceWorker.register("./sw.js?v=20260710-notifications-1");
  const existing = await registration.pushManager.getSubscription();
  const subscription = existing || await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(window.TRANKUI_CONFIG.vapidPublicKey),
  });
  if (backend?.savePushSubscription) await backend.savePushSubscription(subscription);
  return subscription;
}

async function disablePushSubscription() {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration("./");
  const subscription = await registration?.pushManager?.getSubscription();
  if (!subscription) return;
  if (backend?.deletePushSubscription) await backend.deletePushSubscription(subscription.endpoint).catch(() => {});
  await subscription.unsubscribe();
}

function notifyEvent(payload) {
  if (!backend?.notifyEvent) return;
  backend.notifyEvent(payload).catch(() => {});
}

function localSupportTickets() {
  try {
    return JSON.parse(localStorage.getItem(supportTicketStorageKey()) || "[]");
  } catch (_) {
    return [];
  }
}

function fallbackProfileFromSession(session = state.session) {
  const user = session?.user || {};
  const metadata = user.user_metadata || {};
  const fallbackName = metadata.company_name || metadata.full_name || metadata.name || user.email?.split("@")[0] || "Profilo Trankui";
  const modes = profileModesFromValue(metadata.profile_modes, metadata.account_type || (metadata.company_name ? "company" : "freelance"));
  return {
    id: user.id || "local-profile",
    full_name: fallbackName,
    account_type: metadata.account_type || (metadata.company_name ? "company" : "freelance"),
    company_name: metadata.company_name || null,
    company_type: metadata.company_type || null,
    contact_name: metadata.contact_name || null,
    avatar_url: metadata.avatar_url || metadata.picture || null,
    email: user.email || "",
    phone: "",
    primary_role_id: null,
    primary_other_role_name: "",
    bio: "",
    city: "",
    region: "Sardegna",
    travel_area: "",
    years_experience: 0,
    portfolio_url: "",
    equipment: "",
    brands: [],
    production_types: [],
    availability_visible: false,
    can_work_as_member: modes.includes("member"),
    can_work_as_builder: modes.includes("builder"),
    profile_status: "draft",
    verified: false,
    secondaryRoles: [],
    secondary_roles: [],
  };
}

async function safeLoad(label, loader, fallback) {
  try {
    return await loader();
  } catch (error) {
    console.warn(`Trankui: ${label} non disponibile`, error);
    return typeof fallback === "function" ? fallback(error) : fallback;
  }
}

function saveLocalSupportTicket(ticket) {
  const tickets = [ticket, ...localSupportTickets()].slice(0, 30);
  localStorage.setItem(supportTicketStorageKey(), JSON.stringify(tickets));
  return ticket;
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

let pendingIconRedraw = false;
function redrawIcons() {
  if (!window.lucide || pendingIconRedraw) return;
  pendingIconRedraw = true;
  window.requestAnimationFrame(() => {
    pendingIconRedraw = false;
    window.lucide?.createIcons();
  });
}

function requestNotificationSettingsPanel() {
  window.loadTrankuiNotificationsRuntime?.();
  window.dispatchEvent(new CustomEvent("trankui:profile-rendered"));
}

function setAuthStatus(title = "", copy = "", actionHtml = "") {
  const status = qs("#authStatus");
  if (!title && !copy && !actionHtml) {
    status.innerHTML = "";
    return;
  }
  status.innerHTML = `<strong>${escapeHtml(title)}</strong>${copy ? `<span>${escapeHtml(copy)}</span>` : ""}${actionHtml}`;
}

function resetCrewZeroWelcome() {
  const entry = qs(".auth-entry");
  entry?.classList.remove("auth-entry-welcome");
  qs(".auth-mode")?.classList.remove("hidden");
  qs("#authTitle")?.classList.remove("hidden");
  qs("#authCopy")?.classList.remove("hidden");
  qs("#authForm")?.classList.remove("hidden");
  state.pendingWelcomeSession = null;
}

function showCrewZeroWelcome(email = "", session = null) {
  state.pendingWelcomeSession = session;
  qs(".auth-entry").classList.add("auth-entry-welcome");
  qs(".auth-mode").classList.add("hidden");
  qs("#authTitle").classList.add("hidden");
  qs("#authCopy").classList.add("hidden");
  qs("#authForm").classList.add("hidden");
  const emailNote = session
    ? "Puoi iniziare subito: completa il profilo per renderti trovabile dalla community."
    : signupConfirmationMessage(email);
  qs("#authStatus").innerHTML = `<section class="crew-zero-welcome">
    <div class="crew-zero-mark">${icon("sparkles")}</div>
    <p class="eyebrow">Beta privata</p>
    <h2>Benvenuto nella Crew Zero 🎬</h2>
    <p>Sei tra i primi professionisti che stanno contribuendo alla costruzione di Trankui.</p>
    <p>Ogni suggerimento, bug segnalato o idea che condividerai contribuirà a migliorare la piattaforma prima del lancio pubblico.</p>
    <p>Hai già ottenuto il badge esclusivo <strong>“Crew Zero”</strong>, che rimarrà per sempre nel tuo profilo come riconoscimento per aver partecipato alla Beta.</p>
    <div class="crew-zero-note">${icon("mail-check")}<span>${escapeHtml(emailNote)}</span></div>
    <div class="crew-zero-actions">
      <button class="primary-button" type="button" data-crew-zero-complete>${icon("user-round-check")}Completa il tuo profilo</button>
      <button class="secondary-button" type="button" data-crew-zero-explore>${icon("compass")}Esplora la piattaforma</button>
    </div>
  </section>`;
  redrawIcons();
}

function errorMessage(error) {
  const rawString = typeof error === "string" ? error.trim() : "";
  const rawMessage = typeof error?.message === "string" ? error.message.trim() : "";
  const emptyProviderError = !rawMessage || rawMessage === "{}" || rawMessage === "[object Object]";
  if (rawString === "{}" || rawString === "[object Object]") {
    return "Non siamo riusciti a inviare la mail di conferma. Riprova tra poco o usa Google.";
  }
  const translations = {
    "Invalid login credentials": "Email o password non corretti.",
    "Email not confirmed": "Conferma prima l'email ricevuta da Trankui.",
    "User already registered": "Questa email e gia registrata. Prova ad accedere.",
    "A user with this email address has already been registered": "Questa email e gia registrata. Prova ad accedere oppure recupera la password.",
    "Signup requires a valid password": "Inserisci una password valida di almeno 8 caratteri.",
    "email rate limit exceeded": "Abbiamo raggiunto il limite temporaneo di invio email. Riprova piu tardi o accedi con Google.",
    "{}": "Non siamo riusciti a inviare la mail di conferma. Riprova tra poco o usa Google.",
    "new row violates row-level security policy for table \"reviews\"": "La collaborazione non risulta ancora conclusa per entrambi. Aggiorna la pagina e riprova.",
    "duplicate key value violates unique constraint \"reviews_collaboration_id_author_id_key\"": "Hai già inviato il feedback per questa collaborazione.",
  };
  if (rawMessage.includes("posts_description_check")) return "I dettagli devono contenere almeno 10 caratteri.";
  if (/^Email address ".+" is invalid$/.test(rawMessage)) return "Inserisci un indirizzo email reale e attivo per ricevere la conferma.";
  if (rawMessage && !emptyProviderError) return translations[rawMessage] || rawMessage;
  if (rawMessage === "{}") return translations[rawMessage];
  if (rawString) return translations[rawString] || rawString;
  if (emptyProviderError && error) return "Non siamo riusciti a inviare la mail di conferma. Riprova tra poco o usa Google.";
  return "Qualcosa non ha funzionato. Riprova tra poco.";
}

function signupConfirmationMessage(email = "") {
  const target = email ? ` all'indirizzo ${email}` : "";
  return `Ti abbiamo inviato il link di conferma${target}. Aprilo per attivare l'account. Controlla anche Spam e Promozioni.`;
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

function selectedAuthProfileModes() {
  const modes = qsa("#profileModeSelector input[name='profile_modes']:checked").map((item) => item.value);
  return modes.length ? modes : ["member"];
}

function syncAuthProfileModes(forceDefaults = false) {
  const selector = qs("#profileModeSelector");
  if (!selector) return;
  const signup = state.authMode === "signup";
  selector.classList.toggle("hidden", !signup);
  if (!signup) return;
  const member = qs("#profileModeSelector input[value='member']");
  const builder = qs("#profileModeSelector input[value='builder']");
  if ((forceDefaults || !selector.dataset.touched) && member && builder) {
    member.checked = true;
    builder.checked = true;
  }
  if (member && builder && !member.checked && !builder.checked) {
    member.checked = true;
  }
}

function syncAuthAccountType() {
  const signup = state.authMode === "signup";
  qs("#authName").closest(".field").classList.toggle("hidden", !signup);
  qs("#authCompanyNameField").classList.toggle("hidden", !signup);
  qs("#authName").required = signup;
  qs("#authCompanyName").required = false;
  if (signup) {
    qs("#authTitle").textContent = "Crea il tuo profilo";
    qs("#authCopy").textContent = "Scegli come usare Trankui: puoi essere trovato, costruire crew o fare entrambe le cose.";
  }
  syncAuthProfileModes();
}

function setAuthMode(mode) {
  resetCrewZeroWelcome();
  state.authMode = mode;
  const signup = mode === "signup";
  const signin = mode === "signin";
  const recovery = mode === "recovery";
  const newPassword = mode === "new-password";
  qsa("[data-auth-mode]").forEach((button) => button.classList.toggle("active", button.dataset.authMode === mode));
  qs("#authTitle").textContent = signup ? "Crea il tuo profilo" : signin ? "Bentornato" : recovery ? "Recupera la password" : "Scegli una nuova password";
  qs("#authCopy").textContent = signup ? "Inizia a farti trovare per ruolo, zona e disponibilita." : signin ? "Accedi al tuo spazio professionale." : recovery ? "Ti invieremo un link sicuro via email." : "Inserisci una nuova password di almeno 8 caratteri.";
  qs("#authSubmit").innerHTML = signup ? `${icon("user-plus")}Crea profilo` : signin ? `${icon("log-in")}Accedi` : recovery ? `${icon("mail")}Invia link` : `${icon("key-round")}Aggiorna password`;
  qs("#authEmail").closest(".field").classList.toggle("hidden", newPassword);
  qs("#authPassword").closest(".field").classList.toggle("hidden", recovery);
  qs("#privacyConsentLine").classList.toggle("hidden", !signup);
  qs("#calendarConsentLine").classList.toggle("hidden", !signup);
  qs("#forgotPassword").classList.toggle("hidden", !signin);
  qs("#backToLogin").classList.toggle("hidden", !(recovery || newPassword));
  qs("#authEmail").required = !newPassword;
  qs("#authPassword").required = !recovery;
  qs("#privacyConsent").required = signup;
  qs("#authPassword").autocomplete = signup || newPassword ? "new-password" : "current-password";
  qs("#googleAuthButton").classList.toggle("hidden", recovery || newPassword);
  qs("#googleAuthLabel").textContent = signup ? "Registrati con Google" : "Accedi con Google";
  setAuthStatus();
  syncAuthAccountType();
  redrawIcons();
}

async function handleAuth(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const submit = qs("#authSubmit");
  submit.disabled = true;
  const email = String(form.get("email") || "").trim();
  setAuthStatus("Operazione in corso", "Stiamo creando il profilo. Rimani su questa pagina per qualche secondo.");
  try {
    if (state.authMode === "signup") {
      const accountType = "freelance";
      const profileModes = selectedAuthProfileModes();
      const companyName = String(form.get("company_name") || "").trim();
      const result = await backend.signUp({
        name: form.get("name").trim(),
        email,
        password: form.get("password"),
        account_type: accountType,
        profile_modes: profileModes,
        company_name: companyName,
        company_type: "",
        contact_name: "",
      });
      if (result.session) {
        try {
          await backend.recordConsent("privacy_terms", "2026-06-30", true);
          await backend.recordConsent("availability_search", "2026-06-30", form.get("calendarConsent") === "on");
        } catch (consentError) {
          console.warn("Consent record failed", consentError);
        }
        showCrewZeroWelcome(email, result.session);
      } else {
        showCrewZeroWelcome(email);
      }
    } else if (state.authMode === "signin") {
      const result = await backend.signIn({ email, password: form.get("password") });
      await enterApp(result.session);
    } else if (state.authMode === "recovery") {
      await backend.requestPasswordReset(email);
      setAuthStatus("Email inviata", "Apri il link ricevuto per scegliere una nuova password.");
    } else {
      await backend.updatePassword(form.get("password"));
      showToast("Password aggiornata");
      const session = await backend.session();
      await enterApp(session);
    }
  } catch (error) {
    setAuthStatus("Non siamo riusciti a completare l'operazione", errorMessage(error));
  } finally {
    submit.disabled = false;
  }
}

async function handleGoogleAuth() {
  const button = qs("#googleAuthButton");
  button.disabled = true;
  setAuthStatus("Apro Google", "Tra poco verrai reindirizzato alla schermata di accesso Google.");
  try {
    await backend.signInWithGoogle();
  } catch (error) {
    setAuthStatus("Accesso Google non disponibile", errorMessage(error));
    button.disabled = false;
  }
}

async function enterApp(session) {
  state.session = session;
  qs("#authScreen").classList.add("hidden");
  qs("#appShell").classList.remove("hidden");
  await loadAppData();
  if (state.profile && state.profile.profile_status !== "active") switchView("profile");
  rememberCurrentNotifications();
  startNotificationPolling();
}

function startNotificationPolling() {
  clearInterval(state.notificationTimer);
  state.notificationTimer = setInterval(async () => {
    if (!state.session) return;
    try {
      const previousSignature = state.lastNotificationSignature;
      const [collaborations, reviews, receivedReviews, incomingMessages, recentMessages] = await Promise.all([
        backend.collaborations(), backend.ownReviews(), backend.publishedReviews(state.session.user.id), backend.incomingMessages(), backend.recentMessages ? backend.recentMessages() : Promise.resolve([]),
      ]);
      state.collaborations = collaborations;
      state.reviews = reviews;
      state.receivedReviews = receivedReviews;
      state.incomingMessages = incomingMessages;
      state.recentMessages = recentMessages;
      renderActivity();
      renderChatPage();
      renderNotifications();
      announceNewNotifications(previousSignature);
      redrawIcons();
    } catch (_) { /* The next interval retries silently. */ }
  }, 30000);
}

async function loadAppData() {
  try {
    if (!state.roles.length) state.roles = await safeLoad("ruoli", () => backend.roles(), []);
    state.profile = await safeLoad("profilo", () => backend.ownProfile(), () => fallbackProfileFromSession());
    state.profile ||= fallbackProfileFromSession();
    const start = new Date(state.month.getFullYear(), state.month.getMonth(), 1);
    const end = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 0);
    const [profiles, availability, posts, collaborations, reviews, receivedReviews, incomingMessages, recentMessages, calendarConnections, supportTickets, betaFeedbackItems, notificationPrefs] = await Promise.all([
      safeLoad("profili pubblici", () => backend.publicProfiles(), []),
      safeLoad("disponibilita", () => backend.availabilityForRange(isoDate(start), isoDate(end)), []),
      safeLoad("bacheca", () => backend.listPosts(), []),
      safeLoad("collaborazioni", () => backend.collaborations(), []),
      safeLoad("recensioni inviate", () => backend.ownReviews(), []),
      safeLoad("recensioni ricevute", () => backend.publishedReviews(state.session.user.id), []),
      safeLoad("messaggi in arrivo", () => backend.incomingMessages(), []),
      safeLoad("messaggi recenti", () => backend.recentMessages ? backend.recentMessages() : Promise.resolve([]), []),
      safeLoad("calendari collegati", () => backend.calendarConnections(), []),
      safeLoad("ticket assistenza", () => backend.supportTickets ? backend.supportTickets() : Promise.resolve(localSupportTickets()), localSupportTickets()),
      safeLoad("feedback beta", () => backend.betaFeedback ? backend.betaFeedback() : Promise.resolve([]), []),
      safeLoad("preferenze notifiche", () => backend.notificationPreferences ? backend.notificationPreferences() : Promise.resolve(notificationPreferences()), notificationPreferences()),
    ]);
    state.profiles = profiles.map((profile) => profile.id === state.profile?.id
      ? { ...profile, ...state.profile, secondary_roles: profile.secondary_roles }
      : profile);
    state.availability = availability;
    state.posts = posts;
    state.collaborations = collaborations;
    state.archivedCollaborationIds = localArchivedCollaborationIds();
    state.reviews = reviews;
    state.receivedReviews = receivedReviews;
    state.incomingMessages = incomingMessages;
    state.recentMessages = recentMessages;
    state.calendarConnections = calendarConnections;
    state.supportTickets = supportTickets;
    state.betaFeedbackItems = betaFeedbackItems;
    state.notificationPreferences = notificationPrefs;
    state.search.roleId ||= state.roles[0]?.id || "";
    hydrateWorkspaceMode();
    renderApp();
  } catch (error) {
    console.error("Trankui: caricamento applicazione non riuscito", error);
    state.profile ||= fallbackProfileFromSession();
    state.roles ||= [];
    state.profiles ||= [];
    state.availability ||= [];
    state.posts ||= [];
    state.collaborations ||= [];
    state.reviews ||= [];
    state.receivedReviews ||= [];
    state.incomingMessages ||= [];
    state.recentMessages ||= [];
    state.calendarConnections ||= [];
    state.supportTickets ||= localSupportTickets();
    state.betaFeedbackItems ||= [];
    state.notificationPreferences ||= notificationPreferences();
    try {
      renderApp();
    } catch (renderError) {
      console.error("Trankui: render fallback non riuscito", renderError);
    }
    showToast(errorMessage(error), true);
  }
}

function renderApp() {
  qs("#sidebarUser").textContent = state.profile?.full_name || state.session?.user?.email || "Profilo Trankui";
  qs("#sidebarAvatar").innerHTML = avatarContent(state.profile);
  qs("#mobileMenuUser").textContent = state.profile?.full_name || state.session?.user?.email || "Profilo Trankui";
  qs("#mobileMenuAvatar").innerHTML = avatarContent(state.profile);
  syncWorkspaceSwitch();
  renderSearchControls();
  renderSearchResults();
  renderBoard();
  renderActivity();
  renderCalendar();
  renderProfileOnboarding();
  renderProfileForm();
  renderIntegrations();
  renderCommunity();
  renderSupport();
  renderBetaFeedback();
  renderChatPage();
  renderNotifications();
  redrawIcons();
}

function renderSearchControls() {
  qs("#role").innerHTML = groupedRoleOptions(state.search.roleId, false);
  syncSearchDateInput();
  renderSearchDatePicker();
  qs("#region").innerHTML = optionList(Object.keys(italianAreas), state.search.region);
  qs("#zone").innerHTML = `<option value="">Tutte le province</option>${optionList(provincesFor(state.search.region), state.search.zone)}`;
  qs("#production").innerHTML = groupedOptions(specializationGroups, state.search.production, "Tutti gli ambiti");
  qs("#postRole").innerHTML = groupedRoleOptions(state.search.roleId, false);
  qs("#postDate").value = state.search.date;
  qs("#postRegion").innerHTML = optionList(Object.keys(italianAreas), state.search.region);
  qs("#postZone").innerHTML = optionList(provincesFor(state.search.region), state.search.zone);
  qs("#postProduction").innerHTML = groupedOptions(specializationGroups, state.search.production, "Scegli un ambito");
}

function monthDaysFor(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const total = new Date(year, month + 1, 0).getDate();
  return [...Array(firstWeekday).fill(null), ...Array.from({ length: total }, (_, index) => new Date(year, month, index + 1))];
}

function renderSearchDatePicker() {
  const host = qs("#searchDatePopover");
  if (!host) return;
  const dates = selectedSearchDates();
  const selected = new Set(dates);
  const monthName = new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" }).format(state.searchMonth);
  host.innerHTML = `<div class="search-date-calendar"><div class="month-calendar-head"><button class="calendar-arrow" type="button" data-search-month="-1" title="Mese precedente">${icon("chevron-left")}</button><h3>${monthName}</h3><button class="calendar-arrow" type="button" data-search-month="1" title="Mese successivo">${icon("chevron-right")}</button></div>
    <div class="calendar-weekdays">${["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((day) => `<span>${day}</span>`).join("")}</div>
    <div class="calendar-month-grid">${monthDaysFor(state.searchMonth).map((date) => date ? `<button class="calendar-day search-date-day ${selected.has(isoDate(date)) ? "pending" : ""} ${isoDate(date) === isoDate(new Date()) ? "today" : ""}" type="button" data-search-day="${isoDate(date)}"><span>${date.getDate()}</span></button>` : `<span class="calendar-empty"></span>`).join("")}</div>
    <div class="calendar-selection-bar ${dates.length ? "" : "is-empty"}"><span>${dates.length ? `${dates.length} ${dates.length === 1 ? "giorno selezionato" : "giorni selezionati"}` : "Nessun giorno selezionato"}</span><div><button class="ghost-button" type="button" data-search-date-clear ${dates.length ? "" : "disabled"}>Annulla selezione</button><button class="primary-button" type="button" data-search-date-close>${icon("check")}Applica</button></div></div></div>`;
  syncSearchDateInput();
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
  const dates = selectedSearchDates();
  return state.profiles
    .filter((profile) => profile.id !== state.session?.user?.id)
    .filter((profile) => profileUsageModes(profile).includes("member"))
    .map((profile) => ({ ...profile, matchRank: profileRoleMatch(profile, state.search.roleId) }))
    .filter((profile) => profile.matchRank < 2)
    .filter((profile) => !state.search.region || profile.region === state.search.region || new RegExp(state.search.region, "i").test(profile.travel_area || ""))
    .filter((profile) => !state.search.zone || profile.city === state.search.zone)
    .filter((profile) => !state.search.production || (profile.production_types || []).includes(state.search.production))
    .filter((profile) => !dates.length || dates.every((date) => availabilityStatus(profile.id, date) === "available"))
    .sort((a, b) => a.matchRank - b.matchRank || Number(b.verified) - Number(a.verified) || b.years_experience - a.years_experience);
}

function renderSearchResults() {
  const results = state.searchSubmitted ? filteredProfiles() : [];
  const role = roleById(state.search.roleId);
  qs(".status-row").classList.toggle("hidden", !state.searchSubmitted);
  qs("#resultCount").textContent = `${results.length} ${results.length === 1 ? "professionista disponibile" : "professionisti disponibili"}`;
  qs("#resultContext").textContent = `${role?.name || "Ruolo"} · ${searchDateContext()} · ${state.search.zone || state.search.region}${state.search.production ? ` · ${state.search.production}` : ""}`;
  qs("#availabilityAlert").innerHTML = state.profile?.availability_visible
    ? `${icon("calendar-check")}<div><strong>Il tuo calendario e visibile nelle ricerche</strong><span>Aggiorna le date quando cambia la tua agenda.</span></div>`
    : `${icon("calendar-x")}<div><strong>Il tuo profilo non compare ancora per disponibilita</strong><span>Completa il profilo e abilita la visibilita del calendario.</span></div><button class="tiny-button" type="button" data-go="profile">Completa profilo</button>`;

  qs("#resultsList").innerHTML = results.length ? results.map((profile) => {
    const primary = profile.roles?.name || profile.primary_other_role_name || "Professionista";
    return `<article class="result-card ${profile.id === state.selectedProfileId ? "selected" : ""}" data-profile="${profile.id}">
      <div class="avatar">${avatarContent(profile)}</div>
      <div class="result-main"><div class="result-title"><strong>${escapeHtml(profile.full_name)}</strong>${profile.verified ? icon("badge-check") : ""}${profileBadgeMini(profile)}</div>
      <span>${escapeHtml(primary)} · ${escapeHtml(profile.city)}</span>
      <small>${profile.matchRank === 0 ? "Ruolo principale" : "Competenza secondaria"} · ${profile.years_experience} anni di esperienza</small>${profileModeChips(profile)}</div>
      <span class="availability-pill">Disponibile</span>
    </article>`;
  }).join("") : state.searchSubmitted
    ? `<div class="empty-state search-empty-state">${icon("search-x")}<strong>Nessun risultato esatto</strong><span>Prova un'altra data o pubblica una richiesta in bacheca.</span><button class="secondary-button" type="button" data-open-board-request>Apri bacheca</button></div>`
    : "";

  if (!results.some((item) => item.id === state.selectedProfileId)) state.selectedProfileId = results[0]?.id || null;
  renderSelectedProfile();
}

async function renderSelectedProfile() {
  const profile = state.profiles.find((item) => item.id === state.selectedProfileId);
  if (!profile) {
    qs("#profilePanel").classList.add("hidden");
    qs("#profilePanel").innerHTML = "";
    redrawIcons();
    return;
  }
  qs("#profilePanel").classList.remove("hidden");
  const hasOrganization = Boolean(profile.company_name);
  const primary = profile.roles?.name || profile.primary_other_role_name || "Professionista";
  const secondary = (profile.secondary_roles || []).map((item) => item.roles?.name || item.other_role_name).filter(Boolean);
  const expertise = (profile.production_types || []).filter((item) => specializations.includes(item));
  const socialLinks = [["instagram_url", "instagram", "Instagram"], ["facebook_url", "facebook", "Facebook"], ["tiktok_url", "tiktok", "TikTok"], ["linkedin_url", "linkedin", "LinkedIn"]].filter(([key]) => profile[key] && profile[key] !== "null");
  const defaultEyebrow = "Profilo professionale";
  qs("#profilePanel").innerHTML = `<article class="professional-profile">
    <header class="profile-hero"><div class="avatar large">${avatarContent(profile)}</div>
      <div class="profile-identity"><p class="eyebrow" data-profile-eyebrow data-default-label="${escapeHtml(defaultEyebrow)}">${escapeHtml(defaultEyebrow)}</p><h2>${escapeHtml(profile.full_name)}</h2><span>${escapeHtml(primary)}</span><small>${icon("map-pin")}${escapeHtml(profile.city)}, ${escapeHtml(profile.region)}</small>${profileModeChips(profile)}${profileBadgeRow(profile, "public")}</div></header>
    <div class="trust-row"><div class="profile-stat">${icon("briefcase")}<span><strong>${profile.years_experience}</strong><small>anni di esperienza</small></span></div><div class="profile-stat" data-profile-verification-state>${icon("clock-3")}<span><strong>In verifica</strong><small>0/3 feedback ricevuti</small></span></div></div>
    <section class="profile-section"><h3>Profilo</h3><p class="profile-bio">${escapeHtml(profile.bio || "Bio professionale non ancora inserita.")}</p></section>
    ${hasOrganization ? `<section class="profile-section"><h3>Realtà rappresentata</h3><dl class="profile-facts"><div>${icon("building-2")}<span><dt>Agenzia / casa di produzione</dt><dd>${escapeHtml(profile.company_name)}</dd></span></div></dl></section>` : ""}
    ${secondary.length ? `<section class="profile-section"><h3>Competenze secondarie</h3><div class="tag-row">${secondary.map((role) => `<span>${escapeHtml(role)}</span>`).join("")}</div></section>` : ""}
    ${expertise.length ? `<section class="profile-section"><h3>Ambiti di specializzazione</h3><div class="tag-row">${expertise.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div></section>` : ""}
    <section class="profile-section"><h3>Dettagli operativi</h3><dl class="profile-facts"><div>${icon("plane")}<span><dt>Trasferte</dt><dd>${escapeHtml(profile.travel_area || "Da concordare")}</dd></span></div><div>${icon("camera")}<span><dt>Attrezzatura</dt><dd>${escapeHtml(profile.equipment || "Da chiedere")}</dd></span></div><div>${icon("tags")}<span><dt>Brand utilizzati</dt><dd>${escapeHtml((profile.brands || []).join(", ") || "Non indicati")}</dd></span></div></dl></section>
    ${(profile.portfolio_url || socialLinks.length) ? `<div class="profile-links">${profile.portfolio_url ? `<a class="secondary-button" href="${escapeHtml(profile.portfolio_url)}" target="_blank" rel="noopener">${icon("external-link")}Portfolio</a>` : ""}${socialLinks.map(([key, network, label]) => `<a class="social-icon-button" href="${escapeHtml(profile[key])}" target="_blank" rel="noopener" title="${label}" aria-label="${label}">${socialIcon(network)}</a>`).join("")}</div>` : ""}
    <button class="primary-button full-button profile-contact-button" type="button" data-request="${profile.id}">${icon("message-circle")}Contatta in chat</button>
    <section class="profile-section profile-reputation" id="publicReviews"><span>Caricamento affidabilità...</span></section>
  </article>`;
  redrawIcons();
  try {
    const reviews = await backend.publishedReviews(profile.id);
    const host = qs("#publicReviews");
    if (!host || state.selectedProfileId !== profile.id) return;
    updateProfileVerificationUi(qs("#profilePanel"), reviews);
    host.innerHTML = renderReliabilitySummary(profile, reviews);
    redrawIcons();
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
      notifyEvent({ type: "request", collaboration_id: collaboration.id });
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
      ${own ? `<div class="owner-post-actions"><div class="application-list"><strong>${post.post_applications?.length || 0} candidature</strong>${(post.post_applications || []).map((application) => `<div><span>${escapeHtml(application.applicant?.full_name || "Candidato")}</span>${application.status === "pending" ? `<button class="tiny-button" data-select-applicant="${application.id}">Seleziona</button>` : `<span>${escapeHtml(application.status)}</span>`}</div>`).join("")}</div><div class="owner-post-buttons"><button class="secondary-button" type="button" data-edit-post="${post.id}">${icon("pencil")}Modifica</button><button class="icon-danger-button" type="button" data-delete-post="${post.id}" title="Rimuovi annuncio" aria-label="Rimuovi annuncio">${icon("trash-2")}</button></div></div>` : `<button class="secondary-button" ${applied || post.status !== "open" ? "disabled" : ""} data-apply="${post.id}">${applied ? "Candidatura inviata" : "Candidati"}</button>`}
    </article>`;
  };
  const ownPosts = state.posts.filter((post) => post.owner_id === state.session?.user?.id);
  const communityPosts = state.posts.filter((post) => post.owner_id !== state.session?.user?.id);
  qs("#boardList").innerHTML = state.posts.length ? `<section class="board-group"><div class="board-group-title"><div><p class="eyebrow">GESTIONE</p><h3>Le tue richieste</h3></div><span>${ownPosts.length}</span></div>${ownPosts.length ? `<div class="board-group-grid">${ownPosts.map(postCard).join("")}</div>` : `<div class="empty-state compact">${icon("clipboard-list")}<strong>Non hai richieste aperte</strong></div>`}</section><section class="board-group"><div class="board-group-title"><div><p class="eyebrow">COMMUNITY</p><h3>Richieste degli altri professionisti</h3></div><span>${communityPosts.length}</span></div>${communityPosts.length ? `<div class="board-group-grid">${communityPosts.map(postCard).join("")}</div>` : `<div class="empty-state compact">${icon("users")}<strong>Nessuna richiesta della community</strong></div>`}</section>` : `<div class="empty-state">${icon("clipboard-list")}<strong>Nessuna richiesta aperta</strong><span>Pubblica la prima esigenza della community.</span></div>`;
}

function resetPostForm() {
  state.editingPostId = null;
  qs("#postForm").reset();
  qs("#postForm").classList.add("hidden");
  qs("#postFormSubmitLabel").textContent = "Pubblica";
  qs("#cancelPost").textContent = "Annulla";
  qs("#postDescriptionCount").textContent = "0/2000";
}

function openDeletePostModal(post) {
  state.pendingDeletePostId = post.id;
  qs("#deletePostSummary").innerHTML = `<strong>${escapeHtml(post.role?.name || post.other_role_name || "Ruolo da coprire")}</strong><span>${formatDate(post.work_date)} · ${escapeHtml(post.zone || "Zona non indicata")}${post.budget ? ` · ${escapeHtml(post.budget)} euro` : ""}</span>`;
  qs("#confirmDeletePost").disabled = false;
  qs("#deletePostBackdrop").classList.remove("hidden");
  document.body.classList.add("modal-open");
  redrawIcons();
}

function closeDeletePostModal() {
  state.pendingDeletePostId = null;
  qs("#deletePostBackdrop").classList.add("hidden");
  if (qsa(".modal-backdrop:not(.hidden), .chat-backdrop:not(.hidden), .mobile-notification-backdrop:not(.hidden)").length === 0) document.body.classList.remove("modal-open");
}

async function confirmDeletePost() {
  const postId = state.pendingDeletePostId;
  const post = state.posts.find((item) => item.id === postId && item.owner_id === state.session?.user?.id);
  if (!post) {
    closeDeletePostModal();
    return showToast("Puoi rimuovere solo le richieste che hai pubblicato.", true);
  }
  const button = qs("#confirmDeletePost");
  button.disabled = true;
  try {
    await backend.deletePost(post.id);
    if (state.editingPostId === post.id) resetPostForm();
    closeDeletePostModal();
    showToast("Annuncio rimosso dalla bacheca");
    await loadAppData();
  } catch (error) {
    button.disabled = false;
    showToast(errorMessage(error), true);
  }
}

async function createPost(event) {
  event.preventDefault();
  if (!ensureCrewBuilderEnabled()) return;
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

function otherParticipantId(collaboration) {
  if (!collaboration) return "";
  return collaboration.requester_id === state.session?.user?.id ? collaboration.professional_id : collaboration.requester_id;
}

function profileById(id) {
  if (!id) return null;
  if (state.profile?.id === id) return state.profile;
  return state.profiles.find((profile) => profile.id === id) || null;
}

function reviewAverage(review = {}) {
  return (Number(review.punctuality || 0) + Number(review.communication || 0) + Number(review.reliability || 0) + Number(review.organization || 0) + Number(review.problem_solving || 0)) / 5;
}

function collaborationTargetKind(collaboration, profileId) {
  if (!collaboration || !profileId) return "";
  if (collaboration.requester_id === profileId) return "builder";
  if (collaboration.professional_id === profileId) return "member";
  return "";
}

function reviewCollaboration(review = {}) {
  return review.collaboration || state.collaborations.find((item) => item.id === review.collaboration_id) || null;
}

function reviewTargetKind(review = {}, profile = {}) {
  const explicit = String(review.target_kind || review.review_kind || review.recipient_kind || review.context || "").toLowerCase();
  if (explicit.includes("builder")) return "builder";
  if (explicit.includes("member")) return "member";
  const targetId = review.recipient_id || profile.id;
  const fromCollaboration = collaborationTargetKind(reviewCollaboration(review), targetId);
  if (fromCollaboration) return fromCollaboration;
  return profile.account_type === "company" ? "builder" : "member";
}

function splitReliabilityReviews(reviews = [], profile = {}) {
  return reviews.reduce((groups, review) => {
    groups[reviewTargetKind(review, profile)].push(review);
    return groups;
  }, { member: [], builder: [] });
}

function reviewSummary(reviews = []) {
  const count = reviews.length;
  const rating = count ? reviews.reduce((sum, review) => sum + reviewAverage(review), 0) / count : 0;
  return { count, rating };
}

function profileVerificationFromFeedback(reviews = []) {
  const count = reviews.length;
  return {
    count,
    verified: count >= 3,
    label: count >= 3 ? "Verificato" : "In verifica",
    detail: count >= 3 ? "3+ feedback ricevuti" : `${count}/3 feedback ricevuti`,
  };
}

function reliabilityCard(kind, reviews = []) {
  const summary = reviewSummary(reviews);
  const label = kind === "builder" ? "Crew Builder" : "Crew Member";
  const copy = kind === "builder" ? "Affidabilità come referente di produzione" : "Affidabilità come collaboratore";
  const score = summary.count ? summary.rating.toFixed(1) : "-";
  const feedbackCopy = summary.count === 1 ? "1 feedback" : `${summary.count} feedback`;
  return `<article class="reliability-card ${summary.count ? "" : "empty"}"><span>${escapeHtml(label)}</span><strong>${score}${summary.count ? icon("star") : ""}</strong><small>${escapeHtml(feedbackCopy)}</small><p>${escapeHtml(copy)}</p></article>`;
}

function renderReliabilitySummary(profile, reviews = []) {
  const groups = splitReliabilityReviews(reviews, profile);
  const verification = profileVerificationFromFeedback(reviews);
  const reviewCards = reviews.slice(0, 6).map((review) => {
    const average = reviewAverage(review);
    const kind = reviewTargetKind(review, profile);
    const kindLabel = kind === "builder" ? "Crew Builder" : "Crew Member";
    return `<blockquote><div><strong>${average.toFixed(1)}</strong>${icon("star")}<span class="review-kind-chip">${escapeHtml(kindLabel)}</span></div><p>${escapeHtml(review.public_comment || "Collaborazione consigliata")}</p><footer>${escapeHtml(review.author_name)} · ${new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" }).format(new Date(review.created_at))}</footer></blockquote>`;
  }).join("");
  return reviews.length ? `<div class="reliability-summary"><div class="review-summary"><div><p class="eyebrow">Affidabilità Trankui</p><span class="review-score"><strong>${reviews.length}</strong>${icon("message-square-check")}</span><small>${verification.verified ? "Profilo verificato" : verification.detail}</small></div><p>${icon("eye-off")}I feedback diventano pubblici solo dopo la valutazione reciproca.</p></div><div class="reliability-grid">${reliabilityCard("member", groups.member)}${reliabilityCard("builder", groups.builder)}</div><div class="public-review-grid">${reviewCards}</div></div>` : `<div class="review-empty">${icon("star")}<div><strong>Nessun feedback pubblicato</strong><span>I feedback compariranno dopo una collaborazione valutata da entrambe le persone.</span></div></div>`;
}

function updateProfileVerificationUi(root, reviews = []) {
  const verification = profileVerificationFromFeedback(reviews);
  const eyebrow = qs("[data-profile-eyebrow]", root);
  if (eyebrow) eyebrow.textContent = verification.verified ? "Profilo verificato" : eyebrow.dataset.defaultLabel || "Profilo professionale";
  const status = qs("[data-profile-verification-state]", root);
  if (status) {
    status.querySelector("strong").textContent = verification.label;
    status.querySelector("small").textContent = verification.detail;
    const statusIcon = status.querySelector("svg");
    if (statusIcon) statusIcon.outerHTML = icon(verification.verified ? "badge-check" : "clock-3");
  }
}

function resolvedOtherParticipant(collaboration, messages = []) {
  const currentUserId = state.session?.user?.id;
  const known = otherParticipant(collaboration);
  const otherId = otherParticipantId(collaboration);
  const fromProfiles = profileById(otherId);
  const fromMessages = messages.find((message) => message.sender_id === otherId)?.sender
    || messages.find((message) => message.sender_id !== currentUserId)?.sender;
  const resolved = {
    id: otherId || known?.id || fromProfiles?.id || fromMessages?.id,
    ...(known || {}),
    ...(fromProfiles || {}),
    ...(fromMessages || {}),
  };
  return resolved.full_name || resolved.avatar_url || resolved.id ? resolved : null;
}

function updateChatHeader(collaboration, messages = [], related = []) {
  const other = resolvedOtherParticipant(collaboration, messages);
  const title = other?.full_name || "Collaboratore Trankui";
  qs("#chatTitle").textContent = title;
  qs("#chatAvatar").innerHTML = avatarContent(other || { full_name: title });
  const context = related.length > 1
    ? [`${related.length} collaborazioni`, collaboration?.zone, collaboration?.work_date ? `Ultima: ${formatDate(collaboration.work_date)}` : ""]
    : [collaboration?.role?.name || "Collaborazione", collaboration?.zone, collaboration?.work_date ? formatDate(collaboration.work_date) : ""];
  qs("#chatContext").textContent = context.filter(Boolean).join(" · ");
  renderChatInfoPanel(collaboration, messages, related);
}

function renderChatInfoPanel(collaboration, messages = [], related = []) {
  const panel = qs("#chatInfoPanel");
  if (!panel) return;
  const profile = resolvedOtherParticipant(collaboration, messages) || otherParticipant(collaboration) || {};
  const displayName = profileDisplayName(profile) || profile.full_name || "Professionista Trankui";
  const profileRole = profilePrimaryRole(profile);
  const role = profileRole && profileRole !== "Professionista" ? profileRole : (collaboration?.role?.name || profileRole || "Collaborazione");
  const location = [profile.city || collaboration?.zone, profile.region].filter(Boolean).join(", ") || "Zona da confermare";
  const years = Number(profile.years_experience);
  const experience = Number.isFinite(years) ? `${years} ${years === 1 ? "anno" : "anni"}` : "Da completare";
  const rows = [
    ["clapperboard", "Ruolo", role],
    ["map-pin", "Base", location],
    ["briefcase-business", "Esperienza", experience],
    ["shield-check", "Verifica", profile.verified ? "Identità verificata" : "Non ancora verificato"],
    ["messages-square", "Storico", `${Math.max(related.length, 1)} ${Math.max(related.length, 1) === 1 ? "collaborazione" : "collaborazioni"}`],
  ];
  panel.innerHTML = `<div class="chat-info-profile"><span class="avatar">${avatarContent({ ...profile, full_name: displayName })}</span><div><strong>${escapeHtml(displayName)}</strong><small>${escapeHtml(role)} · ${escapeHtml(location)}</small></div></div>
    <div class="chat-info-rows">${rows.map(([iconName, label, value]) => `<div>${icon(iconName)}<span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}</div>
    ${profile.id ? `<button class="secondary-button compact-button" type="button" data-open-profile="${escapeHtml(profile.id)}">${icon("user-round")}Vedi profilo</button>` : ""}`;
}

function setChatInfoOpen(open) {
  qs("#chatInfoPanel")?.classList.toggle("hidden", !open);
  qs("#chatInfoButton")?.setAttribute("aria-expanded", String(open));
}

function toggleChatInfoPanel() {
  const panel = qs("#chatInfoPanel");
  if (!panel) return;
  setChatInfoOpen(panel.classList.contains("hidden"));
}

function statusLabel(status) {
  return ({ open: "Aperta", closed: "Chiusa", pending: "In attesa", accepted: "Accettata", rejected: "Rifiutata", cancelled: "Annullata", completed: "Conclusa" })[status] || status;
}

function renderActivity() {
  const reviewedIds = new Set(state.reviews.map((review) => review.collaboration_id));
  const isArchived = (item) => state.archivedCollaborationIds.has(item.id);
  const userConfirmedComplete = (item) =>
    (item.requester_id === state.session?.user?.id && item.requester_completed) ||
    (item.professional_id === state.session?.user?.id && item.professional_completed);
  const needsReview = (item) => item.status === "completed" && !reviewedIds.has(item.id);
  const visible = state.collaborations.filter((item) => !isArchived(item));
  const archived = state.collaborations.filter(isArchived);
  const todo = visible.filter((item) => needsReview(item) || item.status === "pending" || (item.status === "accepted" && !userConfirmedComplete(item)));
  const active = visible.filter((item) => item.status === "accepted");
  const completed = visible.filter((item) => item.status === "completed");
  const filters = [
    ["todo", "Da gestire", todo.length],
    ["active", "In corso", active.length],
    ["completed", "Concluse", completed.length],
    ["archived", "Archiviate", archived.length],
  ];
  if (!filters.some(([key]) => key === state.activityFilter)) state.activityFilter = "todo";
  const selectedItems = ({ todo, active, completed, archived })[state.activityFilter] || todo;

  qs("#activitySummary").innerHTML = `<div class="activity-tabs" role="tablist" aria-label="Filtra attività">${filters.map(([key, label, count]) => `<button class="${state.activityFilter === key ? "active" : ""}" type="button" data-activity-filter="${key}" role="tab" aria-selected="${state.activityFilter === key}"><strong>${count}</strong><span>${label}</span></button>`).join("")}</div>`;

  const toReview = visible.filter(needsReview);
  qs("#feedbackQueue").innerHTML = toReview.length ? `<section class="activity-review-strip">${icon("star")}<div><strong>${toReview.length === 1 ? "Una collaborazione attende il tuo feedback" : `${toReview.length} collaborazioni attendono il tuo feedback`}</strong><span>Le recensioni restano blind finché anche l'altra persona non lascia il feedback.</span></div><button class="secondary-button" type="button" data-activity-filter="todo">Vai ai feedback</button></section>` : "";

  const emptyCopy = {
    todo: ["Tutto in ordine", "Non ci sono azioni aperte in questo momento."],
    active: ["Nessuna collaborazione in corso", "Le richieste accettate compariranno qui."],
    completed: ["Nessuna collaborazione conclusa", "Quando un lavoro viene chiuso, lo troverai qui prima di archiviarlo."],
    archived: ["Archivio vuoto", "Le collaborazioni concluse che archivi resteranno consultabili qui."],
  };
  qs("#requestList").innerHTML = selectedItems.length ? selectedItems.map((item) => {
    const other = otherParticipant(item);
    const incoming = item.professional_id === state.session?.user?.id;
    const archivedItem = isArchived(item);
    const actionHint = item.status === "pending" && incoming ? "Richiede risposta" : needsReview(item) ? "Feedback da lasciare" : item.status === "accepted" ? "Collaborazione attiva" : archivedItem ? "Archiviata" : statusLabel(item.status);
    return `<article class="request-card activity-card ${archivedItem ? "archived" : ""}"><div class="request-card-main"><button class="avatar avatar-button" type="button" data-open-profile="${other?.id || ""}">${avatarContent(other)}</button><div><div class="activity-card-title"><h3><button class="profile-name-button" type="button" data-open-profile="${other?.id || ""}">${escapeHtml(other?.full_name || "Professionista")}</button></h3><span class="status-chip">${escapeHtml(actionHint)}</span></div><span class="activity-meta">${escapeHtml(item.role?.name || "Collaborazione")} · ${formatDate(item.work_date)} · ${escapeHtml(item.zone)}</span><p>${escapeHtml(item.note || "Nessuna nota aggiunta.")}</p></div></div>
      <div class="request-actions activity-actions">
      ${item.status === "pending" && incoming ? `<button class="primary-button" data-transition="accepted" data-collaboration="${item.id}">Accetta</button><button class="secondary-button" data-transition="rejected" data-collaboration="${item.id}">Rifiuta</button>` : ""}
      ${item.status === "pending" && !incoming ? `<span class="completion-wait">${icon("clock")}In attesa di risposta</span>` : ""}
      ${item.status === "accepted" ? `<button class="secondary-button" data-chat="${item.id}">${icon("messages-square")}Chat</button>${userConfirmedComplete(item) ? `<span class="completion-wait">${icon("clock")}In attesa della conferma dell'altra persona</span>` : `<button class="primary-button" data-complete="${item.id}">Lavoro concluso</button>`}` : ""}
      ${needsReview(item) ? `<button class="primary-button" data-review="${item.id}">${icon("star")}Lascia feedback</button>` : ""}
      ${item.status === "completed" && !archivedItem ? `<button class="ghost-button icon-text-button" type="button" data-archive-collaboration="${item.id}">${icon("archive")}Archivia</button>` : ""}
      ${archivedItem ? `<button class="ghost-button icon-text-button" type="button" data-unarchive-collaboration="${item.id}">${icon("rotate-ccw")}Ripristina</button>` : ""}
      </div></article>`;
  }).join("") : `<div class="empty-state activity-empty">${icon(state.activityFilter === "archived" ? "archive" : "check-circle-2")}<strong>${emptyCopy[state.activityFilter][0]}</strong><span>${emptyCopy[state.activityFilter][1]}</span></div>`;
}

function notificationItems() {
  const lastRead = lastNotificationsReadAt();
  const topics = notificationPreferences().topics;
  const messages = !topics.messages ? [] : state.incomingMessages.filter((item) => item.created_at > lastRead).map((item) => ({
    type: "message", date: item.created_at, collaborationId: item.collaboration_id,
    title: "Nuovo messaggio su Trankui",
    detail: "Hai ricevuto un nuovo messaggio. Accedi a Trankui per leggerlo.",
  }));
  const requests = !topics.requests ? [] : state.collaborations.filter((item) =>
    item.status === "pending" && item.professional_id === state.session?.user?.id && item.created_at > lastRead
  ).map((item) => ({
    type: "request", date: item.created_at,
    title: `Nuova richiesta da ${item.requester?.full_name || "un professionista"}`,
    detail: `${item.role?.name || "Collaborazione"} · ${formatDate(item.work_date)}`,
  }));
  const feedback = !topics.reviews ? [] : state.receivedReviews.filter((item) => item.created_at > lastRead).map((item) => ({
    type: "feedback", date: item.created_at,
    title: `Nuovo feedback da ${item.author_name || "un collaboratore"}`,
    detail: item.public_comment || "Il feedback reciproco è ora visibile.",
  }));
  const reviewedIds = new Set(state.reviews.map((review) => review.collaboration_id));
  const reminders = !topics.reviews ? [] : state.collaborations.filter((item) => item.status === "completed" && !reviewedIds.has(item.id) && (item.completed_at || item.updated_at) > lastRead).map((item) => ({
    type: "review", date: item.completed_at || item.updated_at, collaborationId: item.id,
    title: `Lascia un feedback a ${otherParticipant(item)?.full_name || "un collaboratore"}`,
    detail: "La collaborazione risulta conclusa.",
  }));
  const matches = !topics.matches ? [] : state.collaborations.filter((item) =>
    ["accepted", "rejected", "cancelled"].includes(item.status) && (item.updated_at || item.created_at) > lastRead
  ).map((item) => ({
    type: "match", date: item.updated_at || item.created_at, collaborationId: item.id,
    title: `Match ${statusLabel(item.status).toLowerCase()} con ${otherParticipant(item)?.full_name || "un professionista"}`,
    detail: `${item.role?.name || "Collaborazione"} · ${formatDate(item.work_date)}`,
  }));
  return [...messages, ...requests, ...matches, ...feedback, ...reminders].sort((a, b) => new Date(b.date) - new Date(a.date));
}

function notificationSignature(items = notificationItems()) {
  return items.map((item) => `${item.type}:${item.collaborationId || ""}:${item.date}:${item.title}`).join("|");
}

function rememberCurrentNotifications() {
  state.lastNotificationSignature = notificationSignature();
}

function playNotificationTone() {
  if (!soundNotificationsEnabled()) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const audio = new AudioContext();
    const gain = audio.createGain();
    const first = audio.createOscillator();
    const second = audio.createOscillator();
    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, audio.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.32);
    first.frequency.value = 740;
    second.frequency.value = 980;
    first.connect(gain);
    second.connect(gain);
    gain.connect(audio.destination);
    first.start(audio.currentTime);
    first.stop(audio.currentTime + 0.16);
    second.start(audio.currentTime + 0.12);
    second.stop(audio.currentTime + 0.34);
  } catch (_) { /* Some browsers block audio until the user interacts. */ }
}

function showSystemNotification(item) {
  if (!notificationPreferences().channels.push || !("Notification" in window) || Notification.permission !== "granted" || !document.hidden) return;
  const title = item.type === "message" ? "Nuovo messaggio su Trankui" : item.title;
  const body = item.type === "message" ? "Hai ricevuto un nuovo messaggio. Accedi a Trankui per leggerlo." : item.detail;
  new Notification(title, { body, icon: "./clipboard.png?v=20260706-official-logo", badge: "./clipboard.png?v=20260706-official-logo" });
}

function announceNewNotifications(previousSignature) {
  const items = notificationItems();
  const nextSignature = notificationSignature(items);
  if (previousSignature && nextSignature && previousSignature !== nextSignature && items[0]) {
    playNotificationTone();
    showSystemNotification(items[0]);
  }
  state.lastNotificationSignature = nextSignature;
}

function notificationPermissionCopy() {
  if (!("Notification" in window)) return "Questo browser non supporta notifiche native.";
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return "Questo browser supporta solo gli avvisi quando Trankui è aperto.";
  if (!window.TRANKUI_CONFIG?.vapidPublicKey) return "Notifiche mobile in configurazione.";
  if (Notification.permission === "granted") return "Push mobile e browser attivi per questo dispositivo.";
  if (Notification.permission === "denied") return "Notifiche bloccate dal browser. Puoi riattivarle dalle impostazioni del sito.";
  return "Attiva le notifiche per ricevere avvisi quando arrivano richieste o risposte.";
}

function renderNotificationSettings() {
  const preferences = notificationPreferences();
  const push = qs("#pushNotifications");
  if (push) push.checked = Boolean(preferences.channels.push && "Notification" in window && Notification.permission === "granted");
  const sound = qs("#soundNotifications");
  if (sound) sound.checked = Boolean(preferences.channels.sound);
  const email = qs("#emailNotifications");
  if (email) email.checked = Boolean(preferences.channels.email);
  qsa("[data-notification-topic]").forEach((input) => {
    input.checked = preferences.topics[input.dataset.notificationTopic] !== false;
  });
  const permission = qs("#notificationPermissionState");
  if (permission) permission.textContent = notificationPermissionCopy();
}

function notificationListMarkup(items) {
  return items.length
    ? items.map((item) => `<button class="notification-item" type="button" data-notification-type="${item.type}" ${item.collaborationId ? `data-notification-collaboration="${item.collaborationId}"` : ""}>${icon(item.type === "message" ? "message-circle" : item.type === "feedback" || item.type === "review" ? "star" : item.type === "match" ? "handshake" : "user-plus")}<span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small></span></button>`).join("")
    : `<div class="notification-empty">${icon("bell-check")}<span>Nessuna nuova notifica.</span></div>`;
}

function renderNotifications() {
  const items = notificationItems();
  const summary = items.length ? `${items.length} ${items.length === 1 ? "aggiornamento" : "aggiornamenti"}` : "Tutto aggiornato";
  const listMarkup = notificationListMarkup(items);
  const badge = qs("#notificationBadge");
  badge.textContent = items.length > 99 ? "99+" : String(items.length);
  badge.classList.toggle("hidden", !items.length);
  const mobileBadge = qs("#mobileMenuNotificationBadge");
  mobileBadge.textContent = items.length > 99 ? "99+" : String(items.length);
  mobileBadge.classList.toggle("hidden", !items.length);
  qs("#notificationSummary").textContent = summary;
  qs("#notificationList").innerHTML = listMarkup;
  const mobileSummary = qs("#mobileNotificationSummary");
  if (mobileSummary) mobileSummary.textContent = summary;
  const mobileList = qs("#mobileNotificationList");
  if (mobileList) mobileList.innerHTML = listMarkup;
  renderNotificationSettings();
  redrawIcons();
}

function collaborationSortDate(item) {
  return new Date(item.updated_at || item.created_at || item.work_date || 0).getTime();
}

function chatPeerKey(collaboration) {
  const peerId = otherParticipantId(collaboration);
  if (peerId) return `profile:${peerId}`;
  const fallbackName = (otherParticipant(collaboration)?.full_name || "").trim().toLowerCase();
  return fallbackName ? `name:${fallbackName}` : `collaboration:${collaboration?.id || ""}`;
}

function chatGroupForPeer(peerKey) {
  const items = state.collaborations
    .filter((item) => ["pending", "accepted", "completed"].includes(item.status) && chatPeerKey(item) === peerKey)
    .sort((a, b) => {
      const statusWeight = (item) => item.status === "accepted" ? 3 : item.status === "pending" ? 2 : 1;
      return statusWeight(b) - statusWeight(a) || collaborationSortDate(b) - collaborationSortDate(a);
    });
  const ids = new Set(items.map((item) => item.id));
  const lastMessage = state.recentMessages.find((message) => ids.has(message.collaboration_id));
  const unread = state.incomingMessages.filter((message) => ids.has(message.collaboration_id) && message.created_at > lastNotificationsReadAt()).length;
  return { peerKey, items, primary: items[0], ids, lastMessage, unread };
}

function chatGroups() {
  const peerKeys = new Set();
  state.collaborations
    .filter((item) => ["pending", "accepted", "completed"].includes(item.status))
    .forEach((item) => peerKeys.add(chatPeerKey(item)));
  return [...peerKeys].map(chatGroupForPeer).filter((group) => group.primary)
    .sort((a, b) => {
      const aDate = a.lastMessage?.created_at || a.primary?.updated_at || a.primary?.created_at || a.primary?.work_date;
      const bDate = b.lastMessage?.created_at || b.primary?.updated_at || b.primary?.created_at || b.primary?.work_date;
      return new Date(bDate || 0) - new Date(aDate || 0);
    });
}

function renderChatPage() {
  const host = qs("#chatThreadList");
  if (!host) return;
  const currentUserId = state.session?.user?.id;
  const groups = chatGroups();
  host.innerHTML = groups.length ? groups.map(({ primary, items, lastMessage, unread }) => {
    const other = resolvedOtherParticipant(primary, lastMessage ? [lastMessage] : []) || otherParticipant(primary);
    const status = items.length > 1 ? `${items.length} collaborazioni` : primary.status === "pending" && primary.professional_id === state.session?.user?.id ? "Richiesta ricevuta" : statusLabel(primary.status);
    const preview = lastMessage ? `${lastMessage.sender_id === currentUserId ? "Tu: " : ""}${lastMessage.body}` : primary.note || "Apri la conversazione per scrivere un messaggio.";
    const when = lastMessage?.created_at ? new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(lastMessage.created_at)) : "";
    return `<button class="chat-thread-card" type="button" data-chat="${primary.id}">
      <span class="avatar chat-thread-avatar">${avatarContent(other)}</span>
      <span class="chat-thread-body"><strong>${escapeHtml(other?.full_name || "Professionista")}</strong><small>${escapeHtml(primary.role?.name || "Collaborazione")} · ${formatDate(primary.work_date)} · ${escapeHtml(primary.zone)}</small><em>${escapeHtml(preview)}</em></span>
      <span class="chat-thread-side">${when ? `<time>${escapeHtml(when)}</time>` : ""}<span class="status-chip">${escapeHtml(status)}</span>${unread ? `<b>${unread > 9 ? "9+" : unread}</b>` : ""}</span>
    </button>`;
  }).join("") : `<div class="empty-state chat-empty-state">${icon("message-circle")}<strong>Nessuna conversazione attiva</strong><span>Quando contatti un professionista o ricevi una richiesta, la chat comparirà qui.</span></div>`;
  renderNotificationSettings();
}

async function openChat(collaborationId) {
  try {
    const collaboration = state.collaborations.find((item) => item.id === collaborationId);
    if (!collaboration) throw new Error("Conversazione non disponibile. Aggiorna la pagina e riprova.");
    const peerKey = chatPeerKey(collaboration);
    const group = chatGroupForPeer(peerKey);
    const related = group.items.length ? group.items : [collaboration];
    state.activeChatId = group.primary?.id || collaborationId;
    state.activeChatIds = related.map((item) => item.id);
    state.activeChatPeerId = peerKey;
    setChatInfoOpen(false);
    updateChatHeader(group.primary || collaboration, [], related);
    qs("#chatBackdrop").classList.remove("hidden");
    document.body.classList.add("modal-open");
    await refreshChat();
    state.chatSubscriptions.forEach((subscription) => subscription?.unsubscribe?.());
    state.chatSubscriptions = state.activeChatIds.map((id) => backend.subscribeToMessages(id, refreshChat));
    qs("#chatInput").focus();
    redrawIcons();
  } catch (error) {
    showToast(errorMessage(error), true);
  }
}

async function refreshChat() {
  if (!state.activeChatId) return;
  const activeIds = state.activeChatIds.length ? state.activeChatIds : [state.activeChatId];
  const related = activeIds.map((id) => state.collaborations.find((item) => item.id === id)).filter(Boolean);
  const messageGroups = await Promise.all(activeIds.map(async (id) => {
    const collaboration = state.collaborations.find((item) => item.id === id);
    const messages = await backend.messages(id);
    return messages.map((message) => ({ ...message, collaboration }));
  }));
  const messages = messageGroups.flat().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const collaboration = related[0] || state.collaborations.find((item) => item.id === state.activeChatId);
  if (collaboration) updateChatHeader(collaboration, messages, related);
  const currentUserId = state.session?.user?.id;
  let previousCollaborationId = "";
  qs("#chatMessages").innerHTML = messages.length ? messages.map((message) => {
    const mine = message.sender_id === currentUserId;
    const time = new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" }).format(new Date(message.created_at));
    const marker = related.length > 1 && message.collaboration_id !== previousCollaborationId
      ? `<div class="chat-context-marker">${escapeHtml(message.collaboration?.role?.name || "Collaborazione")} · ${message.collaboration?.work_date ? formatDate(message.collaboration.work_date) : ""}</div>`
      : "";
    previousCollaborationId = message.collaboration_id;
    return `${marker}<div class="chat-row ${mine ? "mine" : "theirs"}"><div class="chat-bubble"><p>${escapeHtml(message.body)}</p><time>${time}</time></div></div>`;
  }).join("") : `<div class="chat-empty">${icon("messages-square")}<strong>Inizia la conversazione</strong><span>Condividi call time, dettagli operativi e prossimi passi.</span></div>`;
  const panel = qs("#chatMessages");
  panel.scrollTop = panel.scrollHeight;
  redrawIcons();
}

function closeChat() {
  state.chatSubscriptions.forEach((subscription) => subscription?.unsubscribe?.());
  state.chatSubscriptions = [];
  state.activeChatId = null;
  state.activeChatIds = [];
  state.activeChatPeerId = null;
  setChatInfoOpen(false);
  qs("#chatBackdrop").classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function openReview(collaborationId) {
  const collaboration = state.collaborations.find((item) => item.id === collaborationId);
  if (!collaboration) return showToast("Collaborazione non disponibile. Aggiorna la pagina e riprova.", true);
  const recipient = otherParticipant(collaboration);
  if (!recipient?.id) return showToast("Non riesco a identificare il collaboratore.", true);
  const targetKind = collaborationTargetKind(collaboration, recipient.id);
  const isBuilderReview = targetKind === "builder";
  const labels = isBuilderReview
    ? { punctuality: "Chiarezza brief", communication: "Comunicazione", reliability: "Rispetto accordi", organization: "Organizzazione", problem_solving: "Gestione imprevisti" }
    : { punctuality: "Puntualità", communication: "Comunicazione", reliability: "Affidabilità", organization: "Organizzazione", problem_solving: "Problem solving" };
  state.activeReviewId = collaborationId;
  qs("#reviewTitle").textContent = `Com'è andata con ${recipient?.full_name || "il collaboratore"}?`;
  qs("#reviewContext").textContent = `${isBuilderReview ? "Crew Builder · Affidabilità come referente di produzione" : "Crew Member · Affidabilità come collaboratore"} · ${collaboration?.role?.name || "Collaborazione"} · ${formatDate(collaboration.work_date)}`;
  qsa("[data-review-label]").forEach((label) => { label.textContent = labels[label.dataset.reviewLabel] || label.textContent; });
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
    const review = await backend.submitReview({
      collaboration_id: collaboration.id, recipient_id: recipient.id, recommend: form.get("recommend") === "on",
      punctuality: Number(form.get("punctuality")), communication: Number(form.get("communication")),
      reliability: Number(form.get("reliability")), organization: Number(form.get("organization")),
      problem_solving: Number(form.get("problem_solving")), public_comment: form.get("public_comment").trim(), private_note: form.get("private_note").trim(),
    });
    if (review?.id) notifyEvent({ type: "review", review_id: review.id });
    closeReview();
    formElement.reset();
    showToast("Feedback salvato. Sarà visibile dopo la valutazione reciproca.");
    await loadAppData();
  } catch (error) {
    showToast(errorMessage(error), true);
  } finally {
    button.disabled = false;
    button.querySelector("span").textContent = "Invia feedback";
  }
}

function monthDays() {
  return monthDaysFor(state.month);
}

function renderCalendar() {
  const ownAvailability = new Map(state.availability.filter((item) => item.profile_id === state.session?.user?.id).map((item) => [item.work_date, item.status]));
  const labels = { available: "Disponibile", maybe: "Forse", busy: "Occupato" };
  const monthName = new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" }).format(state.month);
  const selectedCount = state.selectedAvailabilityDates.size;
  qs("#availabilityGrid").innerHTML = `<div class="availability-toolbar"><div><span class="toolbar-label">Segna le giornate come</span><div class="availability-modes">${Object.entries(labels).map(([value, label]) => `<button class="availability-mode ${state.availabilityMode === value ? "active" : ""}" data-mode="${value}"><span class="mode-dot ${value}"></span>${label}</button>`).join("")}</div></div><p>Seleziona uno stato, scegli uno o più giorni e poi applica la modifica.</p></div>
    <div class="month-calendar"><div class="month-calendar-head"><button class="calendar-arrow" data-month="-1" title="Mese precedente">${icon("chevron-left")}</button><h3>${monthName}</h3><button class="calendar-arrow" data-month="1" title="Mese successivo">${icon("chevron-right")}</button></div>
    <div class="calendar-weekdays">${["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((day) => `<span>${day}</span>`).join("")}</div>
    <div class="calendar-month-grid">${monthDays().map((date) => date ? `<button class="calendar-day ${ownAvailability.get(isoDate(date)) || ""} ${state.selectedAvailabilityDates.has(isoDate(date)) ? "pending" : ""} ${isoDate(date) === isoDate(new Date()) ? "today" : ""}" data-day="${isoDate(date)}" title="${state.selectedAvailabilityDates.has(isoDate(date)) ? "Selezionato" : labels[ownAvailability.get(isoDate(date))] || "Nessuno stato"}"><span>${date.getDate()}</span></button>` : `<span class="calendar-empty"></span>`).join("")}</div>
    <div class="calendar-selection-bar ${selectedCount ? "" : "is-empty"}"><span>${selectedCount ? `${selectedCount} ${selectedCount === 1 ? "giorno selezionato" : "giorni selezionati"}` : "Nessun giorno selezionato"}</span><div><button class="ghost-button" type="button" data-availability-clear ${selectedCount ? "" : "disabled"}>Annulla selezione</button><button class="primary-button" type="button" data-availability-apply ${selectedCount ? "" : "disabled"}>${icon("check")}Applica</button></div></div>
    <div class="calendar-legend"><span><i class="legend-dot available"></i>Disponibile</span><span><i class="legend-dot maybe"></i>Forse</span><span><i class="legend-dot busy"></i>Occupato</span><span><i class="legend-ring"></i>Selezionato</span></div></div>`;
}

async function setDayAvailability(date) {
  if (state.selectedAvailabilityDates.has(date)) state.selectedAvailabilityDates.delete(date);
  else state.selectedAvailabilityDates.add(date);
  renderCalendar();
  redrawIcons();
}

async function applySelectedAvailability() {
  const dates = [...state.selectedAvailabilityDates];
  if (!dates.length) return;
  try {
    const results = await Promise.all(dates.map((date) => backend.setAvailability(date, state.availabilityMode)));
    results.forEach((result) => {
      const index = state.availability.findIndex((item) => item.profile_id === result.profile_id && item.work_date === result.work_date);
      if (index >= 0) state.availability[index] = result; else state.availability.push(result);
    });
    state.selectedAvailabilityDates.clear();
    renderCalendar();
    redrawIcons();
    showToast(`${dates.length} ${dates.length === 1 ? "giorno aggiornato" : "giorni aggiornati"}`);
  } catch (error) {
    showToast(errorMessage(error), true);
  }
}

function clearSelectedAvailability() {
  state.selectedAvailabilityDates.clear();
  renderCalendar();
  redrawIcons();
}

function profileDisplayName(profile = {}) {
  return profile.full_name || "";
}

function profilePrimaryRole(profile = {}) {
  return roleById(profile.primary_role_id)?.name || profile.primary_other_role_name || "Professionista";
}

function ownSecondaryRoleNames(profile = {}) {
  return (profile.secondaryRoles || profile.secondary_roles || []).map((item) => item.roles?.name || item.other_role_name).filter(Boolean);
}

function profileSocialLinks(profile = {}) {
  return [["instagram_url", "instagram", "Instagram"], ["facebook_url", "facebook", "Facebook"], ["tiktok_url", "tiktok", "TikTok"], ["linkedin_url", "linkedin", "LinkedIn"]]
    .filter(([key]) => profile[key] && profile[key] !== "null");
}

function profileBadges(profile = {}) {
  return (profile.badges || []).filter((badge) => badge?.slug && badge?.name);
}

function profileBadgeTooltip(badge = {}) {
  if (badge.slug === "crew-zero") return "Crew Zero • Primo membro della Beta privata di Trankui";
  return badge.description || badge.name;
}

function profileBadgeRow(profile = {}, variant = "") {
  const badges = profileBadges(profile);
  if (!badges.length) return "";
  return `<div class="profile-badge-row ${variant ? `profile-badge-row-${variant}` : ""}">${badges.map((badge) => `<span class="profile-badge-chip" title="${escapeHtml(profileBadgeTooltip(badge))}">${icon(badge.icon || "badge")}${escapeHtml(badge.name)}</span>`).join("")}</div>`;
}

function profileBadgeMini(profile = {}) {
  const crewZero = profileBadges(profile).find((badge) => badge.slug === "crew-zero");
  return crewZero ? `<span class="crew-zero-chip" title="${escapeHtml(profileBadgeTooltip(crewZero))}">${icon(crewZero.icon || "sparkles")}${escapeHtml(crewZero.name)}</span>` : "";
}

function profileVisibility(profile = {}) {
  const phoneVisibility = profile.phone_visibility === "match" ? "match" : "never";
  const legacySocialVisibility = [profile.show_instagram, profile.show_facebook, profile.show_tiktok, profile.show_linkedin]
    .every((value) => value !== false);
  const showSocialLinks = profile.show_social_links == null
    ? legacySocialVisibility
    : profile.show_social_links !== false;
  return {
    show_portfolio: profile.show_portfolio !== false,
    show_social_links: showSocialLinks,
    show_instagram: showSocialLinks,
    show_facebook: showSocialLinks,
    show_tiktok: showSocialLinks,
    show_linkedin: showSocialLinks,
    allow_chat_contact: profile.allow_chat_contact !== false,
    allow_matching_improvement: profile.allow_matching_improvement !== false,
    phone_visibility: phoneVisibility,
  };
}

function profileModesFromValue(value, accountType = "freelance") {
  const rawModes = Array.isArray(value)
    ? value
    : String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
  const normalized = rawModes.map((item) => item.toLowerCase());
  if (!normalized.length) return ["member", "builder"];
  const modes = [];
  if (normalized.includes("member") || normalized.includes("crew_member")) modes.push("member");
  if (normalized.includes("builder") || normalized.includes("crew_builder")) modes.push("builder");
  return modes.length ? [...new Set(modes)] : ["member", "builder"];
}

function profileUsageModes(profile = {}) {
  const hasExplicitMember = typeof profile.can_work_as_member === "boolean";
  const hasExplicitBuilder = typeof profile.can_work_as_builder === "boolean";
  if (hasExplicitMember || hasExplicitBuilder) {
    const modes = [];
    if (profile.can_work_as_member !== false) modes.push("member");
    if (profile.can_work_as_builder !== false) modes.push("builder");
    return modes.length ? modes : ["member"];
  }
  return profileModesFromValue(profile.profile_modes, profile.account_type || "freelance");
}

function workspaceModeStorageKey() {
  return `trankui:v1:workspace-mode:${state.session?.user?.id || "guest"}`;
}

function modeLabel(mode) {
  return mode === "builder" ? "Crew Builder" : "Crew Member";
}

function canBuildCrew(profile = state.profile || {}) {
  return profileUsageModes(profile).includes("builder");
}

function canJoinCrew(profile = state.profile || {}) {
  return profileUsageModes(profile).includes("member");
}

function ensureCrewBuilderEnabled() {
  if (canBuildCrew()) return true;
  showToast("Per pubblicare richieste attiva la modalità Crew Builder nel profilo.", true);
  switchView("profile");
  state.profileEditing = true;
  renderProfileForm();
  redrawIcons();
  return false;
}

function ensureCrewMemberEnabled() {
  if (canJoinCrew()) return true;
  showToast("Per candidarti attiva la modalità Crew Member nel profilo.", true);
  switchView("profile");
  state.profileEditing = true;
  renderProfileForm();
  redrawIcons();
  return false;
}

function profileModeChips(profile = {}) {
  const modes = profileUsageModes(profile);
  return `<div class="mode-chip-row">${modes.map((mode) => `<span class="mode-chip mode-chip-${mode}">${icon(mode === "builder" ? "users-round" : "user-round-check")}${modeLabel(mode)}</span>`).join("")}</div>`;
}

function syncWorkspaceSwitch() {
  const modes = profileUsageModes(state.profile || {});
  const shortcut = qs("#workspaceModeShortcut");
  if (shortcut) {
    const target = state.workspaceMode === "builder" && modes.includes("member") ? "member" : modes.includes("builder") ? "builder" : modes.find((mode) => mode !== state.workspaceMode);
    const enabled = Boolean(target && target !== state.workspaceMode && modes.includes(target));
    shortcut.hidden = !enabled;
    shortcut.disabled = !enabled;
    if (target) {
      shortcut.dataset.workspaceMode = target;
      shortcut.textContent = `Passa a ${modeLabel(target)}`;
      shortcut.title = `Passa a ${modeLabel(target)}`;
    }
  }
  qsa("button[data-workspace-mode]").forEach((button) => {
    const enabled = modes.includes(button.dataset.workspaceMode);
    button.classList.toggle("active", button.dataset.workspaceMode === state.workspaceMode);
    button.disabled = !enabled;
    button.setAttribute("aria-pressed", String(button.dataset.workspaceMode === state.workspaceMode));
    button.title = enabled ? `Passa a ${modeLabel(button.dataset.workspaceMode)}` : "Modalità non abilitata nel profilo";
  });
  document.body.dataset.workspaceMode = state.workspaceMode;
}

function hydrateWorkspaceMode() {
  const modes = profileUsageModes(state.profile || {});
  const stored = localStorage.getItem(workspaceModeStorageKey());
  const preferred = modes.includes(stored) ? stored : modes.includes("member") ? "member" : "builder";
  state.workspaceMode = preferred;
  syncWorkspaceSwitch();
}

function setWorkspaceMode(mode, options = {}) {
  const modes = profileUsageModes(state.profile || {});
  const next = modes.includes(mode) ? mode : modes.includes("member") ? "member" : "builder";
  state.workspaceMode = next;
  if (state.session?.user?.id) localStorage.setItem(workspaceModeStorageKey(), next);
  syncWorkspaceSwitch();
  if (options.navigate) switchView(next === "builder" ? "search" : "board");
  redrawIcons();
}

function visibleProfileSocialLinks(profile = {}) {
  const visibility = profileVisibility(profile);
  return visibility.show_social_links ? profileSocialLinks(profile) : [];
}

function phoneVisibilityLabel(value) {
  return value === "match" ? "Mostra solo dopo un match" : "Non mostrare mai";
}

function privacySwitch(name, title, description, checked, iconName = "") {
  return `<label class="privacy-toggle">${iconName ? `<span class="privacy-toggle-icon">${icon(iconName)}</span>` : ""}<span class="privacy-toggle-copy"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(description)}</small></span><input type="checkbox" name="${name}" ${checked ? "checked" : ""} /><i></i></label>`;
}

function profileValue(value, fallback = "Da completare") {
  const clean = value == null || value === "null" || value === "undefined" || value === "" ? "" : String(value);
  if (!clean) return `<span class="profile-empty-value">${fallback}</span>`;
  return clean.startsWith("<a ") ? clean : escapeHtml(clean);
}

function profileTagRow(items, emptyText) {
  return items.length
    ? `<div class="profile-chip-row">${items.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>`
    : `<span class="profile-empty-value">${emptyText}</span>`;
}

function profileOnboardingSteps(profile = state.profile || {}) {
  const displayName = profileDisplayName(profile);
  const socialLinks = profileSocialLinks(profile);
  const hasLocation = profile.region && profile.city;
  const hasRole = Boolean(profile.primary_role_id || profile.primary_other_role_name);
  const hasAvailability = Boolean(profile.availability_visible);
  return [
    {
      icon: "user-round",
      title: "Identità professionale",
      body: "Foto e nome chiari rendono il profilo riconoscibile e più affidabile nei primi secondi. Se rappresenti una realtà, puoi indicarla nel profilo.",
      complete: Boolean(displayName && profile.avatar_url),
      action: "Completa identità",
    },
    {
      icon: "clapperboard",
      title: "Ruolo e zona",
      body: "Ruolo principale, regione e provincia sono i dati minimi per comparire nelle ricerche pertinenti.",
      complete: Boolean(hasRole && hasLocation),
      action: "Aggiorna ruolo e zona",
    },
    {
      icon: "sparkles",
      title: "Esperienza e posizionamento",
      body: "Bio, anni di esperienza e trasferte raccontano come lavori prima ancora di aprire una chat.",
      complete: Boolean(profile.bio && Number(profile.years_experience || 0) >= 0 && profile.travel_area),
      action: "Aggiungi esperienza",
    },
    {
      icon: "link",
      title: "Portfolio e social",
      body: "Inserisci portfolio, sito o social professionali per rendere verificabile il tuo lavoro.",
      complete: Boolean(profile.portfolio_url || profile.company_website || socialLinks.length),
      action: "Collega i tuoi link",
    },
    {
      icon: "calendar-check",
      title: "Disponibilità",
      body: "Rendi il profilo visibile nelle ricerche e aggiorna le date in cui puoi lavorare.",
      complete: hasAvailability,
      action: "Aggiorna disponibilità",
      go: "calendar",
    },
  ];
}

function renderProfileOnboarding() {
  const host = qs("#profileOnboarding");
  if (!host) return;
  if (state.profileEditing) {
    host.classList.add("hidden");
    host.innerHTML = "";
    return;
  }
  const profile = state.profile || {};
  const steps = profileOnboardingSteps(profile);
  const completed = steps.filter((step) => step.complete).length;
  const isDone = completed === steps.length && profile.profile_status === "active";
  host.classList.toggle("hidden", isDone);
  if (isDone) {
    host.innerHTML = "";
    return;
  }
  state.onboardingStep = Math.min(state.onboardingStep, steps.length - 1);
  const current = steps[state.onboardingStep] || steps[0];
  const progress = Math.round((completed / steps.length) * 100);
  host.innerHTML = `<div class="profile-onboarding-card">
    <div class="profile-onboarding-copy">
      <p class="eyebrow">Setup profilo</p>
      <h3>${completed ? `Profilo completo al ${progress}%` : "Completa il tuo profilo"}</h3>
      <span>Segui questi passaggi per essere trovato meglio e dare più fiducia a chi sta costruendo una crew.</span>
    </div>
    <div class="onboarding-progress" aria-label="Completamento profilo"><span style="width:${progress}%"></span></div>
    <div class="onboarding-slide">
      <div class="onboarding-icon">${icon(current.icon)}</div>
      <div><span class="status-chip">${current.complete ? "Completato" : "Da completare"}</span><h4>${escapeHtml(current.title)}</h4><p>${escapeHtml(current.body)}</p></div>
    </div>
    <div class="onboarding-actions">
      <button class="ghost-button" type="button" data-onboarding-prev>${icon("chevron-left")}Indietro</button>
      <div class="onboarding-dots">${steps.map((step, index) => `<button class="${index === state.onboardingStep ? "active" : ""} ${step.complete ? "done" : ""}" type="button" data-onboarding-step="${index}" aria-label="Passaggio ${index + 1}"></button>`).join("")}</div>
      <button class="ghost-button" type="button" data-onboarding-next>Avanti${icon("chevron-right")}</button>
      <button class="primary-button" type="button" ${current.go ? `data-go="${current.go}"` : "data-profile-edit"}>${icon(current.go ? "calendar-days" : "pencil")}${escapeHtml(current.action)}</button>
    </div>
  </div>`;
}

function renderProfileOverview(profile = state.profile || {}) {
  const host = qs("#profileOverview");
  if (!host) return;
  const displayName = profileDisplayName(profile) || "Profilo Trankui";
  const primary = profilePrimaryRole(profile);
  const secondaryNames = ownSecondaryRoleNames(profile);
  const expertise = (profile.production_types || []).filter(Boolean);
  const brands = (profile.brands || []).filter(Boolean);
  const socialLinks = profileSocialLinks(profile);
  const googleConnected = state.calendarConnections.some((item) => item.provider === "google" && item.status === "connected");
  const connectedCalendars = [googleConnected ? "Google Calendar" : ""].filter(Boolean);
  const profileRows = [
    ["clapperboard", "Ruolo principale", primary],
    ...(profile.company_name ? [["building-2", "Agenzia / casa di produzione", profile.company_name]] : []),
    ["toggle-right", "Uso Trankui come", profileUsageModes(profile).map(modeLabel).join(" + ")],
    ["map-pin", "Dove lavori", [profile.city, profile.region].filter(Boolean).join(", ")],
    ["briefcase-business", "Anni di esperienza", `${Number(profile.years_experience || 0)} anni`],
    ["plane", "Trasferte", profile.travel_area],
    ["camera", "Attrezzatura", profile.equipment],
    ["tags", "Brand utilizzati", brands.join(", ")],
    ["globe", "Portfolio", profile.portfolio_url ? `<a href="${escapeHtml(profile.portfolio_url)}" target="_blank" rel="noopener">Apri link</a>` : ""],
    ["calendar-check", "Calendario", connectedCalendars.length ? connectedCalendars.join(" + ") : "Non collegato"],
    ["eye", "Visibilità ricerca", profile.availability_visible ? "Profilo visibile quando disponibile" : "Non ancora visibile per disponibilità"],
    ["shield-check", "Stato profilo", profile.profile_status === "active" ? "Attivo" : "Bozza da completare"],
  ];
  host.innerHTML = `<div class="profile-overview-shell">
    <aside class="profile-overview-identity">
      <div class="avatar profile-overview-avatar">${profile.avatar_url ? `<img src="${escapeHtml(profile.avatar_url)}" alt="Foto profilo" />` : initials(displayName)}</div>
      <button class="secondary-button compact-button" type="button" data-profile-edit>${icon("pencil")}Modifica</button>
      <button class="ghost-button compact-button" type="button" data-profile-preview>${icon("eye")}Anteprima pubblica</button>
    </aside>
    <div class="profile-overview-main">
      <div class="profile-overview-title">
        <p class="eyebrow">Profilo professionale</p>
        <h3>${escapeHtml(displayName)}</h3>
        <span>${escapeHtml(primary)}${profile.city ? ` · ${escapeHtml(profile.city)}` : ""}</span>
        ${profileModeChips(profile)}
        ${profileBadgeRow(profile, "overview")}
      </div>
      <div class="profile-info-list">${profileRows.map(([iconName, label, value]) => `<div class="profile-info-row">${icon(iconName)}<span>${label}</span><strong>${profileValue(value)}</strong></div>`).join("")}</div>
    </div>
  </div>
  <section class="profile-read-section">
    <div class="profile-read-section-head"><h3>Chi sono</h3><button class="text-button" type="button" data-profile-edit>Modifica</button></div>
    <p class="profile-read-bio">${profile.bio ? escapeHtml(profile.bio) : "Aggiungi una descrizione chiara del tuo modo di lavorare, delle produzioni che segui e del tipo di crew con cui collabori meglio."}</p>
  </section>
  <section class="profile-read-grid">
    <div class="profile-read-section"><div class="profile-read-section-head"><h3>Competenze secondarie</h3><button class="text-button" type="button" data-profile-edit>Modifica</button></div>${profileTagRow(secondaryNames, "Nessuna competenza secondaria selezionata")}</div>
    <div class="profile-read-section"><div class="profile-read-section-head"><h3>Ambiti di specializzazione</h3><button class="text-button" type="button" data-profile-edit>Modifica</button></div>${profileTagRow(expertise, "Nessun ambito selezionato")}</div>
  </section>
  <section class="profile-read-section">
    <div class="profile-read-section-head"><h3>Link e social</h3><button class="text-button" type="button" data-profile-edit>Modifica</button></div>
    ${(profile.portfolio_url || socialLinks.length) ? `<div class="profile-links profile-read-links">${profile.portfolio_url ? `<a class="secondary-button" href="${escapeHtml(profile.portfolio_url)}" target="_blank" rel="noopener">${icon("external-link")}Portfolio</a>` : ""}${socialLinks.map(([key, network, label]) => `<a class="social-icon-button" href="${escapeHtml(profile[key])}" target="_blank" rel="noopener" title="${label}" aria-label="${label}">${socialIcon(network)}</a>`).join("")}</div>` : `<span class="profile-empty-value">Nessun link inserito</span>`}
  </section>`;
}

function renderProfileForm() {
  const profile = state.profile || {};
  const displayName = profile.full_name || "";
  const selectedModes = new Set(profileUsageModes(profile));
  const selectedSecondary = new Set((profile.secondaryRoles || []).map((item) => item.role_id));
  const secondaryNames = (profile.secondaryRoles || []).map((item) => item.roles?.name || item.other_role_name).filter(Boolean);
  const selectedSpecializations = new Set(profile.production_types || []);
  const profileRegion = profile.region && italianAreas[profile.region] ? profile.region : "Sardegna";
  renderProfileOverview(profile);
  qs("#profileForm").classList.toggle("hidden", !state.profileEditing);
  qs("#profileOverview").classList.toggle("hidden", state.profileEditing);
  if (!state.profileEditing) {
    qs("#profileForm").innerHTML = "";
    return;
  }
  qs("#profileForm").innerHTML = `<div class="profile-edit-header"><div><p class="eyebrow">Modifica profilo</p><h3>Aggiorna le informazioni pubbliche</h3><span>Salva quando hai finito: tornerai alla vista ordinata del profilo.</span></div><button class="ghost-button" type="button" data-profile-cancel>${icon("x")}Annulla</button></div>
    <div class="profile-edit-layout">
      <section class="profile-edit-card profile-identity-card">
        <div class="profile-edit-card-head">
          <span class="profile-edit-card-icon">${icon("user-round")}</span>
          <div><h4>Identità del profilo</h4><p>Foto, nome e modalità operative con cui sarai riconosciuto dagli altri professionisti.</p></div>
        </div>
        <div class="profile-photo-editor"><div class="avatar profile-photo-preview">${profile.avatar_url ? `<img src="${escapeHtml(profile.avatar_url)}" alt="Foto profilo" />` : initials(displayName)}</div><div><strong>Foto profilo</strong><span>JPG, PNG o WebP, massimo 5 MB. Usa un'immagine quadrata, centrata e senza bordi trasparenti.</span><label class="secondary-button" for="avatarFile">${icon("camera")}Carica foto</label><input class="visually-hidden" id="avatarFile" type="file" accept="image/jpeg,image/png,image/webp" data-avatar-file /><input type="hidden" name="avatar_url" value="${escapeHtml(profile.avatar_url)}" /></div></div>
        <input type="hidden" name="account_type" value="freelance" />
        <fieldset class="account-type-selector profile-mode-selector profile-usage-selector">
          <legend>Come vuoi usare Trankui?</legend>
          <label><input type="checkbox" name="profile_modes" value="member" ${selectedModes.has("member") ? "checked" : ""} /><span><strong>Crew Member</strong><small>Puoi essere trovato, contattato e candidarti alle opportunità.</small></span></label>
          <label><input type="checkbox" name="profile_modes" value="builder" ${selectedModes.has("builder") ? "checked" : ""} /><span><strong>Crew Builder</strong><small>Puoi cercare collaboratori, pubblicare richieste e costruire crew.</small></span></label>
        </fieldset>
      </section>
      <section class="profile-edit-card">
        <div class="profile-edit-card-head">
          <span class="profile-edit-card-icon">${icon("badge-check")}</span>
          <div><h4>Dati professionali</h4><p>Le informazioni che aiutano Trankui a posizionarti nelle ricerche giuste.</p></div>
        </div>
        <div class="form-section profile-fields-grid"><div class="field"><label>Nome e cognome *</label><input name="full_name" value="${escapeHtml(profile.full_name)}" required /></div>
        <div class="field"><label>Agenzia / casa di produzione <span class="optional-label">facoltativo</span></label><input name="company_name" value="${escapeHtml(profile.company_name)}" placeholder="Es. nome agenzia, studio o produzione" /></div>
        <div class="field"><label>Ruolo principale *</label><select name="primary_role_id" required>${groupedRoleOptions(profile.primary_role_id)}</select></div>
        <div class="field"><label>Regione *</label><select name="region" data-profile-region required>${optionList(Object.keys(italianAreas), profileRegion)}</select></div>
        <div class="field"><label>Provincia *</label><select name="city" data-profile-province required><option value="">Scegli</option>${optionList(provincesFor(profileRegion), profile.city)}</select></div>
        <div class="field"><label>Anni di esperienza</label><input name="years_experience" type="number" min="0" max="80" value="${profile.years_experience || 0}" /></div></div>
      </section>
      <section class="profile-edit-card">
        <div class="profile-edit-card-head">
          <span class="profile-edit-card-icon">${icon("sparkles")}</span>
          <div><h4>Presentazione e contatti</h4><p>Racconta come lavori e lascia solo i contatti necessari alla collaborazione.</p></div>
        </div>
        <div class="form-section profile-fields-grid"><div class="field full"><label>Bio</label><textarea name="bio" maxlength="1200">${escapeHtml(profile.bio)}</textarea></div>
        <div class="field"><label>Disponibilità a trasferte</label><input name="travel_area" value="${escapeHtml(profile.travel_area)}" placeholder="Es. Tutta la Sardegna" /></div>
        <div class="field"><label>Telefono privato</label><input name="phone" value="${escapeHtml(profile.phone)}" placeholder="Visibile solo dopo un match" /></div></div>
      </section>
      <section class="profile-edit-card">
        <div class="profile-edit-card-head">
          <span class="profile-edit-card-icon">${icon("link")}</span>
          <div><h4>Portfolio, brand e social</h4><p>Link facoltativi: inserisci solo ciò che vuoi usare per valorizzare il tuo profilo professionale.</p></div>
        </div>
        <div class="form-section profile-fields-grid"><div class="field"><label>Portfolio</label><input name="portfolio_url" type="url" value="${escapeHtml(profile.portfolio_url)}" placeholder="https://" /></div>
        <div class="field"><label>Brand utilizzati</label><input name="brands" value="${escapeHtml((profile.brands || []).join(", "))}" placeholder="Sony, ARRI, Aputure" /></div>
        <div class="field full"><label>Attrezzatura principale</label><textarea name="equipment">${escapeHtml(profile.equipment)}</textarea></div>
        <div class="field social-field"><label>${socialIcon("instagram")}Instagram</label><input name="instagram_url" value="${escapeHtml(profile.instagram_url)}" placeholder="Link o nome utente" /></div>
        <div class="field social-field"><label>${socialIcon("facebook")}Facebook</label><input name="facebook_url" value="${escapeHtml(profile.facebook_url)}" placeholder="Link o nome utente" /></div>
        <div class="field social-field"><label>${socialIcon("tiktok")}TikTok</label><input name="tiktok_url" value="${escapeHtml(profile.tiktok_url)}" placeholder="Link o @nomeutente" /></div>
        <div class="field social-field"><label>${socialIcon("linkedin")}LinkedIn</label><input name="linkedin_url" value="${escapeHtml(profile.linkedin_url)}" placeholder="Link o nome profilo" /></div></div>
      </section>
      <section class="profile-edit-card">
        <div class="profile-edit-card-head">
          <span class="profile-edit-card-icon">${icon("list-checks")}</span>
          <div><h4>Competenze e matching</h4><p>Seleziona solo le competenze concrete e gli ambiti in cui vuoi essere trovato.</p></div>
        </div>
        <div class="profile-select-stack">
          <details class="compact-multiselect"><summary><span><strong>Competenze secondarie</strong><small>Opzionali · massimo 5</small></span><span class="multiselect-summary" data-secondary-summary>${secondaryNames.length ? escapeHtml(secondaryNames.join(", ")) : "Nessuna selezionata"}</span>${icon("chevron-down")}</summary><div class="multiselect-popover"><input type="search" placeholder="Cerca un ruolo" data-role-search />
            <div class="multiselect-list">${state.roles.map((role) => `<label data-role-label="${escapeHtml(role.name.toLowerCase())}"><span>${escapeHtml(role.name)}</span><input type="checkbox" name="secondary_roles" value="${role.id}" data-label="${escapeHtml(role.name)}" ${selectedSecondary.has(role.id) ? "checked" : ""} ${role.id === profile.primary_role_id ? "disabled" : ""}/></label>`).join("")}</div></div></details>
          <details class="compact-multiselect"><summary><span><strong>Ambiti di specializzazione</strong><small>Opzionali · massimo 5</small></span><span class="multiselect-summary" data-specialization-summary>${selectedSpecializations.size ? escapeHtml([...selectedSpecializations].join(", ")) : "Nessuno selezionato"}</span>${icon("chevron-down")}</summary><div class="multiselect-popover"><p class="multiselect-help">Seleziona gli ambiti in cui lavori più frequentemente o in cui ritieni di avere maggiore esperienza. Queste informazioni aiuteranno gli altri professionisti a trovarti per produzioni specifiche.</p><input type="search" placeholder="Cerca un ambito" data-specialization-search />
            <div class="multiselect-list grouped">${Object.entries(specializationGroups).map(([category, items]) => `<div class="multiselect-group"><strong>${escapeHtml(category)}</strong>${items.map((item) => `<label data-specialization-label="${escapeHtml(item.toLowerCase())}"><span>${escapeHtml(item)}</span><input type="checkbox" name="specializations" value="${escapeHtml(item)}" data-label="${escapeHtml(item)}" ${selectedSpecializations.has(item) ? "checked" : ""}/></label>`).join("")}</div>`).join("")}</div></div></details>
        </div>
      </section>
      <section class="profile-edit-card profile-edit-privacy-card">
        <label class="consent-line"><input name="availability_visible" type="checkbox" ${profile.availability_visible ? "checked" : ""}/><span><strong>Visibilità in ricerca</strong>Mostra il mio profilo nelle ricerche quando risulto disponibile.</span></label>
      </section>
      <div class="profile-sticky-save"><button class="primary-button" type="submit">${icon("save")}Salva profilo</button></div>
    </div>`;
}

async function saveProfile(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const accountType = "freelance";
  const selected = form.getAll("secondary_roles");
  const selectedSpecializations = form.getAll("specializations");
  const selectedProfileModes = form.getAll("profile_modes");
  if (selected.length > 5) return showToast("Puoi scegliere al massimo 5 competenze secondarie", true);
  if (selectedSpecializations.length > 5) return showToast("Puoi scegliere al massimo 5 ambiti di specializzazione", true);
  if (!selectedProfileModes.length) return showToast("Scegli almeno una modalità: Crew Member o Crew Builder", true);
  const fullName = form.get("full_name").trim();
  const primaryRoleId = form.get("primary_role_id");
  const city = form.get("city");
  try {
    state.profile = await backend.saveProfile({
      account_type: accountType, full_name: fullName, company_name: form.get("company_name").trim(), company_type: "",
      vat_number: "", contact_name: "", company_website: "",
      can_work_as_member: selectedProfileModes.includes("member"),
      can_work_as_builder: selectedProfileModes.includes("builder"),
      primary_role_id: primaryRoleId || null, bio: form.get("bio"), city,
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
    state.profileEditing = false;
    await loadAppData();
  } catch (error) {
    showToast(errorMessage(error), true);
  }
}

function renderIntegrations() {
  const connection = (provider) => state.calendarConnections.find((item) => item.provider === provider);
  const google = connection("google");
  qs("#integrationsGrid").innerHTML = `<article class="integration-card"><div class="integration-icon">${icon("calendar-days")}</div><div><h3>Google Calendar</h3><span>${google?.last_synced_at ? `Ultimo aggiornamento ${new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(google.last_synced_at))}` : "Autorizza la lettura dello stato libero/occupato."}</span></div><button class="${google?.status === "connected" ? "secondary-button" : "primary-button"}" type="button" ${google?.status === "connected" ? "data-sync-google" : "data-connect-google"}>${google?.status === "connected" ? `${icon("refresh-cw")}Sincronizza` : `${icon("link")}Collega Google`}</button></article>
    <p class="integration-note">Trankui non legge titoli, clienti o dettagli degli eventi: usa soltanto lo stato libero/occupato dopo autorizzazione esplicita.</p>`;
}

function renderCommunity(query = qs("#communitySearch")?.value || "") {
  const needle = query.trim().toLowerCase();
  const visibleProfiles = state.profiles.filter((profile) => {
    const roleNames = [profile.roles?.name, ...(profile.secondary_roles || []).map((item) => item.roles?.name || item.other_role_name)];
    const searchable = [profile.full_name, profile.city, profile.region, ...roleNames, ...(profile.production_types || [])].filter(Boolean).join(" ").toLowerCase();
    return !needle || searchable.includes(needle);
  }).sort((a, b) => (a.full_name || "").localeCompare(b.full_name || "", "it"));
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(visibleProfiles.length / pageSize));
  state.communityPage = Math.min(Math.max(1, state.communityPage), totalPages);
  const pageProfiles = visibleProfiles.slice((state.communityPage - 1) * pageSize, state.communityPage * pageSize);
  const cards = pageProfiles.map((profile) => `<button class="community-card" type="button" data-open-profile="${profile.id}"><div class="avatar">${avatarContent(profile)}</div><div><strong>${escapeHtml(profile.full_name)}</strong><span>${escapeHtml(profile.roles?.name || profile.primary_other_role_name || "Professionista")} · ${escapeHtml(profile.city)}</span>${profileModeChips(profile)}</div><div class="community-card-trust">${profile.verified ? icon("badge-check") : ""}${profileBadgeMini(profile)}</div></button>`).join("");
  const pagination = visibleProfiles.length > pageSize ? `<div class="community-pagination"><button class="ghost-button" type="button" data-community-page="${state.communityPage - 1}" ${state.communityPage === 1 ? "disabled" : ""}>Precedenti</button><span>Pagina ${state.communityPage} di ${totalPages}</span><button class="ghost-button" type="button" data-community-page="${state.communityPage + 1}" ${state.communityPage === totalPages ? "disabled" : ""}>Successivi</button></div>` : "";
  qs("#userDirectory").innerHTML = cards ? `${cards}${pagination}` : `<div class="empty-state">${needle ? "Nessun professionista corrisponde alla ricerca." : "La community inizierà a comparire qui."}</div>`;
}

function supportStatusLabel(status) {
  return ({ open: "Aperto", in_review: "In analisi", resolved: "Risolto", closed: "Chiuso" })[status] || status || "Aperto";
}

function betaFeedbackCategoryLabel(category) {
  return ({ Funzionalita: "Funzionalità" })[category] || category || "Altro";
}

function betaFeedbackStatusLabel(status) {
  return ({ new: "Ricevuto", triaged: "In valutazione", planned: "Pianificato", in_progress: "In lavorazione", resolved: "Risolto", closed: "Chiuso" })[status] || status || "Ricevuto";
}

function renderBetaFeedback() {
  const list = qs("#betaFeedbackList");
  if (!list) return;
  const items = state.betaFeedbackItems || [];
  list.innerHTML = items.length ? items.map((item) => {
    const hasScreenshot = item.screenshot_file_name || item.screenshot_path;
    return `<article class="beta-feedback-card">
      <div class="beta-feedback-card-top">
        <span class="status-chip">${escapeHtml(betaFeedbackStatusLabel(item.status))}</span>
        <span class="support-priority">${escapeHtml(item.perceived_priority || "Media")}</span>
      </div>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.description)}</p>
      <footer>
        <span>${escapeHtml(betaFeedbackCategoryLabel(item.category))}</span>
        ${hasScreenshot ? `<span>${icon("image")}Screenshot allegato</span>` : ""}
        <time>${new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(item.created_at))}</time>
      </footer>
    </article>`;
  }).join("") : `<div class="empty-state">${icon("message-square-plus")}<strong>Nessun feedback inviato</strong><span>Quando invii un feedback durante la Beta lo ritroverai qui.</span></div>`;
}

function supportAnswer(question) {
  const text = question.toLowerCase();
  if (/(cos.?è|come funziona|a cosa serve|trankui|piattaforma)/i.test(text)) {
    return "Trankui serve a costruire crew audiovisive in modo più rapido e affidabile. Cerchi per ruolo, data e zona; apri il profilo; contatti il professionista in chat; quando la collaborazione viene accettata, la piattaforma ha completato il match. Dopo il lavoro entra in gioco il feedback reciproco.";
  }
  if (/(profilo|foto|ruolo|competenze|social|portfolio|attrezzatura)/i.test(text)) {
    return "Nel profilo inserisci ruolo principale, competenze secondarie, ambiti di specializzazione, portfolio, attrezzatura, brand, social e foto. Il ruolo principale definisce il tuo posizionamento; le competenze secondarie aumentano le ricerche in cui puoi comparire.";
  }
  if (/(ricerca|trova|professionista|crew|zona|provincia|disponibile)/i.test(text)) {
    return "La ricerca usa ruolo, data, regione, provincia e ambiti di specializzazione. Prima compaiono i professionisti con quel ruolo come principale, poi quelli che lo hanno tra le competenze secondarie. La disponibilità del calendario aiuta a evitare contatti inutili.";
  }
  if (/(bacheca|richiesta|annuncio|candidatura|pubblica)/i.test(text)) {
    return "La bacheca serve quando vuoi pubblicare una richiesta aperta alla community. Le richieste create da te sono riconoscibili, modificabili e rimovibili solo dal tuo account. Gli altri professionisti possono candidarsi.";
  }
  if (/(chat|messaggio|contattare|contatto)/i.test(text)) {
    return "Quando contatti un professionista si apre una chat interna. Usala per chiarire disponibilità, data, ruolo, dettagli operativi e prossimi passi. I contatti diretti vengono condivisi solo quando la collaborazione è accettata.";
  }
  if (/(calendario|google|disponibilità|occupato|sync|sincronizza)/i.test(text)) {
    return "Nel calendario indichi i giorni disponibili, forse disponibili o occupati. Google Calendar può sincronizzare lo stato libero/occupato: Trankui non legge titoli, clienti o dettagli privati degli eventi.";
  }
  if (/(recensione|feedback|blind|rating|affidabilit)/i.test(text)) {
    return "I feedback sono blind: diventano pubblici solo quando entrambi avete lasciato la vostra valutazione. Questo riduce pressioni e rende più credibile l'Affidabilità Trankui. Per chi lavora in crew parliamo di Crew Member; per chi organizza una produzione parliamo di Crew Builder.";
  }
  if (/(agenzia|casa di produzione|azienda|freelance|account)/i.test(text)) {
    return "In registrazione puoi scegliere freelance oppure agenzia/casa di produzione. Il freelance si posiziona come professionista; l'agenzia usa Trankui per cercare collaboratori e costruire crew per produzioni già confermate.";
  }
  if (/(bug|errore|anomalia|non funziona|problema|ticket|segnalare)/i.test(text)) {
    return "Se hai trovato un'anomalia, apri un ticket dal modulo a destra. Indica area, priorità, oggetto e cosa è successo. Se puoi, scrivi anche da quale sezione eri partito e cosa ti aspettavi.";
  }
  return "Posso aiutarti su profilo, ricerca crew, bacheca, chat, calendario, feedback blind e account agenzia/freelance. Se invece hai trovato un errore tecnico, apri un ticket con i dettagli del problema.";
}

function renderSupportChat() {
  qs("#supportChatLog").innerHTML = state.supportMessages.map((message) => `<div class="support-message ${message.role}"><span>${message.role === "assistant" ? "Trankui" : "Tu"}</span><p>${escapeHtml(message.body)}</p></div>`).join("");
  qs("#supportChatLog").scrollTop = qs("#supportChatLog").scrollHeight;
}

function renderSupportTickets() {
  const tickets = state.supportTickets || [];
  qs("#supportTicketList").innerHTML = tickets.length ? tickets.map((ticket) => `<article class="support-ticket-card">
    <div><span class="status-chip">${escapeHtml(supportStatusLabel(ticket.status))}</span><span class="support-priority">${escapeHtml(ticket.priority || "Normale")}</span></div>
    <h3>${escapeHtml(ticket.subject)}</h3>
    <p>${escapeHtml(ticket.description)}</p>
    <footer><span>${escapeHtml(ticket.category)}</span><time>${new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(ticket.created_at))}</time></footer>
  </article>`).join("") : `<div class="empty-state">${icon("ticket")}<strong>Nessun ticket aperto</strong><span>Se trovi un'anomalia, invia una segnalazione dal modulo qui sopra.</span></div>`;
}

function renderSupport() {
  if (!qs("#supportChatLog")) return;
  renderSupportChat();
  renderSupportTickets();
}

function askSupportAssistant(question) {
  const clean = String(question || "").trim();
  if (!clean) return;
  state.supportMessages.push({ role: "user", body: clean });
  state.supportMessages.push({ role: "assistant", body: supportAnswer(clean) });
  renderSupportChat();
  redrawIcons();
}

async function createSupportTicket(event) {
  event.preventDefault();
  const formElement = event.currentTarget;
  const form = new FormData(formElement);
  const payload = {
    category: form.get("category"),
    priority: form.get("priority"),
    subject: String(form.get("subject") || "").trim(),
    description: String(form.get("description") || "").trim(),
  };
  if (payload.subject.length < 3 || payload.description.length < 10) return showToast("Inserisci un oggetto e una descrizione più dettagliata.", true);
  const button = qs("#submitTicketButton");
  button.disabled = true;
  try {
    let ticket;
    try {
      ticket = await backend.createSupportTicket(payload);
    } catch (_) {
      ticket = saveLocalSupportTicket({
        id: `local-${Date.now()}`,
        reporter_id: state.session?.user?.id || "local",
        ...payload,
        status: "open",
        created_at: new Date().toISOString(),
      });
    }
    state.supportTickets = [ticket, ...state.supportTickets.filter((item) => item.id !== ticket.id)];
    formElement.reset();
    renderSupportTickets();
    showToast("Ticket inviato. Ti terremo aggiornato.");
  } catch (error) {
    showToast(errorMessage(error), true);
  } finally {
    button.disabled = false;
  }
}

async function createBetaFeedback(event) {
  event.preventDefault();
  const formElement = event.currentTarget;
  const form = new FormData(formElement);
  const screenshot = form.get("screenshot");
  const payload = {
    category: form.get("category"),
    perceived_priority: form.get("perceived_priority") || "Media",
    title: String(form.get("title") || "").trim(),
    description: String(form.get("description") || "").trim(),
  };
  if (!payload.category) return showToast("Scegli una categoria per il feedback.", true);
  if (payload.title.length < 3 || payload.description.length < 10) return showToast("Inserisci un titolo e una descrizione più dettagliata.", true);
  if (screenshot && screenshot.size) {
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(screenshot.type)) return showToast("Carica uno screenshot in formato PNG, JPG o WebP.", true);
    if (screenshot.size > 5 * 1024 * 1024) return showToast("Lo screenshot non può superare 5 MB.", true);
  }
  const button = qs("#submitBetaFeedbackButton");
  button.disabled = true;
  let uploadedScreenshot = null;
  try {
    if (!backend.createBetaFeedback) throw new Error("La pagina feedback Beta non e ancora collegata al database.");
    if (screenshot && screenshot.size) {
      if (!backend.uploadBetaFeedbackScreenshot) throw new Error("Il caricamento screenshot non e ancora attivo.");
      uploadedScreenshot = await backend.uploadBetaFeedbackScreenshot(screenshot);
      payload.screenshot_path = uploadedScreenshot.path;
      payload.screenshot_file_name = uploadedScreenshot.file_name;
      payload.screenshot_mime_type = uploadedScreenshot.mime_type;
      payload.screenshot_size = uploadedScreenshot.size;
    }
    const feedback = await backend.createBetaFeedback(payload);
    state.betaFeedbackItems = [feedback, ...state.betaFeedbackItems.filter((item) => item.id !== feedback.id)];
    formElement.reset();
    qs("#betaFeedbackPriority").value = "Media";
    renderBetaFeedback();
    showToast("Feedback inviato. Grazie, questo aiuta davvero la Beta.");
    redrawIcons();
  } catch (error) {
    if (uploadedScreenshot?.path && backend.deleteBetaFeedbackScreenshot) {
      try { await backend.deleteBetaFeedbackScreenshot(uploadedScreenshot.path); } catch (_) { /* Cleanup best effort. */ }
    }
    showToast(errorMessage(error), true);
  } finally {
    button.disabled = false;
  }
}

function switchView(view) {
  closeMobileMenu();
  if (view === "calendar" || view === "profile-availability") return openProfileAvailability();
  qsa(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  qs(".brand-chat-button")?.classList.toggle("active", view === "chat");
  qsa(".view").forEach((item) => item.classList.toggle("active-view", item.id === `view-${view}`));
  const boardTitle = state.workspaceMode === "member" ? "Opportunita" : "Bacheca";
  const boardCopy = state.workspaceMode === "member" ? "Richieste aperte a cui puoi candidarti" : "Pubblica richieste e gestisci le candidature";
  const titles = {
    search: ["Crew finder", "Trova un collaboratore affidabile in pochi minuti"], board: [boardTitle, boardCopy],
    requests: ["Attivita", "Collaborazioni, messaggi e feedback in ordine"], chat: ["Chat", "Conversazioni attive e risposte in tempo reale"], calendar: ["Disponibilita", "Aggiorna quando puoi lavorare"],
    profile: ["Profilo", "Racconta come lavori, senza rumore"], admin: ["Community", "La rete professionale Trankui"],
    support: ["Help", "Risposte rapide e ticket per anomalie"], "beta-feedback": ["Beta privata", "Invia feedback per migliorare Trankui"],
  };
  qs("#pageEyebrow").textContent = titles[view][0];
  qs("#pageTitle").textContent = titles[view][1];
  if (view === "profile") {
    window.setTimeout(requestNotificationSettingsPanel, 0);
  }
  redrawIcons();
}

function openOwnProfile(event, options = {}) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  closeMobileMenu();
  closeMobileNotifications();
  qs("#notificationPanel")?.classList.add("hidden");
  qs("#notificationButton")?.setAttribute("aria-expanded", "false");
  switchView("profile");
  renderProfileOnboarding();
  renderProfileForm();
  window.setTimeout(() => {
    qs(options.scrollTarget || "#view-profile")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, options.delay ?? 40);
  redrawIcons();
}

function prefillPostFromSearch() {
  if (state.search.roleId) qs("#postRole").value = state.search.roleId;
  if (state.search.date) qs("#postDate").value = state.search.date;
  if (state.search.region) {
    qs("#postRegion").value = state.search.region;
    qs("#postZone").innerHTML = optionList(provincesFor(state.search.region));
  }
  if (state.search.zone) qs("#postZone").value = state.search.zone;
  if (state.search.production) qs("#postProduction").value = state.search.production;
}

function openBoardComposer(prefill = false) {
  if (!ensureCrewBuilderEnabled()) return;
  switchView("board");
  if (prefill) prefillPostFromSearch();
  qs("#postForm").classList.remove("hidden");
  qs("#postForm").scrollIntoView({ behavior: "smooth", block: "start" });
  redrawIcons();
}

function openProfileAvailability() {
  openOwnProfile(null, { scrollTarget: "#profileAvailabilitySection", delay: 60 });
}

function openMobileMenu() {
  qs("#mobileMenuBackdrop").classList.remove("hidden");
  qs("#mobileMenuPanel").classList.remove("hidden");
  qs("#mobileMenuPanel").setAttribute("aria-hidden", "false");
  qs("#mobileMenuOpen").setAttribute("aria-expanded", "true");
  document.body.classList.add("mobile-menu-open");
}

function handleMobileMenuPointer(event) {
  if (event.pointerType && !["touch", "pen"].includes(event.pointerType)) return;
  event.preventDefault();
  event.stopPropagation();
  openMobileMenu();
}

function closeMobileMenu() {
  qs("#mobileMenuBackdrop")?.classList.add("hidden");
  qs("#mobileMenuPanel")?.classList.add("hidden");
  qs("#mobileMenuPanel")?.setAttribute("aria-hidden", "true");
  qs("#mobileMenuOpen")?.setAttribute("aria-expanded", "false");
  document.body.classList.remove("mobile-menu-open");
}

function openMobileNotifications() {
  closeMobileMenu();
  const backdrop = qs("#mobileNotificationBackdrop");
  backdrop.classList.remove("hidden");
  backdrop.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  renderNotifications();
  redrawIcons();
}

function closeMobileNotifications() {
  const backdrop = qs("#mobileNotificationBackdrop");
  if (!backdrop || backdrop.classList.contains("hidden")) return;
  backdrop.classList.add("hidden");
  backdrop.setAttribute("aria-hidden", "true");
  if (qsa(".modal-backdrop:not(.hidden), .chat-backdrop:not(.hidden), .mobile-notification-backdrop:not(.hidden)").length === 0) document.body.classList.remove("modal-open");
}

function openBetaFeedback() {
  switchView("beta-feedback");
  window.setTimeout(() => {
    qs("#betaFeedbackCategory").value ||= "Suggerimento";
    qs("#betaFeedbackPriority").value ||= "Media";
    qs("#view-beta-feedback")?.scrollIntoView({ behavior: "smooth", block: "start" });
    qs("#betaFeedbackTitle")?.focus();
  }, 80);
}

document.addEventListener("click", async (event) => {
  const authMode = event.target.closest("[data-auth-mode]");
  if (authMode) return setAuthMode(authMode.dataset.authMode);
  if (event.target.closest("input[name='account_type']")) {
    if (event.target.closest("#authForm")) return syncAuthAccountType();
    if (event.target.closest("#profileForm")) {
      state.profile = { ...(state.profile || {}), account_type: event.target.value };
      renderProfileForm();
      redrawIcons();
      return;
    }
  }
  if (event.target.closest("#forgotPassword")) return setAuthMode("recovery");
  if (event.target.closest("#backToLogin")) return setAuthMode("signin");
  if (event.target.closest("[data-beta-feedback]")) return openBetaFeedback();
  const crewZeroComplete = event.target.closest("[data-crew-zero-complete]");
  if (crewZeroComplete) {
    if (state.pendingWelcomeSession) {
      const session = state.pendingWelcomeSession;
      state.pendingWelcomeSession = null;
      await enterApp(session);
      switchView("profile");
    } else {
      const email = qs("#authEmail").value.trim();
      setAuthMode("signin");
      setAuthStatus("Conferma la tua email", `${signupConfirmationMessage(email)} Dopo la conferma accedi per completare il profilo.`, `<button class="auth-text-button" type="button" id="resendConfirmation">Reinvia email di verifica</button>`);
    }
    return;
  }
  const crewZeroExplore = event.target.closest("[data-crew-zero-explore]");
  if (crewZeroExplore) {
    if (state.pendingWelcomeSession) {
      const session = state.pendingWelcomeSession;
      state.pendingWelcomeSession = null;
      await enterApp(session);
      switchView("search");
    } else {
      window.location.href = "./trankui.html";
    }
    return;
  }
  if (event.target.closest("#resendConfirmation")) {
    const email = qs("#authEmail").value.trim();
    if (!email) return showToast("Inserisci prima la tua email", true);
    try {
      await backend.resendConfirmation(email);
      setAuthStatus("Email reinviata", signupConfirmationMessage(email), `<button class="auth-text-button" type="button" id="resendConfirmation">Reinvia email di verifica</button>`);
    } catch (error) {
      setAuthStatus("Email non reinviata", errorMessage(error));
    }
    return;
  }
  const dateToggle = event.target.closest("#searchDateButton");
  if (dateToggle) {
    const panel = qs("#searchDatePopover");
    panel.classList.toggle("hidden");
    dateToggle.setAttribute("aria-expanded", String(!panel.classList.contains("hidden")));
    renderSearchDatePicker();
    redrawIcons();
    return;
  }
  const searchMonth = event.target.closest("[data-search-month]");
  if (searchMonth) {
    state.searchMonth = new Date(state.searchMonth.getFullYear(), state.searchMonth.getMonth() + Number(searchMonth.dataset.searchMonth), 1);
    renderSearchDatePicker();
    redrawIcons();
    return;
  }
  const searchDay = event.target.closest("[data-search-day]");
  if (searchDay) {
    const date = searchDay.dataset.searchDay;
    if (state.searchDates.has(date)) state.searchDates.delete(date);
    else state.searchDates.add(date);
    syncSearchDateInput();
    renderSearchDatePicker();
    redrawIcons();
    return;
  }
  if (event.target.closest("[data-search-date-clear]")) {
    state.searchDates.clear();
    syncSearchDateInput();
    renderSearchDatePicker();
    redrawIcons();
    return;
  }
  if (event.target.closest("[data-search-date-close]")) {
    qs("#searchDatePopover")?.classList.add("hidden");
    qs("#searchDateButton")?.setAttribute("aria-expanded", "false");
    return;
  }
  if (!event.target.closest(".search-date-field")) {
    qs("#searchDatePopover")?.classList.add("hidden");
    qs("#searchDateButton")?.setAttribute("aria-expanded", "false");
  }
  if (!event.target.closest(".sidebar-user-row")) setAccountPanelOpen(false);
  if (event.target.closest("#chatInfoButton")) {
    toggleChatInfoPanel();
    redrawIcons();
    return;
  }
  if (!event.target.closest("#chatInfoPanel")) setChatInfoOpen(false);
  const workspaceMode = event.target.closest("button[data-workspace-mode]");
  if (workspaceMode) {
    setWorkspaceMode(workspaceMode.dataset.workspaceMode, { navigate: true });
    return;
  }
  const nav = event.target.closest("button[data-view], a[data-view]");
  if (nav) {
    closeMobileMenu();
    closeMobileNotifications();
    qs("#notificationPanel")?.classList.add("hidden");
    qs("#notificationButton")?.setAttribute("aria-expanded", "false");
    return switchView(nav.dataset.view);
  }
  const boardRequest = event.target.closest("[data-open-board-request]");
  if (boardRequest) return openBoardComposer(true);
  const go = event.target.closest("button[data-go], a[data-go]");
  if (go) {
    closeMobileMenu();
    closeMobileNotifications();
    qs("#notificationPanel")?.classList.add("hidden");
    qs("#notificationButton")?.setAttribute("aria-expanded", "false");
    if (go.dataset.go === "profile") return openOwnProfile(event);
    if (go.dataset.go === "calendar" || go.dataset.go === "profile-availability") return openProfileAvailability();
    return switchView(go.dataset.go);
  }
  const onboardingPrev = event.target.closest("[data-onboarding-prev]");
  if (onboardingPrev) {
    const total = profileOnboardingSteps().length;
    state.onboardingStep = (state.onboardingStep - 1 + total) % total;
    renderProfileOnboarding();
    redrawIcons();
    return;
  }
  const onboardingNext = event.target.closest("[data-onboarding-next]");
  if (onboardingNext) {
    const total = profileOnboardingSteps().length;
    state.onboardingStep = (state.onboardingStep + 1) % total;
    renderProfileOnboarding();
    redrawIcons();
    return;
  }
  const onboardingStep = event.target.closest("[data-onboarding-step]");
  if (onboardingStep) {
    state.onboardingStep = Number(onboardingStep.dataset.onboardingStep);
    renderProfileOnboarding();
    redrawIcons();
    return;
  }
  if (event.target.closest("[data-profile-edit]")) {
    state.profileEditing = true;
    renderProfileOnboarding();
    renderProfileForm();
    qs("#profileForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
    redrawIcons();
    return;
  }
  if (event.target.closest("[data-profile-cancel]")) {
    state.profileEditing = false;
    renderProfileOnboarding();
    renderProfileForm();
    redrawIcons();
    return;
  }
  if (event.target.closest("[data-profile-preview]")) {
    if (!state.profile?.id) return showToast("Completa prima il profilo", true);
    if (!state.profiles.some((profile) => profile.id === state.profile.id)) return showToast("L'anteprima pubblica sarà disponibile quando il profilo è attivo.", true);
    return openPublicProfile(state.profile.id);
  }
  const supportQuestion = event.target.closest("[data-support-question]");
  if (supportQuestion) {
    askSupportAssistant(supportQuestion.dataset.supportQuestion);
    return;
  }
  const communityPage = event.target.closest("[data-community-page]");
  if (communityPage) {
    state.communityPage = Number(communityPage.dataset.communityPage);
    renderCommunity();
    redrawIcons();
    return;
  }
  const profile = event.target.closest("[data-profile]");
  if (profile) { state.selectedProfileId = profile.dataset.profile; await renderSelectedProfile(); return; }
  const publicProfile = event.target.closest("[data-open-profile]");
  if (publicProfile?.dataset.openProfile) return openPublicProfile(publicProfile.dataset.openProfile);
  const request = event.target.closest("[data-request]");
  if (request) return sendCollaborationRequest(request.dataset.request);
  const apply = event.target.closest("[data-apply]");
  if (apply) {
    if (!ensureCrewMemberEnabled()) return;
    const message = window.prompt("Messaggio per chi ha pubblicato la richiesta", "Sono disponibile e interessato alla produzione.");
    if (message === null) return;
    try {
      const application = await backend.applyToPost(apply.dataset.apply, message);
      notifyEvent({ type: "application", application_id: application.id });
      showToast("Candidatura inviata");
      await loadAppData();
    } catch (error) { showToast(errorMessage(error), true); }
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
  const deletePost = event.target.closest("[data-delete-post]");
  if (deletePost) {
    const post = state.posts.find((item) => item.id === deletePost.dataset.deletePost && item.owner_id === state.session?.user?.id);
    if (!post) return showToast("Puoi rimuovere solo le richieste che hai pubblicato.", true);
    openDeletePostModal(post);
    return;
  }
  const select = event.target.closest("[data-select-applicant]");
  if (select) {
    try {
      const collaboration = await backend.selectApplicant(select.dataset.selectApplicant);
      notifyEvent({ type: "match", collaboration_id: collaboration.id });
      showToast("Collaboratore selezionato");
      await loadAppData();
    } catch (error) { showToast(errorMessage(error), true); }
    return;
  }
  const activityFilter = event.target.closest("[data-activity-filter]");
  if (activityFilter) { state.activityFilter = activityFilter.dataset.activityFilter; renderActivity(); redrawIcons(); return; }
  const archiveCollaboration = event.target.closest("[data-archive-collaboration]");
  if (archiveCollaboration) {
    const collaboration = state.collaborations.find((item) => item.id === archiveCollaboration.dataset.archiveCollaboration);
    if (!collaboration || collaboration.status !== "completed") return showToast("Puoi archiviare solo collaborazioni concluse.", true);
    state.archivedCollaborationIds.add(collaboration.id);
    persistArchivedCollaborationIds();
    renderActivity();
    redrawIcons();
    showToast("Collaborazione archiviata");
    return;
  }
  const unarchiveCollaboration = event.target.closest("[data-unarchive-collaboration]");
  if (unarchiveCollaboration) {
    state.archivedCollaborationIds.delete(unarchiveCollaboration.dataset.unarchiveCollaboration);
    persistArchivedCollaborationIds();
    state.activityFilter = "completed";
    renderActivity();
    redrawIcons();
    showToast("Collaborazione ripristinata");
    return;
  }
  const transition = event.target.closest("[data-transition]");
  if (transition) {
    try {
      const collaboration = await backend.transitionCollaboration(transition.dataset.collaboration, transition.dataset.transition);
      notifyEvent({ type: "match", collaboration_id: collaboration.id });
      showToast("Richiesta aggiornata");
      await loadAppData();
    } catch (error) { showToast(errorMessage(error), true); }
    return;
  }
  const complete = event.target.closest("[data-complete]");
  if (complete) {
    try {
      const result = await backend.confirmComplete(complete.dataset.complete);
      notifyEvent({ type: "completion", collaboration_id: result.id });
      await loadAppData();
      if (result.status === "completed") openReview(result.id); else showToast("Conferma registrata. Attendi quella dell'altra persona.");
    } catch (error) { showToast(errorMessage(error), true); }
    return;
  }
  const chat = event.target.closest("[data-chat]");
  if (chat) return openChat(chat.dataset.chat);
  const review = event.target.closest("[data-review]");
  if (review) return openReview(review.dataset.review);
  const notification = event.target.closest("[data-notification-type]");
  if (notification) {
    qs("#notificationPanel").classList.add("hidden");
    qs("#notificationButton").setAttribute("aria-expanded", "false");
    closeMobileNotifications();
    if (notification.dataset.notificationType === "message") return openChat(notification.dataset.notificationCollaboration);
    if (notification.dataset.notificationType === "review") return openReview(notification.dataset.notificationCollaboration);
    return switchView("requests");
  }
  const googleCalendar = event.target.closest("[data-connect-google]");
  if (googleCalendar) { try { await backend.connectGoogleCalendar(); } catch (error) { showToast(errorMessage(error), true); } return; }
  const syncGoogle = event.target.closest("[data-sync-google]");
  if (syncGoogle) { try { syncGoogle.disabled = true; const count = await backend.syncGoogleCalendar(); showToast(`${count} giornate occupate sincronizzate`); await loadAppData(); } catch (error) { showToast(errorMessage(error), true); } finally { syncGoogle.disabled = false; } return; }
  if (event.target.closest("[data-availability-apply]")) return applySelectedAvailability();
  if (event.target.closest("[data-availability-clear]")) return clearSelectedAvailability();
  const day = event.target.closest("[data-day]");
  if (day) return setDayAvailability(day.dataset.day);
  const mode = event.target.closest("[data-mode]");
  if (mode) { state.availabilityMode = mode.dataset.mode; renderCalendar(); redrawIcons(); return; }
  const month = event.target.closest("[data-month]");
  if (month) { state.selectedAvailabilityDates.clear(); state.month = new Date(state.month.getFullYear(), state.month.getMonth() + Number(month.dataset.month), 1); await loadAppData(); return; }
});

qs("#authForm").addEventListener("submit", handleAuth);
qs("#googleAuthButton").addEventListener("click", handleGoogleAuth);
qs("#authForm").addEventListener("change", (event) => {
  if (event.target.matches("input[name='account_type']")) syncAuthAccountType();
  if (event.target.matches("input[name='profile_modes']")) {
    qs("#profileModeSelector").dataset.touched = "true";
    syncAuthProfileModes();
  }
});
qs("#searchForm").addEventListener("submit", async (event) => {
  event.preventDefault(); const form = new FormData(event.currentTarget);
  state.searchDates = new Set(String(form.get("date") || "").split(",").filter(Boolean));
  state.search = { roleId: form.get("role"), date: selectedSearchDates()[0] || "", region: form.get("region"), zone: form.get("zone"), production: form.get("production") };
  state.searchSubmitted = true;
  try {
    await ensureAvailabilityForSearchDates();
    renderSearchResults();
    redrawIcons();
  } catch (error) {
    showToast(errorMessage(error), true);
  }
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
qs("#profileForm").addEventListener("change", (event) => {
  if (event.target.matches("input[name='account_type']")) {
    state.profile = { ...(state.profile || {}), account_type: event.target.value };
    renderProfileForm();
    redrawIcons();
  }
  if (event.target.matches("input[name='profile_modes']")) {
    const selected = qsa("#profileForm input[name='profile_modes']:checked").map((item) => item.value);
    if (!selected.length) event.target.checked = true;
  }
});
qs("#communitySearch").addEventListener("input", (event) => { state.communityPage = 1; renderCommunity(event.target.value); redrawIcons(); });
qs("#supportChatForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = qs("#supportQuestion");
  askSupportAssistant(input.value);
  input.value = "";
  input.focus();
});
qs("#supportTicketForm").addEventListener("submit", createSupportTicket);
qs("#betaFeedbackForm").addEventListener("submit", createBetaFeedback);
qs("#reviewForm").addEventListener("submit", submitReview);
qs("#closeReview").addEventListener("click", closeReview);
qs("#reviewBackdrop").addEventListener("click", (event) => { if (event.target === event.currentTarget) closeReview(); });
qs("#closePublicProfile").addEventListener("click", closePublicProfile);
qs("#publicProfileBackdrop").addEventListener("click", (event) => { if (event.target === event.currentTarget) closePublicProfile(); });
qs("#closeDeletePost").addEventListener("click", closeDeletePostModal);
qs("#cancelDeletePost").addEventListener("click", closeDeletePostModal);
qs("#deletePostBackdrop").addEventListener("click", (event) => { if (event.target === event.currentTarget) closeDeletePostModal(); });
qs("#confirmDeletePost").addEventListener("click", confirmDeletePost);
qs("#togglePostForm").addEventListener("click", () => {
  if (!ensureCrewBuilderEnabled()) return;
  qs("#postForm").classList.toggle("hidden");
});
qs("#cancelPost").addEventListener("click", () => {
  resetPostForm();
});
qs("#openBoard").addEventListener("click", () => openBoardComposer(false));
qs("#openAvailability").addEventListener("click", openProfileAvailability);
qs("#enableNotifications").addEventListener("click", async () => {
  try {
    await ensurePushSubscription();
    updateNotificationPreference("channels", "push", true);
    renderNotificationSettings();
    showToast("Notifiche push attive su questo dispositivo");
  } catch (error) {
    updateNotificationPreference("channels", "push", false);
    renderNotificationSettings();
    showToast(errorMessage(error), true);
  }
});
qs("#soundNotifications").addEventListener("change", (event) => {
  updateNotificationPreference("channels", "sound", event.target.checked);
  if (event.target.checked) playNotificationTone();
  renderNotificationSettings();
});
qs("#pushNotifications").addEventListener("change", async (event) => {
  if (!event.target.checked) {
    await disablePushSubscription();
    updateNotificationPreference("channels", "push", false);
    renderNotificationSettings();
    return;
  }
  try {
    await ensurePushSubscription();
    updateNotificationPreference("channels", "push", true);
    renderNotificationSettings();
    showToast("Notifiche push attive su questo dispositivo");
  } catch (error) {
    updateNotificationPreference("channels", "push", false);
    renderNotificationSettings();
    showToast(errorMessage(error), true);
  }
});
qs("#emailNotifications").addEventListener("change", (event) => {
  updateNotificationPreference("channels", "email", event.target.checked);
  renderNotificationSettings();
  showToast(event.target.checked ? "Notifiche email attive" : "Notifiche email disattivate");
});
qsa("[data-notification-topic]").forEach((input) => {
  input.addEventListener("change", (event) => {
    updateNotificationPreference("topics", event.target.dataset.notificationTopic, event.target.checked);
    renderNotifications();
    rememberCurrentNotifications();
  });
});
function toggleAccountPanel(event) {
  event?.preventDefault();
  event?.stopPropagation();
  const panel = qs("#notificationPanel");
  setAccountPanelOpen(panel.classList.contains("hidden"));
}

function setAccountPanelOpen(open) {
  const panel = qs("#notificationPanel");
  panel.classList.toggle("hidden", !open);
  qs("#notificationButton").setAttribute("aria-expanded", String(open));
}

let accountPanelTouchHandledAt = 0;

function handleAccountPanelPointer(event) {
  if (event.pointerType && !["touch", "pen"].includes(event.pointerType)) return;
  accountPanelTouchHandledAt = Date.now();
  toggleAccountPanel(event);
}

function handleAccountPanelClick(event) {
  if (Date.now() - accountPanelTouchHandledAt < 700) {
    event?.preventDefault();
    event?.stopPropagation();
    return;
  }
  event?.preventDefault();
  event?.stopPropagation();
  toggleAccountPanel(event);
}

function openDeleteAccountModal(event) {
  event?.preventDefault();
  event?.stopPropagation();
  qs("#deleteAccountConfirmation").value = "";
  qs("#confirmDeleteAccount").disabled = true;
  qs("#deleteAccountBackdrop").classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeDeleteAccountModal() {
  qs("#deleteAccountBackdrop").classList.add("hidden");
  document.body.classList.remove("modal-open");
}

async function confirmDeleteAccount() {
  const button = qs("#confirmDeleteAccount");
  button.disabled = true;
  try {
    const result = await backend.deleteAccount();
    state.session = null;
    closeDeleteAccountModal();
    qs("#appShell").classList.add("hidden");
    qs("#authScreen").classList.remove("hidden");
    setAuthMode("signin");
    qs("#authStatus").innerHTML = `<strong>Account cancellato</strong><span>${result.email_sent ? "Ti abbiamo inviato una conferma via email." : "La cancellazione è stata completata."}</span>`;
  } catch (error) {
    showToast(errorMessage(error), true);
    button.disabled = false;
  }
}

qs("#notificationButton").addEventListener("pointerdown", handleAccountPanelPointer);
qs("#notificationButton").addEventListener("click", handleAccountPanelClick);
qs("#mobileMenuOpen").addEventListener("pointerdown", handleMobileMenuPointer);
qs("#mobileMenuOpen").addEventListener("click", openMobileMenu);
qs("#mobileMenuClose").addEventListener("click", closeMobileMenu);
qs("#mobileMenuBackdrop").addEventListener("click", closeMobileMenu);
qs("#mobileOpenNotifications").addEventListener("click", openMobileNotifications);
qs("#mobileNotificationClose").addEventListener("click", closeMobileNotifications);
qs("#mobileNotificationBackdrop").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) closeMobileNotifications();
});
qs("#mobileLogoutButton").addEventListener("click", () => {
  closeMobileMenu();
  qs("#logoutButton").click();
});
qs("#accountPanelLogout").addEventListener("click", () => {
  qs("#notificationPanel")?.classList.add("hidden");
  qs("#notificationButton")?.setAttribute("aria-expanded", "false");
  qs("#logoutButton").click();
});
qs("#markNotificationsRead").addEventListener("click", () => {
  localStorage.setItem(notificationStorageKey(), new Date().toISOString());
  renderNotifications();
  rememberCurrentNotifications();
});
qs("#mobileMarkNotificationsRead").addEventListener("click", () => {
  localStorage.setItem(notificationStorageKey(), new Date().toISOString());
  renderNotifications();
  rememberCurrentNotifications();
});
qs("#openProfile").addEventListener("pointerdown", handleAccountPanelPointer);
qs("#openProfile").addEventListener("click", handleAccountPanelClick);
qs("#openDeleteAccount").addEventListener("pointerup", openDeleteAccountModal);
qs("#openDeleteAccount").addEventListener("click", (event) => {
  if (event.detail > 0 && "PointerEvent" in window) return;
  openDeleteAccountModal(event);
});
qs("#closeDeleteAccount").addEventListener("pointerup", closeDeleteAccountModal);
qs("#closeDeleteAccount").addEventListener("click", (event) => {
  if (event.detail > 0 && "PointerEvent" in window) return;
  closeDeleteAccountModal(event);
});
qs("#deleteAccountConfirmation").addEventListener("input", (event) => {
  qs("#confirmDeleteAccount").disabled = event.target.value.trim().toUpperCase() !== "CANCELLA";
});
if (!window.trankuiDeleteAccountRuntime) {
  qs("#confirmDeleteAccount").addEventListener("pointerup", (event) => {
    event.preventDefault();
    if (!event.currentTarget.disabled) confirmDeleteAccount();
  });
  qs("#confirmDeleteAccount").addEventListener("click", (event) => {
    if (event.detail > 0 && "PointerEvent" in window) return;
    if (!event.currentTarget.disabled) confirmDeleteAccount();
  });
}
qs("#closeChat").addEventListener("click", closeChat);
qs("#chatBackdrop").addEventListener("click", (event) => { if (event.target === event.currentTarget) closeChat(); });
qs("#chatForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = qs("#chatInput");
  const body = input.value.trim();
  if (!body || !state.activeChatId) return;
  input.disabled = true;
  try {
    const message = await backend.sendMessage(state.activeChatId, body);
    notifyEvent({ type: "message", collaboration_id: state.activeChatId, message_id: message.id });
    input.value = "";
    state.recentMessages = backend.recentMessages ? await backend.recentMessages() : state.recentMessages;
    renderChatPage();
    await refreshChat();
  }
  catch (error) { showToast(errorMessage(error), true); }
  finally { input.disabled = false; input.focus(); }
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  closeMobileMenu();
  closeMobileNotifications();
  if (state.activeChatId) closeChat();
  if (state.activeReviewId) closeReview();
  if (!qs("#publicProfileBackdrop").classList.contains("hidden")) closePublicProfile();
  if (!qs("#deletePostBackdrop").classList.contains("hidden")) closeDeletePostModal();
  if (!qs("#deleteAccountBackdrop").classList.contains("hidden")) { qs("#deleteAccountBackdrop").classList.add("hidden"); document.body.classList.remove("modal-open"); }
});

qs("#logoutButton").addEventListener("click", async () => {
  clearInterval(state.notificationTimer);
  state.chatSubscriptions.forEach((subscription) => subscription?.unsubscribe?.());
  state.chatSubscriptions = [];
  await backend.signOut();
  state.session = null;
  state.activeChatId = null;
  state.activeChatIds = [];
  state.activeChatPeerId = null;
  qs("#chatBackdrop")?.classList.add("hidden");
  document.body.classList.remove("modal-open");
  qs("#appShell").classList.add("hidden");
  qs("#authScreen").classList.remove("hidden");
});
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
async function init() {
  try {
    redrawIcons();
    setAuthMode("signup");
    if (!backend?.configured) {
      setAuthStatus("Backend non configurato", backend?.error || "Il backend Trankui non e ancora configurato.");
      qs("#authSubmit").disabled = true;
      qs("#googleAuthButton").disabled = true;
      return;
    }
    const session = await backend.session();
    if (session) {
      if (new URLSearchParams(window.location.search).get("calendar") === "google") {
        try {
          const count = await backend.syncGoogleCalendar();
          showToast(`${count} giornate occupate importate da Google Calendar`);
          history.replaceState({}, "", window.location.pathname);
        } catch (error) {
          showToast(errorMessage(error), true);
          history.replaceState({}, "", window.location.pathname);
        }
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
  } catch (error) {
    console.error("Trankui: inizializzazione non riuscita", error);
    setAuthStatus("Accesso temporaneamente non disponibile", errorMessage(error));
    showToast(errorMessage(error), true);
  }
}

init();
