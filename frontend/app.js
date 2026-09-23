import { api, setAuthToken, clearAuthToken } from "./apiClient.js";

const THEME_KEY = "fhnwInternshipMatchTheme";
const UI_MODE_KEY = "fhnwUiMode";
const LANGUAGE_KEY = "fhnwUiLanguage";
const SAVED_INTERNSHIPS_KEY = "lycanSavedInternships";
const API_ROOT_URL = window.FHNW_API_BASE_URL.replace(/\/api$/, "");

document.title = "Lycan Internship Matcher";

const LOCAL_COMPANY_LOGOS = {
  ubs: "public/company-logos/ubs.svg",
  google: "public/company-logos/google.svg",
  novartis: "public/company-logos/novartis.svg",
  roche: "public/company-logos/roche.svg",
  swisscom: "public/company-logos/swisscom.svg",
  zuhlke: "public/company-logos/zuhlke.svg",
};
const GENERIC_COMPANY_LOGO = "public/company-logos/company-generic.svg";
const UI_TRANSLATIONS = {
  en: {
    login: "Login",
    register: "Register",
    signIn: "Sign in",
    createAccount: "Create account",
    dashboard: "Dashboard",
    recruiter: "Recruiter",
    admin: "Admin",
    logout: "Logout",
    internships: "Internships",
    darkMode: "Dark mode",
    lightMode: "Light mode",
    profile: "Profile",
    matches: "Matches",
    selectedInternship: "Selected internship",
    skillGaps: "Skill Gaps",
    pipelineTimeline: "Pipeline timeline",
    selectedApplication: "Selected application",
    posting: "Posting",
    candidates: "Candidates",
    submittedApplications: "Submitted applications",
    cv: "CV",
    recruiterKanban: "Recruiter kanban",
    platformOverview: "Platform overview",
    distribution: "Distribution",
    collectionStatus: "Collection status",
    duplicateTracking: "Duplicate tracking",
    recentActivity: "Recent activity",
    skillSignal: "Skill signal",
    postingReview: "Posting review",
    language: "EN / DE",
  },
  de: {
    login: "Login",
    register: "Registrieren",
    signIn: "Anmelden",
    createAccount: "Konto erstellen",
    dashboard: "Übersicht",
    recruiter: "Recruiter",
    admin: "Admin",
    logout: "Abmelden",
    internships: "Praktika",
    darkMode: "Dunkler Modus",
    lightMode: "Heller Modus",
    profile: "Profil",
    matches: "Treffer",
    selectedInternship: "Ausgewähltes Praktikum",
    skillGaps: "Skill-Lücken",
    pipelineTimeline: "Bewerbungsverlauf",
    selectedApplication: "Ausgewählte Bewerbung",
    posting: "Ausschreibung",
    candidates: "Kandidaten",
    submittedApplications: "Eingegangene Bewerbungen",
    cv: "Lebenslauf",
    recruiterKanban: "Recruiter-Kanban",
    platformOverview: "Plattformübersicht",
    distribution: "Verteilung",
    collectionStatus: "Aktualitätsstatus",
    duplicateTracking: "Duplikaterkennung",
    recentActivity: "Letzte Aktivität",
    skillSignal: "Skillsignal",
    postingReview: "Freigabeübersicht",
    language: "DE / EN",
  },
};

const synonymGroups = [
  ["Power BI", "Data Analysis", "Excel"],
  ["React", "TypeScript", "Node.js"],
  ["UX", "Product", "Presentation"],
  ["CRM", "Market Research", "Sales"],
  ["AI", "Python", "Data Analysis"],
  ["Business Strategy", "Consulting", "Market Research", "Presentation"],
  ["Product", "UX", "React"],
  ["Automation", "AI", "Python", "Testing"],
];

const applicationStatuses = ["Applied", "Interview", "Offer", "Rejected"];
const learningRecommendations = {
  Python: ["Course: Python for Data Analysis", "Project: automate internship scraping"],
  SQL: ["Course: SQL for Business Analytics", "Project: build a job-market dashboard"],
  AI: ["Certification: Responsible AI basics", "Project: AI CV parser prototype"],
  "Business Strategy": ["Course: Digital strategy basics", "Project: build a market-entry case"],
  React: ["Course: React and TypeScript", "Project: recruiter kanban board"],
  UX: ["Course: UX research methods", "Project: redesign application flow"],
  CRM: ["Certification: HubSpot fundamentals", "Project: CRM lead scoring model"],
  "Market Research": ["Course: European market analysis", "Project: Zurich fintech benchmark"],
  "Project Management": ["Certification: Scrum fundamentals", "Project: delivery roadmap"],
  Presentation: ["Course: Executive storytelling", "Project: pitch deck for investor presentation"],
};

let students = [];
let internships = [];
let applications = [];
let notifications = [];
let recommendations = [];
let companies = [];
let currentUser = null;
let currentStudentProfile = null;
let currentRecruiterProfile = null;
let currentCompany = null;
let adminStats = null;
let adminSources = [];
let adminAnalytics = [];
let editingStudentId = null;
let editingInternshipId = null;
let activeReviewApplicationId = null;
let activeStudentApplicationId = null;
let activeMatchInternshipId = null;
let activeCandidateId = null;
let notificationsOpen = false;
let accountMenuOpen = false;
let internshipSearchTerm = "";
let activeCategory = "all";
let searchMode = "recommended";
let activeLocationFilter = "all";
let activeThresholdFilter = 0;
let activeStatusFilter = "all";
let activeSkillFilter = "";
let recruiterCandidateSkillFilter = "";
let recruiterCandidateLocationFilter = "all";
let recruiterCandidateScoreFilter = 0;
let authMode = "login";
let currentLanguage = localStorage.getItem(LANGUAGE_KEY) || "en";
let feedbackTimer = null;
let loadingDepth = 0;
let isApplyingRoute = false;

const $ = (selector) => document.querySelector(selector);

function t(key) {
  return UI_TRANSLATIONS[currentLanguage]?.[key] || UI_TRANSLATIONS.en[key] || key;
}

function setText(selector, value) {
  const node = $(selector);
  if (node) node.textContent = value;
}

function formatDisplayDate(value, fallback = "Flexible") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function formatTimestamp(value, fallback = "Unknown") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function splitPreferences(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function mapStudentProfile(profile) {
  if (!profile) return null;
  return {
    id: profile.id,
    userId: profile.userId,
    name: `${profile.firstName} ${profile.lastName}`.trim(),
    firstName: profile.firstName,
    lastName: profile.lastName,
    program: profile.degreeProgram,
    semester: profile.semester,
    location: profile.locationPreference || "Switzerland",
    languages: profile.languages?.length ? profile.languages : ["German", "English"],
    skills: (profile.skills || []).map((item) => item.skill.name),
    skillDetails: profile.skills || [],
    interests: splitPreferences(profile.industryPreference).map(normalized),
    experience:
      profile.projects?.length
        ? profile.projects.map((project) => project.title)
        : ["FHNW portfolio project", "Applied internship profile"],
    cvSummary:
      profile.cvSummary ||
      "FHNW student profile with project work, skill evidence, and internship readiness signals.",
    cvUrl: profile.cvUrl || `${normalized(`${profile.firstName} ${profile.lastName}`).replaceAll(" ", "-")}-cv.pdf`,
    avatarUrl: profile.avatarUrl || "",
    availability: formatDisplayDate(profile.availability),
    availabilityRaw: profile.availability,
    mode: profile.mode || "Hybrid",
    raw: profile,
  };
}

function mapInternship(internship) {
  const requirements = internship.requirements || [];
  const required = requirements.filter((item) => item.weight >= 0.5).map((item) => item.skill.name);
  const preferred = requirements.filter((item) => item.weight < 0.5).map((item) => item.skill.name);
  const source = internship.sources?.[0];
  return {
    id: internship.id,
    companyId: internship.companyId,
    company: internship.company?.name || "Unknown company",
    title: internship.title,
    description: internship.description,
    location: internship.location || "Switzerland",
    mode:
      internship.workMode === "onsite"
        ? "On-site"
        : internship.workMode === "remote"
          ? "Remote"
          : "Hybrid",
    status: internship.status === "open" ? "Approved" : internship.status === "draft" ? "Pending review" : "Closed",
    required,
    preferred,
    interests: splitPreferences(internship.company?.industry).map(normalized),
    starts: formatDisplayDate(internship.deadline, "Rolling"),
    sourceName: source?.platformName || "Company career page",
    sourceUrl: source?.sourceUrl || "#",
    sourceType: source?.sourceType || "company_site",
    collectedAt: formatTimestamp(source?.collectedAt || internship.postedDate, "Not collected yet"),
    isActive: source?.isActive ?? internship.status === "open",
    externalPostingId: source?.externalPostingId || internship.id,
    duplicateGroup: internship.duplicateKey || internship.id,
    raw: internship,
  };
}

function mapApplication(application) {
  return {
    id: application.id,
    studentId: application.studentId,
    internshipId: application.internshipId,
    date: formatTimestamp(application.applicationDate),
    status: application.status,
    notes: application.recruiterNotes || "",
    student: application.student ? mapStudentProfile(application.student) : null,
    internship: application.internship ? mapInternship(application.internship) : null,
    raw: application,
  };
}

function mapNotification(notification) {
  return {
    id: notification.id,
    target: notification.studentId || notification.recruiterId || "system",
    message: notification.message,
    type: notification.type,
    isRead: notification.isRead,
    createdAt: formatTimestamp(notification.createdAt),
    raw: notification,
  };
}

function showAppShell() {
  $("#publicShell").classList.add("is-hidden");
  $("#appShell").classList.remove("is-hidden");
  localStorage.setItem(UI_MODE_KEY, "app");
}

function showPublicShell() {
  $("#appShell").classList.add("is-hidden");
  $("#publicShell").classList.remove("is-hidden");
  localStorage.setItem(UI_MODE_KEY, "public");
}

function setAuthMode(mode) {
  authMode = mode === "register" ? "register" : "login";
  $("#authCard")?.classList.toggle("is-register", authMode === "register");
  const loginFace = $("#authFaceLogin");
  const registerFace = $("#authFaceRegister");
  if (loginFace) {
    const active = authMode === "login";
    loginFace.classList.toggle("is-inactive", !active);
    loginFace.setAttribute("aria-hidden", active ? "false" : "true");
    loginFace.toggleAttribute("inert", !active);
  }
  if (registerFace) {
    const active = authMode === "register";
    registerFace.classList.toggle("is-inactive", !active);
    registerFace.setAttribute("aria-hidden", active ? "false" : "true");
    registerFace.toggleAttribute("inert", !active);
  }
}

function clearAppData() {
  students = [];
  internships = [];
  applications = [];
  notifications = [];
  recommendations = [];
  companies = [];
  adminStats = null;
  adminSources = [];
  adminAnalytics = [];
  editingStudentId = null;
  editingInternshipId = null;
  activeReviewApplicationId = null;
  activeStudentApplicationId = null;
  activeMatchInternshipId = null;
}

function hideFeedback() {
  const banner = $("#feedbackBanner");
  if (!banner) return;
  banner.classList.add("is-hidden");
  banner.classList.remove("is-success", "is-error", "is-info");
  banner.textContent = "";
}

function setAppLoading(isLoading, title = "Loading workspace", message = "Syncing your dashboard with the backend.") {
  const overlay = $("#appLoading");
  if (!overlay) return;
  if (isLoading) {
    loadingDepth += 1;
    $("#appLoadingTitle").textContent = title;
    $("#appLoadingMessage").textContent = message;
    overlay.classList.remove("is-hidden");
    return;
  }

  loadingDepth = Math.max(0, loadingDepth - 1);
  if (loadingDepth === 0) {
    overlay.classList.add("is-hidden");
  }
}

function setButtonBusy(button, busyLabel = "Saving...") {
  if (!button) return () => {};
  const originalLabel = button.dataset.originalLabel || button.textContent;
  button.dataset.originalLabel = originalLabel;
  button.disabled = true;
  button.classList.add("is-loading");
  button.textContent = busyLabel;
  return () => {
    button.disabled = false;
    button.classList.remove("is-loading");
    button.textContent = originalLabel;
  };
}

function setControlBusy(control) {
  if (!control) return () => {};
  control.disabled = true;
  control.classList.add("is-loading");
  return () => {
    control.disabled = false;
    control.classList.remove("is-loading");
  };
}

function showFeedback(message, type = "info") {
  const banner = $("#feedbackBanner");
  if (!banner) return;
  if (feedbackTimer) clearTimeout(feedbackTimer);
  banner.textContent = message;
  banner.classList.remove("is-hidden", "is-success", "is-error", "is-info");
  banner.classList.add(type === "success" ? "is-success" : type === "error" ? "is-error" : "is-info");
  feedbackTimer = window.setTimeout(() => {
    hideFeedback();
  }, 3800);
}

function allowedStatusOptions(status) {
  if (status === "Applied") return ["Applied", "Interview", "Rejected"];
  if (status === "Interview") return ["Interview", "Offer", "Rejected"];
  if (status === "Offer") return ["Offer"];
  if (status === "Rejected") return ["Rejected"];
  return [status];
}

function internshipSearchText(internship) {
  return [
    internship.title,
    internship.company,
    internship.location,
    internship.sourceName,
    internship.sourceType,
    internship.description,
    ...(internship.required || []),
    ...(internship.preferred || []),
    ...(internship.interests || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function internshipMatchesCategory(internship) {
  if (activeCategory === "all") return true;
  const haystack = internshipSearchText(internship);
  return haystack.includes(activeCategory);
}

function resetInternshipFilters() {
  activeCategory = "all";
  activeLocationFilter = "all";
  activeThresholdFilter = 0;
  activeStatusFilter = "all";
  activeSkillFilter = "";
  internshipSearchTerm = "";
  $("#internshipSearch").value = "";
  $("#globalInternshipSearch").value = "";
  $("#locationFilter").value = "all";
  $("#thresholdFilter").value = "0";
  $("#statusFilter").value = "all";
  $("#skillFilter").value = "";
  document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.toggle("is-active", chip.dataset.category === "all"));
  renderStudentMatches();
}

function internshipMatchesFilters(student, internship, result) {
  if (!internshipMatchesCategory(internship)) return false;
  if (internshipSearchTerm && !internshipSearchText(internship).includes(internshipSearchTerm)) return false;
  if (activeLocationFilter !== "all" && normalized(internship.location) !== normalized(activeLocationFilter)) return false;
  if (activeThresholdFilter && result.score < activeThresholdFilter) return false;
  if (activeSkillFilter) {
    const skillsHaystack = [...(internship.required || []), ...(internship.preferred || [])].map(normalized);
    if (!skillsHaystack.some((skill) => skill.includes(activeSkillFilter))) return false;
  }
  const application = student ? getApplication(student.id, internship.id) : null;
  if (activeStatusFilter === "applied" && !application) return false;
  if (activeStatusFilter === "unapplied" && application) return false;
  if (activeStatusFilter === "open" && application) return false;
  return true;
}

async function resetData() {
  if (!currentUser) {
    clearAppData();
    showPublicShell();
    showFeedback("Sign in to load your current workspace.", "info");
    return;
  }
  await refreshAppState();
}

function listFromInput(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function writeForm(form, values) {
  Object.entries(values).forEach(([name, value]) => {
    if (form.elements[name]) {
      form.elements[name].value = Array.isArray(value) ? value.join(", ") : value;
    }
  });
}

function fillStudentForm(student) {
  if (!student) return;
  editingStudentId = student.id;
  writeForm($("#studentForm"), student);
  const cvStatus = $("#cvUploadStatus");
  if (cvStatus) {
    cvStatus.textContent = student.cvUrl ? `Stored CV: ${student.cvUrl}` : "No CV stored yet.";
  }
  const avatarPreview = $("#profileAvatarPreview");
  if (avatarPreview) avatarPreview.src = absoluteAssetUrl(student.avatarUrl);
  $("#studentSubmit").textContent = "Save student";
}

function fillInternshipForm(internship) {
  if (!internship) return;
  editingInternshipId = internship.id;
  writeForm($("#internshipForm"), internship);
  $("#internshipSubmit").textContent = "Save internship";
}

function prepareNewStudent() {
  editingStudentId = null;
  $("#studentForm").reset();
  $("#studentForm").elements.semester.value = 4;
  $("#studentForm").elements.mode.value = "Hybrid";
  if ($("#cvUploadStatus")) $("#cvUploadStatus").textContent = "No CV uploaded in this session.";
  if ($("#profileAvatarPreview")) $("#profileAvatarPreview").src = "public/avatars/default-student.png";
  $("#studentSubmit").textContent = "Create student";
}

function prepareNewInternship() {
  editingInternshipId = null;
  $("#internshipForm").reset();
  $("#internshipSubmit").textContent = "Create internship";
}

function applyTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  localStorage.setItem(THEME_KEY, theme);
  $("#themeToggle").textContent = theme === "dark" ? t("lightMode") : t("darkMode");
}

function studentFromForm(baseStudent) {
  const form = $("#studentForm");
  const data = new FormData(form);
  return {
    ...baseStudent,
    name: data.get("name").trim() || baseStudent.name,
    program: data.get("program").trim() || baseStudent.program,
    semester: Number(data.get("semester")) || baseStudent.semester,
    location: data.get("location").trim() || baseStudent.location,
    languages: listFromInput(data.get("languages")).length ? listFromInput(data.get("languages")) : baseStudent.languages,
    skills: listFromInput(data.get("skills")).length ? listFromInput(data.get("skills")) : baseStudent.skills,
    interests: listFromInput(data.get("interests")).length ? listFromInput(data.get("interests")).map(normalized) : baseStudent.interests,
    availability: data.get("availability").trim() || baseStudent.availability,
    mode: data.get("mode") || baseStudent.mode,
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalized(value) {
  return String(value).toLowerCase().trim();
}

function absoluteCvUrl(value) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${API_ROOT_URL}${value}`;
  return "";
}

function absoluteAssetUrl(value, fallback = "public/avatars/default-student.png") {
  if (!value) return fallback;
  if (/^https?:\/\//i.test(value) || value.startsWith("data:image/")) return value;
  if (value.startsWith("/")) return `${API_ROOT_URL}${value}`;
  return value;
}

function savedInternshipIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(SAVED_INTERNSHIPS_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function isInternshipSaved(internshipId) {
  return savedInternshipIds().has(internshipId);
}

function toggleSavedInternship(internshipId) {
  const saved = savedInternshipIds();
  const nextSaved = !saved.has(internshipId);
  if (nextSaved) saved.add(internshipId);
  else saved.delete(internshipId);
  localStorage.setItem(SAVED_INTERNSHIPS_KEY, JSON.stringify([...saved]));
  return nextSaved;
}

function renderLucideIcons(root = document) {
  window.LucideIcons?.renderAll(root);
}

function tokenize(value) {
  return String(value || "")
    .toLowerCase()
    .split(/[^a-z0-9+#]+/i)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2);
}

function addWeightedTerms(map, values, weight = 1) {
  const list = Array.isArray(values) ? values : [values];
  list.forEach((value) => {
    tokenize(value).forEach((token) => {
      map.set(token, (map.get(token) || 0) + weight);
    });
  });
  return map;
}

function cosineSimilarity(left, right) {
  const keys = new Set([...left.keys(), ...right.keys()]);
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  keys.forEach((key) => {
    const a = left.get(key) || 0;
    const b = right.get(key) || 0;
    dot += a * b;
    leftNorm += a * a;
    rightNorm += b * b;
  });
  if (!leftNorm || !rightNorm) return 0;
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

function studentEmbedding(student) {
  const embedding = new Map();
  addWeightedTerms(embedding, student.program, 1.2);
  addWeightedTerms(embedding, student.skills, 3.4);
  addWeightedTerms(embedding, student.interests, 2.2);
  addWeightedTerms(embedding, student.experience, 1.8);
  addWeightedTerms(embedding, student.cvSummary, 1.5);
  addWeightedTerms(embedding, student.location, 0.7);
  addWeightedTerms(embedding, student.mode, 0.5);
  return embedding;
}

function internshipEmbedding(internship) {
  const embedding = new Map();
  addWeightedTerms(embedding, internship.title, 2.4);
  addWeightedTerms(embedding, internship.company, 1.1);
  addWeightedTerms(embedding, internship.location, 0.8);
  addWeightedTerms(embedding, internship.description, 1.5);
  addWeightedTerms(embedding, internship.required, 3.8);
  addWeightedTerms(embedding, internship.preferred, 2.1);
  addWeightedTerms(embedding, internship.interests, 2.2);
  addWeightedTerms(embedding, internship.mode, 0.5);
  return embedding;
}

function weightedOverlap(left, right) {
  return [...left.keys()]
    .filter((key) => right.has(key))
    .map((key) => ({ key, weight: (left.get(key) || 0) + (right.get(key) || 0) }))
    .sort((a, b) => b.weight - a.weight)
    .map((item) => item.key);
}

function hasSkill(skills, target) {
  return skills.some((skill) => normalized(skill) === normalized(target));
}

function skillRelated(skill, studentSkills) {
  const group = synonymGroups.find((items) => items.some((item) => normalized(item) === normalized(skill)));
  if (!group) return false;
  return group.some((item) => studentSkills.some((studentSkill) => normalized(studentSkill) === normalized(item)));
}

function calculateMatch(student, internship) {
  const exactRequired = internship.required.filter((skill) => hasSkill(student.skills, skill));
  const exactPreferred = internship.preferred.filter((skill) => hasSkill(student.skills, skill));
  const related = [...internship.required, ...internship.preferred].filter(
    (skill) => !hasSkill(student.skills, skill) && skillRelated(skill, student.skills),
  );
  const missing = internship.required.filter((skill) => !hasSkill(student.skills, skill) && !related.includes(skill));
  const interestOverlap = internship.interests.filter((interest) =>
    student.interests.some((studentInterest) => normalized(studentInterest) === normalized(interest)),
  );
  const locationFit = normalized(student.location) === normalized(internship.location) ? 1 : 0;
  const modeFit = normalized(student.mode) === normalized(internship.mode) ? 1 : normalized(internship.mode) === "hybrid" ? 0.6 : 0;
  const startFit = normalized(student.availability) === normalized(internship.starts) ? 1 : 0.5;
  const profileVector = studentEmbedding(student);
  const internshipVector = internshipEmbedding(internship);
  const semanticSimilarity = cosineSimilarity(profileVector, internshipVector);
  const requiredCoverage = internship.required.length ? exactRequired.length / internship.required.length : 0.6;
  const preferredCoverage = internship.preferred.length ? exactPreferred.length / internship.preferred.length : 0.4;
  const categoryFit = internship.interests.length
    ? interestOverlap.length / internship.interests.length
    : internship.interests.some((interest) => normalized(student.program).includes(normalized(interest)))
      ? 0.7
      : 0.35;
  const availabilityFit = (locationFit * 0.45) + (modeFit * 0.3) + (startFit * 0.25);
  const overlapTokens = weightedOverlap(profileVector, internshipVector).filter((token) => !["intern", "internship", "student"].includes(token));
  const score = Math.min(
    99,
    Math.round(
      (semanticSimilarity * 0.55 +
        requiredCoverage * 0.2 +
        preferredCoverage * 0.08 +
        categoryFit * 0.09 +
        availabilityFit * 0.08) * 100,
    ),
  );

  return {
    score,
    semanticSimilarity,
    exactRequired,
    exactPreferred,
    related,
    missing,
    interestOverlap,
    locationFit,
    modeFit,
    startFit,
    requiredCoverage,
    preferredCoverage,
    categoryFit,
    availabilityFit,
    overlapTokens,
  };
}

function tagList(items) {
  return `<div class="tag-row">${items.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("")}</div>`;
}

function renderStudentProfile(student) {
  const cvLink = absoluteCvUrl(student.cvUrl);
  $("#studentProfile").innerHTML = `
    <h3>${escapeHtml(student.name)}</h3>
    <p class="meta">${escapeHtml(student.program)}<br>Semester ${escapeHtml(student.semester)} - ${escapeHtml(student.location)} - ${escapeHtml(student.mode)}<br>Available ${escapeHtml(student.availability)}</p>
    <div class="profile-stats">
      <div><span>Degree</span><strong>Business IT</strong></div>
      <div><span>Market</span><strong>${escapeHtml(student.location)}</strong></div>
      <div><span>Availability</span><strong>${escapeHtml(student.availability.split(" ")[0] || student.availability)}</strong></div>
    </div>
    ${tagList(student.skills)}
    <p class="meta">Experience: ${student.experience.map(escapeHtml).join(", ")}</p>
    <p class="meta">${student.languages.map(escapeHtml).join(" - ")}</p>
    <p class="meta">CV file: ${cvLink ? `<a class="posting-link" href="${escapeHtml(cvLink)}" target="_blank" rel="noreferrer">Open CV</a>` : escapeHtml(student.cvUrl || "Not uploaded yet")}</p>
    <p class="meta">${escapeHtml(student.cvSummary)}</p>
  `;
}

function renderInternshipProfile(internship) {
  $("#internshipProfile").innerHTML = `
    <h3>${escapeHtml(internship.title)}</h3>
    <p class="meta">${escapeHtml(internship.company)}<br>${escapeHtml(internship.location)} - ${escapeHtml(internship.mode)}<br>Starts ${escapeHtml(internship.starts)}</p>
    <div class="profile-stats">
      <div><span>Status</span><strong>${escapeHtml(internship.status.replace(" review", ""))}</strong></div>
      <div><span>Market</span><strong>${escapeHtml(internship.location)}</strong></div>
      <div><span>Mode</span><strong>${escapeHtml(internship.mode)}</strong></div>
    </div>
    ${tagList(internship.required)}
    <p class="meta">Preferred: ${internship.preferred.map(escapeHtml).join(", ")}</p>
  `;
}

function explanation(student, internship, result) {
  const strongest = [...new Set([...result.exactRequired, ...result.exactPreferred, ...result.overlapTokens])].slice(0, 4);
  const fitParts = [];
  if (strongest.length) fitParts.push(`matches ${strongest.join(", ")}`);
  if (result.interestOverlap.length) fitParts.push(`aligns with ${result.interestOverlap.join(" and ")}`);
  else if (result.categoryFit >= 0.55) fitParts.push(`shows strong category fit for this internship`);
  if (result.locationFit) fitParts.push(`fits the ${student.location} location preference`);
  if (result.modeFit) fitParts.push(`supports ${student.mode.toLowerCase()} work`);
  return `This recommendation ${fitParts.join(", ")}. Semantic similarity score: ${Math.round((result.semanticSimilarity || 0) * 100)}%. ${result.missing.length ? `Main growth area: ${result.missing.join(", ")}.` : "All required skills are covered."}`;
}

function matchFit(score) {
  if (score >= 90) return { label: "Strong fit", detail: "Skills and experience align", tone: "strong" };
  if (score >= 80) return { label: "Good fit", detail: "Strong skills alignment", tone: "good" };
  if (score >= 70) return { label: "Potential fit", detail: "Relevant transferable skills", tone: "potential" };
  return { label: "Lower fit", detail: "Useful stretch opportunity", tone: "lower" };
}

function compactSkillTags(items, limit = 3) {
  const uniqueItems = [...new Set(items.filter(Boolean))];
  const visibleItems = uniqueItems.slice(0, limit);
  const remaining = uniqueItems.length - visibleItems.length;
  return `
    <div class="match-skill-row">
      ${visibleItems.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("")}
      ${remaining > 0 ? `<span class="tag tag-more">+${remaining}</span>` : ""}
    </div>
  `;
}

function compactSummary(value, maxLength = 138) {
  const sentence = String(value || "").split(".")[0].trim();
  if (sentence.length <= maxLength) return sentence;
  return `${sentence.slice(0, maxLength - 1).trimEnd()}...`;
}

function companyInitials(companyName) {
  return String(companyName || "Company")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function normalizeCompanyName(companyName) {
  return String(companyName || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(ag|switzerland|group|holding|ltd|inc)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function companyLogoData(internship) {
  const company = typeof internship?.company === "object" ? internship.company : null;
  const name = company?.name || internship?.company || "Company";
  const normalizedName = normalizeCompanyName(name);
  const localLogo = Object.entries(LOCAL_COMPANY_LOGOS).find(([key]) => normalizedName.includes(key))?.[1] || "";
  return {
    name,
    logoUrl: company?.logoUrl || internship?.companyLogoUrl || internship?.logoUrl || localLogo || GENERIC_COMPANY_LOGO,
  };
}

function companyLogoMarkup(company) {
  const fallback = `<span class="company-logo-fallback" aria-label="${escapeHtml(company.name)}">${escapeHtml(companyInitials(company.name))}</span>`;
  return `<span class="company-logo"><img src="${escapeHtml(company.logoUrl || GENERIC_COMPANY_LOGO)}" data-fallback="${GENERIC_COMPANY_LOGO}" alt="${escapeHtml(company.name)} logo" onerror="if(this.dataset.fallback){this.src=this.dataset.fallback;this.dataset.fallback=''}else{this.hidden=true;this.nextElementSibling.style.display='grid'}">${fallback}</span>`;
}

function matchCard(primary, secondary, result, details) {
  const fit = matchFit(result.score);
  const skills = [...details.good, ...details.missing.map((item) => item.replace(/^Learn\s+|^Missing\s+/i, ""))];
  const companyHeader = details.company
    ? `<div class="company-header"><div class="company-identity">${companyLogoMarkup(details.company)}<div><strong>${escapeHtml(details.company.name)}</strong><span>${escapeHtml(details.companyMeta || secondary)}</span></div></div><span class="posted-date">${escapeHtml(details.postedLabel || "Recently posted")}</span></div>`
    : "";
  return `
    <article class="match-card ${details.selected ? "is-selected" : ""}" ${details.cardId ? `data-card-id="${escapeHtml(details.cardId)}"` : ""}>
      <div class="match-card-content">
        ${companyHeader}
        <div class="match-card-heading">
          <h3>${escapeHtml(primary)}</h3>
          <p class="meta">${escapeHtml(secondary)}</p>
        </div>
        ${details.source || ""}
        <p class="match-card-summary">${escapeHtml(compactSummary(details.explain))}</p>
        ${compactSkillTags(skills)}
      </div>
      <div class="match-card-footer">
        <div class="match-evaluation">
          <div class="match-score-box">
            <strong>${result.score}%</strong>
            <span>Match</span>
          </div>
          <div class="match-fit-box is-${fit.tone}">
            <strong>${fit.label}</strong>
            <span>${fit.detail}</span>
          </div>
        </div>
        ${details.action ? `<div class="match-card-actions">${details.action}</div>` : ""}
      </div>
    </article>
  `;
}

function getApplication(studentId, internshipId) {
  return applications.find((application) => application.studentId === studentId && application.internshipId === internshipId);
}

function selectedStudent() {
  return students.find((student) => student.id === $("#studentSelect").value);
}

function currentRole() {
  return currentUser?.role || "guest";
}

function routeParam() {
  return new URLSearchParams(window.location.search).get("route");
}

function normalizeRoute(route) {
  if (!route) return "/";
  const normalizedRoute = route.startsWith("/") ? route : `/${route}`;
  return normalizedRoute.length > 1 ? normalizedRoute.replace(/\/+$/, "") : normalizedRoute;
}

function defaultRouteForRole(role = currentRole()) {
  if (role === "student") return "/student";
  if (role === "recruiter") return "/recruiter";
  if (role === "admin") return "/admin";
  return authMode === "register" ? "/register" : "/login";
}

function currentRoute() {
  return normalizeRoute(routeParam() || defaultRouteForRole());
}

function setRoute(route, { replace = false } = {}) {
  const normalizedRoute = normalizeRoute(route);
  const url = new URL(window.location.href);
  url.searchParams.set("route", normalizedRoute);
  const nextUrl = `${url.pathname}?${url.searchParams.toString()}`;
  const currentUrl = `${window.location.pathname}${window.location.search}`;
  if (nextUrl === currentUrl) return;
  if (replace) {
    window.history.replaceState({ route: normalizedRoute }, "", nextUrl);
  } else {
    window.history.pushState({ route: normalizedRoute }, "", nextUrl);
  }
}

function navigateTo(route, options = {}) {
  setRoute(route, options);
  applyRoute();
  if (currentUser) {
    renderAll();
  }
}

function routeViewId(route = currentRoute()) {
  if (route.startsWith("/recruiter")) return "companyView";
  if (route.startsWith("/admin")) return "adminView";
  return "studentView";
}

function applyRoute() {
  if (isApplyingRoute) return;
  isApplyingRoute = true;
  try {
    let route = currentRoute();
    if (!routeParam()) {
      setRoute(route, { replace: true });
    }

    if (!currentUser) {
      if (route !== "/login" && route !== "/register") {
        route = "/login";
        setRoute(route, { replace: true });
      }
      setAuthMode(route === "/register" ? "register" : "login");
      showPublicShell();
      return;
    }

    const role = currentRole();
    if (role === "student" && !route.startsWith("/student")) {
      route = "/student";
      setRoute(route, { replace: true });
    } else if (role === "recruiter" && !route.startsWith("/recruiter")) {
      route = "/recruiter";
      setRoute(route, { replace: true });
    } else if (role === "admin" && !route.startsWith("/admin")) {
      route = "/admin";
      setRoute(route, { replace: true });
    }

    const segments = route.split("/").filter(Boolean);

    if (role === "student") {
      if (segments[1] === "matches" && segments[2]) {
        if (internships.some((internship) => internship.id === segments[2])) {
          activeMatchInternshipId = segments[2];
        } else {
          activeMatchInternshipId = null;
          route = "/student/matches";
          setRoute(route, { replace: true });
        }
      } else if (segments[1] === "applications" && segments[2]) {
        if (applications.some((application) => application.id === segments[2])) {
          activeStudentApplicationId = segments[2];
        } else {
          activeStudentApplicationId = null;
          route = "/student/applications";
          setRoute(route, { replace: true });
        }
      }
    }

    if (role === "recruiter") {
      if (segments[1] === "postings" && segments[2]) {
        if (internships.some((internship) => internship.id === segments[2])) {
          $("#internshipSelect").value = segments[2];
        } else {
          route = "/recruiter";
          setRoute(route, { replace: true });
        }
      }

      if (segments[1] === "applications" && segments[2]) {
        const application = applications.find((item) => item.id === segments[2]);
        if (application) {
          activeReviewApplicationId = application.id;
          $("#internshipSelect").value = application.internshipId;
        } else {
          route = "/recruiter";
          setRoute(route, { replace: true });
        }
      }
    }

    setActiveView(routeViewId(route));
    showAppShell();
  } finally {
    isApplyingRoute = false;
  }
}

function setActiveView(viewId) {
  document.querySelectorAll(".side-nav button").forEach((item) => item.classList.toggle("is-active", item.dataset.view === viewId));
  document.querySelectorAll(".dashboard-view").forEach((view) => view.classList.toggle("is-visible", view.id === viewId));
}

function prettyRole(role) {
  if (role === "student") return "Student";
  if (role === "recruiter") return "Recruiter";
  if (role === "admin") return "Admin";
  return "App";
}

function applyLanguage() {
  document.documentElement.lang = currentLanguage === "de" ? "de" : "en";
  setText("#languageToggle", t("language"));
  setText("#openLogin", t("login"));
  setText("#openRegister", t("register"));
  setText("#showRegisterCard", t("createAccount"));
  setText("#showLoginCard", t("login"));
  setText("#studentNavButton", t("dashboard"));
  setText("#recruiterNavButton span:last-child", t("dashboard"));
  setText("#adminNavButton", t("admin"));
  setText("#logoutButton", t("logout"));
  setText("#authFaceLogin .eyebrow", t("login"));
  setText("#authFaceLogin h2", t("signIn"));
  setText("#authFaceRegister .eyebrow", t("register"));
  setText("#authFaceRegister h2", t("createAccount"));
  setText(".topbar h1", t("internships"));
  setText("#adminView .view-intro h2", t("dashboard"));
  setText("#studentView .panel:nth-of-type(1) .panel-header h2", t("profile"));
  setText("#studentView .panel:nth-of-type(2) .panel-header h2", t("matches"));
  setText("#studentView .panel:nth-of-type(3) .panel-header h2", t("selectedInternship"));
  setText("#studentView .panel:nth-of-type(4) .panel-header h2", t("skillGaps"));
  setText("#studentView .panel:nth-of-type(5) .panel-header h2", t("pipelineTimeline"));
  setText("#studentView .panel:nth-of-type(6) .panel-header h2", t("selectedApplication"));
  setText("#adminView .wide-panel:first-of-type .panel-header h2", t("platformOverview"));
  setText("#adminView .panel:nth-of-type(2) .panel-header h2", t("distribution"));
  setText("#adminView .panel:nth-of-type(3) .panel-header h2", t("collectionStatus"));
  setText("#adminView .panel:nth-of-type(4) .panel-header h2", t("duplicateTracking"));
  setText("#adminView .admin-side-stack .panel:nth-of-type(1) .panel-header h2", t("recentActivity"));
  setText("#adminView .admin-side-stack .panel:nth-of-type(2) .panel-header h2", t("skillSignal"));
  setText("#adminView .wide-panel:last-of-type .panel-header h2", t("postingReview"));
  $("#themeToggle").textContent = document.body.classList.contains("dark") ? t("lightMode") : t("darkMode");
  updateSessionChrome();
}

window.toggleAppLanguage = () => {
  currentLanguage = currentLanguage === "en" ? "de" : "en";
  localStorage.setItem(LANGUAGE_KEY, currentLanguage);
  applyLanguage();
};

function updateSessionChrome() {
  $("#sessionRoleLabel").textContent = prettyRole(currentRole());
  $("#sessionUserLabel").textContent = currentUser?.email || "Not signed in";
  const profile = currentStudentProfile || students.find((student) => student.id === currentUser?.studentId) || selectedStudent();
  const recruiterName = currentRecruiterProfile ? `${currentRecruiterProfile.firstName || ""} ${currentRecruiterProfile.lastName || ""}`.trim() : "";
  const name = recruiterName || profile?.name || currentUser?.email?.split("@")[0] || "Your profile";
  const program = currentRecruiterProfile ? `${currentCompany?.name || "Company"} · ${currentRecruiterProfile.role || "Recruiter"}` : (profile?.program || prettyRole(currentRole()));
  const initials = companyInitials(name);
  const avatarUrl = absoluteAssetUrl(profile?.avatarUrl);
  setText("#accountName", name);
  setText("#accountProgram", program);
  setText("#accountAvatar", initials);
  $("#accountAvatarImage")?.setAttribute("src", avatarUrl);
  $("#accountAvatarImage")?.setAttribute("alt", `${name} profile photo`);
  setText("#settingsName", name);
  setText("#settingsEmail", currentUser?.email || "Not signed in");
  setText("#settingsAvatar", initials);
  $("#settingsAvatarImage")?.setAttribute("src", avatarUrl);
  $("#settingsAvatarImage")?.setAttribute("alt", `${name} profile photo`);
}

function setAccountMenuOpen(nextOpen) {
  accountMenuOpen = Boolean(nextOpen) && Boolean(currentUser);
  const toggle = $("#accountToggle");
  const dropdown = $("#accountDropdown");
  if (!toggle || !dropdown) return;
  toggle.setAttribute("aria-expanded", accountMenuOpen ? "true" : "false");
  dropdown.hidden = !accountMenuOpen;
}

function setAccountSettingsOpen(nextOpen) {
  const backdrop = $("#accountSettingsBackdrop");
  if (!backdrop) return;
  backdrop.hidden = !nextOpen;
  if (nextOpen) $("#closeAccountSettings")?.focus();
}

function applyRoleLayout() {
  const role = currentRole();
  $("#studentNavButton").classList.toggle("is-role-hidden", role === "recruiter");
  document.querySelectorAll(".student-nav-item").forEach((item) => item.classList.toggle("is-role-hidden", role !== "student"));
  document.querySelectorAll(".recruiter-nav-item").forEach((item) => item.classList.toggle("is-role-hidden", role !== "recruiter"));
  $("#adminNavButton").classList.toggle("is-role-hidden", role !== "admin");
  $("#studentSelect").classList.toggle("is-role-hidden", role === "student");
  $("#newStudent").classList.toggle("is-role-hidden", role !== "admin");
  $("#uploadCvButton").classList.toggle("is-role-hidden", role !== "student");
  $("#parseCvButton").classList.toggle("is-role-hidden", role !== "student");
  $("#cvFileField").classList.toggle("is-role-hidden", role !== "student");
  $("#cvUploadStatus").classList.toggle("is-role-hidden", role !== "student");
  $("#internshipSelect").classList.toggle("is-role-hidden", role === "recruiter" && internships.length <= 1);
  $("#newInternship").classList.toggle("is-role-hidden", role !== "recruiter" && role !== "admin");
  if (role === "recruiter") {
    document.querySelector('[data-account-action="profile"]')?.replaceChildren(document.createTextNode("My Profile"));
    document.querySelector('[data-account-action="preferences"]')?.replaceChildren(document.createTextNode("Recruitment Preferences"));
  }
  setActiveView(routeViewId());
}

function logout() {
  clearAuthToken();
  currentUser = null;
  currentStudentProfile = null;
  currentRecruiterProfile = null;
  currentCompany = null;
  adminStats = null;
  adminSources = [];
  adminAnalytics = [];
  setAuthMode("login");
}

function mapRecommendation(item) {
  const calculated = calculateMatch(currentStudentProfile || selectedStudent() || students[0], mapInternship(item.internship));
  return {
    internship: mapInternship(item.internship),
    result: {
      ...calculated,
      score: item.matchScore,
    },
    explain: item.explanation,
    scores: item.scores,
  };
}

async function refreshAppState() {
  setAppLoading(true, "Refreshing workspace", "Loading the latest profiles, internships, applications, and notifications.");
  try {
    if (!currentUser) {
      clearAppData();
      return;
    }

    if (currentRole() === "student") {
      const profile = mapStudentProfile(await api.studentMe());
      currentStudentProfile = profile;
      currentRecruiterProfile = null;
      currentCompany = null;
      const [internshipData, applicationData, notificationData, recommendationData] = await Promise.all([
        api.internships(),
        api.studentApplications(profile.id),
        api.notifications(),
        api.recommendations(profile.id),
      ]);
      students = [profile];
      internships = internshipData.map(mapInternship);
      applications = applicationData.map(mapApplication);
      notifications = notificationData.map(mapNotification);
      recommendations = recommendationData.map(mapRecommendation);
      companies = [];
      adminStats = null;
      adminSources = [];
      adminAnalytics = [];
      renderAll({ studentId: profile.id });
      return;
    }

    if (currentRole() === "recruiter") {
      const recruiter = await api.recruiterMe();
      currentRecruiterProfile = recruiter;
      currentCompany = recruiter.company;
      currentStudentProfile = null;
      const [studentData, internshipData, applicationData, notificationData] = await Promise.all([
        api.students(),
        api.internships(),
        api.recruiterApplications(recruiter.id),
        api.notifications(),
      ]);
      students = studentData.map(mapStudentProfile);
      internships = internshipData
        .map(mapInternship)
        .filter((internship) => !recruiter.companyId || internship.companyId === recruiter.companyId);
      applications = applicationData.map(mapApplication);
      notifications = notificationData.map(mapNotification);
      recommendations = [];
      companies = recruiter.company ? [recruiter.company] : [];
      adminStats = null;
      adminSources = [];
      adminAnalytics = [];
      renderAll({ internshipId: internships[0]?.id });
      return;
    }

    const [studentData, internshipData, applicationData, notificationData, statsData, sourceData, analyticsData, companyData] = await Promise.all([
      api.students(),
      api.internships(),
      api.applications(),
      api.notifications(),
      api.adminStats(),
      api.adminSources(),
      api.adminAnalytics(),
      api.companies(),
    ]);
    students = studentData.map(mapStudentProfile);
    internships = internshipData.map(mapInternship);
    applications = applicationData.map(mapApplication);
    notifications = notificationData.map(mapNotification);
    recommendations = [];
    companies = companyData;
    currentStudentProfile = null;
    currentRecruiterProfile = null;
    currentCompany = null;
    adminStats = statsData;
    adminSources = sourceData;
    adminAnalytics = analyticsData;
    renderAll();
  } finally {
    setAppLoading(false);
  }
}

async function applyForInternship(internshipId) {
  const student = selectedStudent();
  const internship = internships.find((item) => item.id === internshipId);
  if (!student || !internship || getApplication(student.id, internship.id)) return;
  await api.apply({ studentId: student.id, internshipId: internship.id });
  await refreshAppState();
  renderAll({ studentId: student.id, internshipId: internship.id });
  showFeedback(`Application submitted for ${internship.title}.`, "success");
}

async function updateApplicationStatus(applicationId, status) {
  const application = applications.find((item) => item.id === applicationId);
  if (!application) return;
  await api.updateApplicationStatus(applicationId, { status });
  await refreshAppState();
  showFeedback(`Application status updated to ${status}.`, "success");
}

async function saveRecruiterNotes(applicationId, notes) {
  const application = applications.find((item) => item.id === applicationId);
  if (!application) throw new Error("Application not found");
  await api.updateApplicationStatus(applicationId, {
    status: application.status,
    recruiterNotes: notes,
  });
  await refreshAppState();
  activeReviewApplicationId = applicationId;
  renderCandidateMatches();
  showFeedback("Recruiter notes saved.", "success");
}

async function markNotificationRead(notificationId) {
  await api.markNotificationRead(notificationId);
  await refreshAppState();
  showFeedback("Notification marked as read.", "success");
}

function reviewApplication(applicationId) {
  activeReviewApplicationId = applicationId;
  renderCvReview(applicationId);
  renderCandidateMatches();
}

function profileStrength(student) {
  const checkpoints = [
    student.name,
    student.program,
    student.location,
    student.availability,
    student.mode,
    student.skills.length >= 4,
    student.interests.length >= 2,
    student.languages.length >= 2,
    student.experience.length >= 2,
    student.cvSummary,
  ];
  const completed = checkpoints.filter(Boolean).length;
  return Math.round((completed / checkpoints.length) * 100);
}

function renderStudentOverview(student, visibleMatches) {
  const activeSources = new Set(internships.filter((item) => item.isActive).map((item) => item.sourceName)).size;
  const studentApplications = applications.filter((application) => application.studentId === student.id).length;
  $("#studentActiveSources").textContent = activeSources;
  $("#studentDiscoveryCount").textContent = visibleMatches.length;
  $("#studentApplicationTotal").textContent = studentApplications;
  const strength = profileStrength(student);
  $("#studentProfileStrength").textContent = `${strength}%`;
  $("#studentProfileProgress")?.style.setProperty("width", `${strength}%`);
  const firstName = student.firstName || student.name.split(" ")[0] || "there";
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";
  setText("#studentWelcome", `${greeting}, ${firstName}`);
}

function renderFilterOptions() {
  const locationFilter = $("#locationFilter");
  if (!locationFilter) return;
  const locations = [...new Set(internships.map((internship) => internship.location).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const current = activeLocationFilter;
  locationFilter.innerHTML = `<option value="all">All locations</option>${locations.map((location) => `<option value="${escapeHtml(location)}">${escapeHtml(location)}</option>`).join("")}`;
  locationFilter.value = locations.includes(current) ? current : "all";
}

function evidenceMeter(label, value) {
  const percent = Math.max(0, Math.min(100, Math.round(Number(value || 0))));
  return `
    <div class="evidence-meter">
      <div><span>${escapeHtml(label)}</span><strong>${percent}%</strong></div>
      <div class="bar" aria-label="${escapeHtml(label)}: ${percent}%"><i style="width: ${percent}%"></i></div>
    </div>
  `;
}

function renderMatchDetail(student, rankedMatches) {
  const target = $("#matchDetail");
  if (!target) return;
  const selectedEntry =
    rankedMatches.find(({ internship }) => internship.id === activeMatchInternshipId) ||
    rankedMatches[0];
  if (!selectedEntry) {
    target.innerHTML = `<div class="cv-empty"><strong>No internship selected</strong><p class="meta">Choose a recommendation to see its full reasoning, source details, and next steps.</p></div>`;
    return;
  }

  const { internship, result, explain } = selectedEntry;
  activeMatchInternshipId = internship.id;
  const application = getApplication(student.id, internship.id);
  const recommendation = result.score >= 85 ? "Strong fit" : result.score >= 70 ? "Promising fit" : "Stretch fit";
  const learningPlan = result.missing.flatMap((skill) => learningRecommendations[skill] || [`Course: ${skill} fundamentals`]).slice(0, 4);
  target.innerHTML = `
    <div class="match-detail-layout">
      <div class="match-detail-head">
        <div>
          <h3>${escapeHtml(internship.title)}</h3>
          <p class="meta">${escapeHtml(internship.company)} - ${escapeHtml(internship.location)} - ${escapeHtml(internship.mode)}</p>
        </div>
        <div class="score mini-score"><strong>${result.score}%</strong><span>match</span></div>
      </div>
      <div class="profile-stats compact-stats">
        <div><span>Recommendation</span><strong>${escapeHtml(recommendation)}</strong></div>
        <div><span>Required matched</span><strong>${result.exactRequired.length}/${internship.required.length}</strong></div>
        <div><span>Preferred matched</span><strong>${result.exactPreferred.length}</strong></div>
        <div><span>Missing skills</span><strong>${result.missing.length}</strong></div>
      </div>
      ${sourceBlock(internship)}
      <div class="match-evidence" aria-label="Match evidence">
        ${evidenceMeter("Skills match", result.requiredCoverage * 100)}
        ${evidenceMeter("Category fit", result.categoryFit * 100)}
        ${evidenceMeter("Location and availability", result.availabilityFit * 100)}
        ${evidenceMeter("Semantic similarity", result.semanticSimilarity * 100)}
      </div>
      <div class="cv-section">
        <span class="cv-label">Why this match</span>
        <p class="meta">${escapeHtml(explain || explanation(student, internship, result))}</p>
      </div>
      <div class="decision-grid">
        <div class="decision-card">
          <strong>Matched skills</strong>
          ${tagList([...result.exactRequired, ...result.exactPreferred].slice(0, 8))}
        </div>
        <div class="decision-card">
          <strong>Growth areas</strong>
          ${result.missing.length ? tagList(result.missing) : `<p class="meta">No critical missing skills for this role.</p>`}
        </div>
      </div>
      <div class="cv-section">
        <span class="cv-label">Suggested next steps</span>
        <p class="meta">${escapeHtml(learningPlan.join(" | ") || "Profile is already well aligned. Apply and prepare role-specific examples.")}</p>
      </div>
      <div class="action-row">
        <a class="posting-link" href="${escapeHtml(internship.sourceUrl)}" target="_blank" rel="noopener">Open Original Posting</a>
        <button class="apply-action" data-internship-id="${escapeHtml(internship.id)}" type="button" ${application ? "disabled" : ""}>${application ? `Applied: ${escapeHtml(application.status)}` : "Apply now"}</button>
      </div>
    </div>
  `;
}

function renderRecruiterOverview(internship, rankedMatches) {
  const companyApplications = applications.filter((application) => internships.some((item) => item.id === application.internshipId));
  const newApplications = companyApplications.filter((application) => application.status === "Applied");
  const strongMatches = rankedMatches.filter((item) => item.result.score >= 75);
  const interviews = companyApplications.filter((application) => application.status === "Interview");
  $("#recruiterOpenRoles").textContent = internships.length;
  $("#recruiterApplicationCount").textContent = newApplications.length;
  $("#recruiterTopCandidate").textContent = strongMatches.length;
  $("#recruiterPipelineCount").textContent = interviews.length;
  setText("#recruiterOpenRolesMeta", `${internships.length ? "Open across your company" : "Create your first opening"}`);
  setText("#recruiterApplicationMeta", `${newApplications.length ? "Ready for review" : "Your queue is clear"}`);
  setText("#recruiterTopCandidateMeta", `${rankedMatches[0]?.result.score || 0}% top candidate fit`);
  setText("#recruiterPipelineMeta", `${interviews.length ? "Awaiting hiring decisions" : "No interviews in progress"}`);
}

function candidateAvatarMarkup(student, className = "candidate-avatar") {
  const avatarUrl = absoluteAssetUrl(student?.avatarUrl);
  const initials = companyInitials(student?.name || "Candidate");
  return `<span class="${className}"><img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(student?.name || "Candidate")} profile photo" onerror="this.hidden=true;this.nextElementSibling.style.display='grid'"><span>${escapeHtml(initials)}</span></span>`;
}

function recruiterCandidateMatches(internship) {
  return students
    .map((student) => ({ student, result: calculateMatch(student, internship) }))
    .filter(({ student, result }) => {
      const haystack = `${student.name} ${student.program} ${student.location} ${student.skills.join(" ")}`.toLowerCase();
      return (!recruiterCandidateSkillFilter || haystack.includes(recruiterCandidateSkillFilter))
        && (recruiterCandidateLocationFilter === "all" || normalized(student.location) === normalized(recruiterCandidateLocationFilter))
        && result.score >= recruiterCandidateScoreFilter;
    })
    .sort((a, b) => b.result.score - a.result.score);
}

function renderRecruiterWorkspace(internship, rankedMatches) {
  if (currentRole() !== "recruiter" || !internship) return;
  const recruiterName = currentRecruiterProfile?.firstName || "there";
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";
  setText("#recruiterGreeting", `${greeting}, ${recruiterName}`);

  const companyApplications = applications.filter((application) => internships.some((item) => item.id === application.internshipId));
  const newApplications = companyApplications.filter((application) => application.status === "Applied");
  const interviews = companyApplications.filter((application) => application.status === "Interview");
  const nearestDeadline = internships.map((item) => ({ item, deadline: new Date(item.raw?.deadline || 0) })).filter(({ deadline }) => !Number.isNaN(deadline.getTime())).sort((a, b) => a.deadline - b.deadline)[0];
  const attention = [
    newApplications.length && { icon: "file-text", title: `${newApplications.length} new application${newApplications.length === 1 ? "" : "s"}`, copy: "Review applicants waiting in your queue.", target: "recruiterApplicationsSection", action: "Review" },
    interviews.length && { icon: "calendar-check", title: `${interviews.length} interview${interviews.length === 1 ? "" : "s"} in progress`, copy: "Update decisions when interviews are complete.", target: "recruiterPipelineSection", action: "Open pipeline" },
    nearestDeadline && { icon: "briefcase-business", title: nearestDeadline.item.title, copy: `Posting deadline: ${formatDisplayDate(nearestDeadline.item.raw?.deadline, "Soon")}.`, target: "recruiterPostingsSection", action: "Manage" },
  ].filter(Boolean);
  $("#recruiterAttention").innerHTML = attention.length ? attention.map((item) => `<article class="attention-card"><span class="attention-icon" aria-hidden="true"><i data-lucide="${item.icon}"></i></span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.copy)}</p></div><button class="text-action recruiter-scroll-action" data-scroll-target="${item.target}" type="button">${item.action}</button></article>`).join("") : `<div class="empty-state"><strong>Your recruiter queue is clear</strong><p>New applications and upcoming decisions will appear here.</p></div>`;

  $("#recruiterPostingCards").innerHTML = internships.length ? internships.map((item) => {
    const itemApplications = applications.filter((application) => application.internshipId === item.id);
    const strongCount = students.filter((student) => calculateMatch(student, item).score >= 75).length;
    return `<article class="recruiter-posting-card" data-posting-id="${escapeHtml(item.id)}"><div class="company-header"><div class="company-identity">${companyLogoMarkup(companyLogoData(item))}<div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.location)} · ${escapeHtml(item.mode)}</span></div></div><span class="status">Active</span></div><div class="posting-card-stats"><span>${itemApplications.length} applicant${itemApplications.length === 1 ? "" : "s"}</span><span>${strongCount} strong match${strongCount === 1 ? "" : "es"}</span></div><p class="meta">Posted ${escapeHtml(formatDisplayDate(item.raw?.postedDate, "Recently"))}</p><div class="posting-card-actions"><button class="text-action" data-select-posting="${escapeHtml(item.id)}" type="button">View candidates</button><button class="secondary-action compact" data-edit-posting="${escapeHtml(item.id)}" type="button">Edit</button></div></article>`;
  }).join("") : `<div class="empty-state"><strong>You have not published an internship yet.</strong><p>Create an opening to start matching candidates.</p><button class="primary-action recruiter-create-action" type="button">Create internship</button></div>`;

  const activity = [
    ...notifications.map((notification) => ({ title: notification.type.replaceAll("_", " "), copy: notification.message, time: notification.createdAt })),
    ...companyApplications.map((application) => ({ title: `${application.status} · ${students.find((student) => student.id === application.studentId)?.name || "Candidate"}`, copy: `${internships.find((item) => item.id === application.internshipId)?.title || "Internship"} application`, time: application.date })),
  ].slice(0, 6);
  $("#recruiterActivity").innerHTML = activity.length ? activity.map((item) => `<div class="activity-row"><span class="activity-dot" aria-hidden="true"></span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.copy)}</p></div><span>${escapeHtml(item.time)}</span></div>`).join("") : `<div class="empty-state"><strong>No activity yet</strong><p>Applications and posting activity will appear here.</p></div>`;
  renderCompanyProfile();
  renderLucideIcons($("#companyView"));
}

function renderCompanyProfile() {
  const company = currentCompany;
  if (!company) return;
  const companyVisual = { name: company.name, logoUrl: company.logoUrl || GENERIC_COMPANY_LOGO };
  $("#companyProfileSummary").innerHTML = `<div class="company-profile-summary">${companyLogoMarkup(companyVisual)}<div><strong>${escapeHtml(company.name)}</strong><span>${escapeHtml(company.industry || "Company profile")}</span><span>${escapeHtml(company.location || "Switzerland")}</span></div></div>`;
  const form = $("#companyProfileForm");
  if (!form) return;
  form.elements.name.value = company.name || "";
  form.elements.industry.value = company.industry || "";
  form.elements.location.value = company.location || "";
  form.elements.website.value = company.website || "";
  form.elements.careerPage.value = company.careerPage || "";
  form.elements.description.value = company.description || "";
}

function renderStudentMatches(options = {}) {
  const storedStudent = students.find((item) => item.id === $("#studentSelect").value);
  const student = options.live ? studentFromForm(storedStudent) : storedStudent;
  if (!student) {
    $("#bestMatchScore").textContent = "0%";
    $("#studentProfile").innerHTML = `<p class="meta">Sign in as a student to load your profile.</p>`;
    $("#liveAiPanel").innerHTML = `<div class="live-ai-empty">Your personalized internship matches will appear here after login.</div>`;
    $("#studentMatches").innerHTML = "";
    $("#matchDetail").innerHTML = `<div class="cv-empty"><strong>No internship selected</strong><p class="meta">Your selected recommendation will appear here once matches are available.</p></div>`;
    $("#skillGapPanel").innerHTML = `<div class="gap-item"><strong>No data yet</strong><p class="meta">Skill gap analysis becomes available after your profile loads.</p></div>`;
    $("#applicationTracker").innerHTML = `<div class="timeline-item"><div><strong>No applications yet</strong><span class="meta">Applications will appear here after you sign in and apply.</span></div><span class="status">Idle</span></div>`;
    return;
  }
  if (!options.live) renderStudentProfile(student);
  const rankedCalculated = internships
    .map((internship) => ({ internship, result: calculateMatch(student, internship) }))
    .filter(({ internship, result }) => internshipMatchesFilters(student, internship, result))
    .sort((a, b) => b.result.score - a.result.score);

  const rankedRecommended =
    !options.live && recommendations.length
      ? recommendations
          .map((item) => ({
            internship: item.internship,
            result: { ...calculateMatch(student, item.internship), score: item.result.score },
            explain: item.explain,
          }))
          .filter(({ internship, result }) => internshipMatchesFilters(student, internship, result))
      : rankedCalculated;

  const ranked = searchMode === "search" ? rankedCalculated : rankedRecommended;
  const visible = searchMode === "search" ? ranked.slice(0, Math.max(10, ranked.length)) : ranked.slice(0, 10);
  if (!activeMatchInternshipId || !visible.some(({ internship }) => internship.id === activeMatchInternshipId)) {
    activeMatchInternshipId = visible[0]?.internship.id || null;
  }

  $("#bestMatchScore").textContent = `${visible[0]?.result.score || 0}%`;
  renderStudentOverview(student, visible);
  renderLiveAiPanel(student, visible, Boolean(options.live));
  if (!visible.length) {
    $("#studentMatches").innerHTML = `<div class="empty-state"><strong>No internships found</strong><p>Try adjusting your filters or search terms.</p><button class="secondary-action" id="resetInternshipFilters" type="button">Reset filters</button></div>`;
    renderMatchDetail(student, []);
    renderSkillGap(student, []);
    renderApplicationTracker(ranked);
    return;
  }
  $("#studentMatches").innerHTML = visible
    .map(({ internship, result, explain: recommendationExplain }) => {
      const application = getApplication(student.id, internship.id);
      const saved = isInternshipSaved(internship.id);
      return matchCard(internship.title, `${internship.company} - ${internship.location} - ${internship.mode}`, result, {
        selected: internship.id === activeMatchInternshipId,
        cardId: internship.id,
        explain: recommendationExplain || explanation(student, internship, result),
        good: [...result.exactRequired, ...result.exactPreferred].slice(0, 5),
        missing: result.missing.map((skill) => `Learn ${skill}`),
        source: sourceBlock(internship),
        company: companyLogoData(internship),
        companyMeta: `${internship.location} · ${internship.mode}`,
        postedLabel: internship.collectedAt ? `Collected ${formatDisplayDate(internship.collectedAt, "Recently")}` : "Recently posted",
        action: options.live
          ? `<div class="action-row"><span class="status">Scores update while you edit</span></div>`
          : `<div class="action-row match-card-action-row">
              <div class="match-card-action-buttons">
                <button class="bookmark-action ${saved ? "is-saved" : ""}" data-bookmark-id="${escapeHtml(internship.id)}" type="button" aria-label="${saved ? "Remove" : "Save"} ${escapeHtml(internship.title)}" aria-pressed="${saved}"><i data-lucide="bookmark"></i></button>
                <button class="text-action" data-match-id="${escapeHtml(internship.id)}" type="button">View details</button>
                <a class="posting-link" href="${escapeHtml(internship.sourceUrl)}" target="_blank" rel="noopener">Open original</a>
                <button class="apply-action" data-internship-id="${escapeHtml(internship.id)}" type="button" ${application ? "disabled" : ""}>${application ? "Applied" : "Apply now"}</button>
              </div>
              <span class="match-application-state ${application ? "is-submitted" : ""}">${application ? `${escapeHtml(application.status)} · Submitted ${escapeHtml(application.date)}` : "Application ready"}</span>
            </div>`,
      });
    })
    .join("");
  renderLucideIcons($("#studentMatches"));
  renderMatchDetail(student, visible);
  renderSkillGap(student, visible);
  renderApplicationTracker(ranked);
}

function renderCandidateMatches() {
  const internship = internships.find((item) => item.id === $("#internshipSelect").value);
  if (!internship) {
    $("#internshipProfile").innerHTML = `<p class="meta">Sign in as a recruiter to manage internship postings.</p>`;
    $("#candidateMatches").innerHTML = "";
    $("#candidateSummary").innerHTML = `<div class="cv-empty"><strong>No candidate selected</strong><p class="meta">Candidate insights appear when applications are available.</p></div>`;
    $("#recruiterApplications").innerHTML = `<div class="application-review"><div><strong>No submitted applications</strong><span class="meta">Applications will appear here after students apply.</span></div><span class="status">Idle</span></div>`;
    $("#hiringPipeline").innerHTML = "";
    renderCvReview();
    return;
  }
  renderInternshipProfile(internship);
  const locations = [...new Set(students.map((student) => student.location).filter(Boolean))].sort();
  const locationSelect = $("#candidateLocationFilter");
  if (locationSelect) {
    locationSelect.innerHTML = `<option value="all">All locations</option>${locations.map((location) => `<option value="${escapeHtml(location)}">${escapeHtml(location)}</option>`).join("")}`;
    locationSelect.value = locations.includes(recruiterCandidateLocationFilter) ? recruiterCandidateLocationFilter : "all";
  }
  const ranked = recruiterCandidateMatches(internship);
  if (!activeCandidateId || !ranked.some(({ student }) => student.id === activeCandidateId)) activeCandidateId = ranked[0]?.student.id || null;

  renderRecruiterOverview(internship, ranked);
  $("#candidateMatches").innerHTML = ranked.length ? ranked.map(({ student, result }) => {
    const applied = applications.find((application) => application.studentId === student.id && application.internshipId === internship.id);
    const label = result.score >= 85 ? "Strong match" : result.score >= 70 ? "Promising match" : "Potential match";
    return `<article class="candidate-card ${activeCandidateId === student.id ? "is-selected" : ""}" data-candidate-id="${escapeHtml(student.id)}"><div class="candidate-card-head">${candidateAvatarMarkup(student)}<div><strong>${escapeHtml(student.name)}</strong><span>${escapeHtml(student.program)}</span><span>${escapeHtml(student.location)} · Available ${escapeHtml(student.availability)}</span></div><div class="score mini-score"><strong>${result.score}%</strong><span>match</span></div></div>${tagList(student.skills.slice(0, 4))}<div class="candidate-match-copy"><strong>${label}</strong><p>${escapeHtml(explanation(student, internship, result))}</p></div><div class="candidate-card-actions"><button class="text-action" data-view-candidate="${escapeHtml(student.id)}" type="button">View profile</button>${applied ? `<button class="review-cv-action" data-application-id="${escapeHtml(applied.id)}" type="button">View CV</button>` : `<span class="status">Not applied</span>`}</div></article>`;
  }).join("") : `<div class="empty-state"><strong>No candidates match your current filters.</strong><p>Try clearing a skill, location, or score filter.</p><button class="secondary-action" id="resetCandidateFilters" type="button">Reset filters</button></div>`;
  renderCandidateSummary(internship, ranked.find(({ student }) => student.id === activeCandidateId) || ranked[0]);
  renderHiringPipeline(ranked);
  renderRecruiterApplications(internship);
  renderRecruiterWorkspace(internship, ranked);
}

function sourceBlock(internship) {
  return `
    <div class="source-row">
      <span class="source-badge">${escapeHtml(internship.sourceName)}</span>
      <span>${escapeHtml(internship.sourceType.replace("_", " "))}</span>
      <span>Collected ${escapeHtml(internship.collectedAt)}</span>
      <span>${internship.isActive ? "Active" : "Inactive"}</span>
    </div>
  `;
}

function renderLiveAiPanel(student, rankedMatches, isLive) {
  const top = rankedMatches[0];
  const second = rankedMatches[1];
  if (!top) {
    $("#liveAiPanel").innerHTML = `<div class="live-ai-empty">No internships match this search yet. Try a broader keyword like arts, agriculture, research, museum, media, or analytics.</div>`;
    return;
  }

  const scoreDelta = second ? top.result.score - second.result.score : top.result.score;
  const matchedSkills = [...top.result.exactRequired, ...top.result.exactPreferred].slice(0, 4);
  const signal = top.result.interestOverlap.length
    ? `preference signal: ${top.result.interestOverlap.join(", ")}`
    : `location signal: ${student.location}`;

  $("#liveAiPanel").innerHTML = `
    <div class="live-ai-status">
      <span class="status">${isLive ? "Live AI preview" : "Saved profile"}</span>
      <span>${rankedMatches.length} internships shown in ${searchMode === "search" ? "search-all-sources" : "ai-recommended"} mode</span>
    </div>
    <p><strong>${escapeHtml(top.internship.title)}</strong> is currently ranked first with a ${top.result.score}% score. The model is weighting ${escapeHtml(matchedSkills.join(", ") || "preference fit")} and ${escapeHtml(signal)}. Lead over next match: ${scoreDelta} points.</p>
  `;
}

function renderSkillGap(student, rankedMatches) {
  const missingCounts = {};
  rankedMatches.slice(0, 3).forEach(({ result }) => {
    result.missing.forEach((skill) => {
      missingCounts[skill] = (missingCounts[skill] || 0) + 1;
    });
  });
  const gaps = Object.entries(missingCounts).sort((a, b) => b[1] - a[1]);
  $("#skillGapPanel").innerHTML = gaps.length
    ? gaps
        .map(([skill, count]) => {
          const owned = Math.round((student.skills.length / (student.skills.length + count)) * 100);
          const ideas = learningRecommendations[skill] || [
            `Course: ${skill} fundamentals`,
            `Project: add ${skill} to an FHNW portfolio case`,
          ];
          return `
            <div class="gap-item">
              <div class="panel-header">
                <strong>${escapeHtml(skill)}</strong>
                <span class="status">${count} top-role gap${count === 1 ? "" : "s"}</span>
              </div>
              <div class="bar"><i style="width: ${owned}%"></i></div>
              <p class="meta">${ideas.map(escapeHtml).join(" | ")}</p>
            </div>
          `;
        })
        .join("")
    : `<div class="gap-item"><strong>No critical gaps</strong><p class="meta">This profile covers the required skills for the top recommendations.</p></div>`;
}

function renderApplicationTracker() {
  const student = selectedStudent();
  const studentApplications = applications.filter((application) => application.studentId === student?.id);
  if (!activeStudentApplicationId && studentApplications[0]) activeStudentApplicationId = studentApplications[0].id;
  $("#applicationTracker").innerHTML = studentApplications.length
    ? `
      <div class="timeline">
        ${studentApplications
          .map((application) => {
            const internship = internships.find((item) => item.id === application.internshipId);
            return `
              <div class="timeline-item ${activeStudentApplicationId === application.id ? "is-selected" : ""}" data-application-id="${escapeHtml(application.id)}">
                <div><strong>${escapeHtml(internship?.title || "Deleted internship")}</strong><span class="meta">${escapeHtml(internship?.company || "Unknown company")} - submitted ${escapeHtml(application.date)}</span></div>
                <span class="status">${escapeHtml(application.status)}</span>
              </div>
            `;
          })
          .join("")}
      </div>
    `
    : `<div class="timeline-item"><div><strong>No applications yet</strong><span class="meta">Use Apply now on a top match to start the workflow.</span></div><span class="status">Ready</span></div>`;
  renderStudentApplicationDetail(studentApplications);
}

function renderStudentApplicationDetail(studentApplications) {
  const target = $("#applicationDetail");
  const application = studentApplications.find((item) => item.id === activeStudentApplicationId) || studentApplications[0];
  if (!application) {
    target.innerHTML = `<div class="cv-empty"><strong>No application selected</strong><p class="meta">Apply to an internship to view timeline details, recruiter notes, and original posting links.</p></div>`;
    return;
  }
  activeStudentApplicationId = application.id;
  const internship = internships.find((item) => item.id === application.internshipId);
  const student = selectedStudent();
  const result = student && internship ? calculateMatch(student, internship) : null;
  target.innerHTML = `
    <div class="cv-grid">
      <div>
        <span class="cv-label">Internship</span>
        <strong>${escapeHtml(internship?.title || "Unknown role")}</strong>
        <p class="meta">${escapeHtml(internship?.company || "Unknown company")} - ${escapeHtml(internship?.location || "Unknown location")}</p>
      </div>
      <div>
        <span class="cv-label">Current status</span>
        <strong>${escapeHtml(application.status)}</strong>
        <p class="meta">Submitted ${escapeHtml(application.date)}</p>
      </div>
    </div>
    <div class="decision-grid">
      <div class="decision-card">
        <strong>Recruiter notes</strong>
        <p class="meta">${escapeHtml(application.notes || "No recruiter notes shared yet.")}</p>
      </div>
      <div class="decision-card">
        <strong>Original posting</strong>
        <p class="meta"><a class="posting-link" href="${escapeHtml(internship?.sourceUrl || "#")}" target="_blank" rel="noopener">Open listing</a></p>
      </div>
    </div>
    <div class="cv-section">
      <span class="cv-label">Match context</span>
      <p class="meta">${escapeHtml(result ? explanation(student, internship, result) : "No internship context available.")}</p>
    </div>
  `;
}

function renderNotifications(targetId, items, emptyTitle, emptyBody) {
  const target = $(targetId);
  if (!target) return;
  target.innerHTML = items.length
    ? items
        .slice(0, 8)
        .map(
          (notification) => `
            <div class="notification ${notification.isRead ? "" : "is-unread"}">
              <div class="notification-copy">
                <strong>${escapeHtml(notification.type.replaceAll("_", " "))}</strong>
                <span class="meta">${escapeHtml(notification.message)}</span>
              </div>
              <span class="status">${escapeHtml(notification.createdAt)}</span>
              <button class="notification-action" data-notification-id="${escapeHtml(notification.id)}" type="button" ${notification.isRead ? "disabled" : ""}>
                ${notification.isRead ? "Read" : "Mark read"}
              </button>
            </div>
          `,
        )
        .join("")
    : `<div class="notification"><div class="notification-copy"><strong>${escapeHtml(emptyTitle)}</strong><span class="meta">${escapeHtml(emptyBody)}</span></div><span class="status">Clear</span><button class="notification-action" type="button" disabled>Read</button></div>`;
}

function roleNotificationContent() {
  const role = currentRole();
  if (role === "student") {
    return {
      items: notifications,
      emptyTitle: "No notifications yet",
      emptyBody: "Status updates and application activity will appear here.",
    };
  }
  if (role === "recruiter") {
    return {
      items: notifications,
      emptyTitle: "No notifications yet",
      emptyBody: "New applications and hiring updates will appear here.",
    };
  }
  if (role === "admin") {
    const pendingCount = internships.filter((internship) => internship.status.includes("Pending")).length;
    const unreadCount = notifications.filter((notification) => !notification.isRead).length;
    return {
      items: [
        ...notifications,
        {
          id: "admin-summary-unread",
          type: "platform_overview",
          message: `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"} across active workflows.`,
          createdAt: "System",
          isRead: true,
        },
        {
          id: "admin-summary-queue",
          type: "review_queue",
          message: `${pendingCount} posting${pendingCount === 1 ? "" : "s"} currently need review.`,
          createdAt: "System",
          isRead: true,
        },
      ],
      emptyTitle: "No notifications yet",
      emptyBody: "Platform activity will appear here.",
    };
  }
  return {
    items: [],
    emptyTitle: "No notifications yet",
    emptyBody: "Sign in to view updates.",
  };
}

function setNotificationsOpen(nextOpen) {
  notificationsOpen = Boolean(nextOpen) && Boolean(currentUser);
  const button = $("#notificationToggle");
  const panel = $("#headerNotificationsPanel");
  if (!button || !panel) return;
  button.setAttribute("aria-expanded", notificationsOpen ? "true" : "false");
  panel.hidden = !notificationsOpen;
}

function renderCandidateSummary(internship, topMatch) {
  if (!topMatch) return;
  const { student, result } = topMatch;
  const strengths = [...result.exactRequired, ...result.exactPreferred].slice(0, 4);
  const focusAreas = result.missing.slice(0, 3);
  const recommendation = result.score >= 85 ? "Strong interview recommendation" : result.score >= 70 ? "Worth interviewing with focused questions" : "Consider after stronger matches";
  const confidence = result.missing.length === 0 ? "High readiness for the current scope." : `${result.missing.length} missing skill${result.missing.length === 1 ? "" : "s"} to validate during review.`;
  $("#candidateSummary").innerHTML = `
    <div class="candidate-summary-head">
      <div>
        <h3>${escapeHtml(student.name)}</h3>
        <p class="meta">${escapeHtml(student.program)} - ${escapeHtml(student.location)}</p>
      </div>
      <div class="score mini-score"><strong>${result.score}%</strong><span>match</span></div>
    </div>
    <div class="profile-stats compact-stats">
      <div><span>Availability</span><strong>${escapeHtml(student.availability)}</strong></div>
      <div><span>Languages</span><strong>${escapeHtml(student.languages.slice(0, 2).join(" / "))}</strong></div>
      <div><span>Strengths</span><strong>${strengths.length}</strong></div>
      <div><span>Applications</span><strong>${applications.filter((item) => item.studentId === student.id).length}</strong></div>
    </div>
    ${tagList(strengths)}
    <div class="summary-note">
      <span class="cv-label">Decision support</span>
      <p class="explain">Best fit for ${escapeHtml(internship.title)} based on ${escapeHtml(result.exactRequired.join(", ") || "adjacent capabilities")} and relevant project evidence.</p>
    </div>
    <div class="summary-note">
      <span class="cv-label">Interview focus</span>
      <p class="explain">${escapeHtml(focusAreas.length ? focusAreas.join(", ") : "Team fit, motivation, and communication.")}</p>
    </div>
    <div class="decision-grid">
      <div class="decision-card">
        <strong>Recommendation</strong>
        <p class="meta">${escapeHtml(recommendation)}</p>
      </div>
      <div class="decision-card">
        <strong>Readiness</strong>
        <p class="meta">${escapeHtml(confidence)}</p>
      </div>
    </div>
  `;
}

function renderHiringPipeline(rankedMatches) {
  const activeInternship = internships.find((item) => item.id === $("#internshipSelect").value);
  const relevantApplications = applications.filter((application) => application.internshipId === activeInternship?.id);
  const statusGroups = ["Applied", "Interview", "Offer", "Rejected"];
  const columns = statusGroups.map((status) => [
    status,
    relevantApplications.filter((application) => application.status === status).slice(0, 6),
  ]);
  $("#hiringPipeline").innerHTML = columns
    .map(
      ([title, items]) => `
        <div class="kanban-column">
          <div class="kanban-head">
            <strong>${title}</strong>
            <span class="status">${items.length}</span>
          </div>
          ${items
            .map((application) => {
              const student = students.find((item) => item.id === application.studentId);
              const internship = internships.find((item) => item.id === application.internshipId);
              const result = student && internship ? calculateMatch(student, internship) : { score: 0 };
              return `
                <div class="kanban-card ${activeReviewApplicationId === application.id ? "is-active" : ""}" data-application-id="${escapeHtml(application.id)}">
                  <strong>${escapeHtml(student?.name || "Unknown student")}</strong>
                  <p class="meta">${result.score}% match</p>
                  <span class="kanban-role">${escapeHtml(internship?.title || "Unknown role")}</span>
                </div>
              `;
            })
            .join("")}
        </div>
      `,
    )
    .join("");
}

function renderRecruiterApplications(activeInternship) {
  const relevantApplications = applications.filter((application) => application.internshipId === activeInternship.id);
  if (!activeReviewApplicationId && relevantApplications[0]) activeReviewApplicationId = relevantApplications[0].id;
  $("#recruiterApplications").innerHTML = relevantApplications.length
    ? relevantApplications
        .map((application) => {
          const student = students.find((item) => item.id === application.studentId);
          const result = student ? calculateMatch(student, activeInternship) : { score: 0 };
          return `
            <div class="application-review ${activeReviewApplicationId === application.id ? "is-selected" : ""}">
              <div class="application-review-main">
                <strong>${escapeHtml(student?.name || "Unknown student")}</strong>
                <span class="meta">${escapeHtml(student?.program || "Profile unavailable")}</span>
                <span class="meta">Submitted ${escapeHtml(application.date)}</span>
              </div>
              <div class="application-review-score">
                <strong>${result.score}%</strong>
                <span>match</span>
              </div>
              <button class="review-cv-action" data-application-id="${escapeHtml(application.id)}" type="button">Review CV</button>
              <select class="status-select ${allowedStatusOptions(application.status).length === 1 ? "is-readonly" : ""}" data-application-id="${escapeHtml(application.id)}" aria-label="Update application status">
                ${allowedStatusOptions(application.status).map((status) => `<option value="${status}" ${application.status === status ? "selected" : ""}>${status}</option>`).join("")}
              </select>
            </div>
          `;
        })
        .join("")
    : `<div class="application-review"><div><strong>No submitted applications for this role</strong><span class="meta">Student applications will appear here after they click Apply now.</span></div><span class="status">Waiting</span></div>`;
  renderCvReview(relevantApplications.some((application) => application.id === activeReviewApplicationId) ? activeReviewApplicationId : relevantApplications[0]?.id);
}

function renderCvReview(applicationId) {
  const application = applications.find((item) => item.id === applicationId);
  const student = students.find((item) => item.id === application?.studentId);
  const internship = internships.find((item) => item.id === application?.internshipId);

  if (!application || !student || !internship) {
    $("#cvReviewPanel").innerHTML = `
      <div class="cv-empty">
        <strong>No CV selected</strong>
        <p class="meta">Click Review CV on a submitted application to inspect the student profile.</p>
      </div>
    `;
    $("#recruiterNotesInput").value = "";
    $("#saveRecruiterNotes").disabled = true;
    return;
  }

  const result = calculateMatch(student, internship);
  const matchSignals = [...result.exactRequired, ...result.exactPreferred].slice(0, 6);
  const concerns = result.missing.slice(0, 4);
  const cvLink = absoluteCvUrl(student.cvUrl);
  $("#cvReviewPanel").innerHTML = `
    <div class="cv-header">
      <div>
        <h3>${escapeHtml(student.name)}</h3>
        <p class="meta">${escapeHtml(student.program)} - Semester ${escapeHtml(student.semester)} - ${escapeHtml(student.location)}</p>
      </div>
      <div class="score mini-score"><strong>${result.score}%</strong><span>match</span></div>
    </div>
    <div class="cv-grid">
      <div>
        <span class="cv-label">CV file</span>
        ${cvLink ? `<a class="posting-link" href="${escapeHtml(cvLink)}" target="_blank" rel="noreferrer">Open uploaded CV</a>` : `<strong>${escapeHtml(student.cvUrl || "No CV uploaded")}</strong>`}
        <p class="meta">${escapeHtml(student.cvSummary)}</p>
      </div>
      <div>
        <span class="cv-label">Application</span>
        <strong>${escapeHtml(application.status)}</strong>
        <p class="meta">Submitted ${escapeHtml(application.date)} for ${escapeHtml(internship.title)}.</p>
      </div>
    </div>
    <div class="profile-stats compact-stats">
      <div><span>Required matched</span><strong>${result.exactRequired.length}/${internship.required.length}</strong></div>
      <div><span>Preferred matched</span><strong>${result.exactPreferred.length}</strong></div>
      <div><span>Missing</span><strong>${result.missing.length}</strong></div>
    </div>
    <div class="cv-section">
      <span class="cv-label">Owned skills</span>
      ${tagList(student.skills)}
    </div>
    <div class="cv-section">
      <span class="cv-label">Experience evidence</span>
      <ul class="cv-list">${student.experience.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </div>
    <div class="cv-section">
      <span class="cv-label">AI review notes</span>
      <p class="explain">${escapeHtml(explanation(student, internship, result))}</p>
      <div class="match-details">
        ${result.exactRequired.map((skill) => `<span class="detail good">${escapeHtml(skill)}</span>`).join("")}
        ${result.missing.map((skill) => `<span class="detail missing">Check ${escapeHtml(skill)}</span>`).join("")}
      </div>
    </div>
    <div class="cv-section">
      <span class="cv-label">Decision signals</span>
      <div class="decision-grid">
        <div class="decision-card">
          <strong>Evidence</strong>
          <p class="meta">${escapeHtml(matchSignals.join(", ") || "General profile alignment")}</p>
        </div>
        <div class="decision-card">
          <strong>Concerns</strong>
          <p class="meta">${escapeHtml(concerns.join(", ") || "No major skill concerns detected")}</p>
        </div>
      </div>
    </div>
  `;
  $("#recruiterNotesInput").value = application.notes || "";
  $("#saveRecruiterNotes").disabled = false;
}

function renderAdmin() {
  const allScores = students.flatMap((student) => internships.map((internship) => calculateMatch(student, internship).score));
  const average = allScores.length ? Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length) : 0;
  const demand = internships
    .flatMap((internship) => internship.required)
    .reduce((acc, skill) => ({ ...acc, [skill]: (acc[skill] || 0) + 1 }), {});
  const pendingCount = internships.filter((internship) => internship.status.includes("Pending")).length;
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  $("#studentCount").textContent = adminStats?.students ?? students.length;
  $("#internshipCount").textContent = adminStats?.internships ?? internships.length;
  $("#applicationCount").textContent = adminStats?.applications ?? applications.length;
  $("#notificationCount").textContent = adminStats?.notifications ?? notifications.length;
  $("#averageScore").textContent = `${average}%`;
  renderAggregationAnalytics();
  $("#approvalQueue").innerHTML = internships
    .filter((internship) => internship.status.includes("Pending"))
    .map(
      (internship) => `
        <div class="queue-item">
          <div><strong>${escapeHtml(internship.title)}</strong><span>${escapeHtml(internship.company)} - ${escapeHtml(internship.location)}</span></div>
          <span class="status">${escapeHtml(internship.status)}</span>
        </div>
      `,
    )
    .join("") || `<div class="queue-item"><div><strong>No postings waiting</strong><span>All current listings are active.</span></div><span class="status">Clear</span></div>`;
  const defaultNotifications = [
    { type: "Matching", message: `${students.length} student profiles are currently rankable across ${internships.length} internships.`, createdAt: "System" },
    { type: "Sources", message: `${adminSources.length || internships.length} source records are available for monitoring.`, createdAt: "System" },
    { type: "Queue", message: `${pendingCount} posting${pendingCount === 1 ? "" : "s"} currently need review.`, createdAt: "System" },
    { type: "Unread", message: `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"} across active workflows.`, createdAt: "System" },
  ];
  $("#notificationsPanel").innerHTML = [...notifications, ...defaultNotifications]
    .slice(0, 8)
    .map(
      ({ type, message, createdAt }) => `
        <div class="notification">
          <div><strong>${escapeHtml(type)}</strong><span class="meta">${escapeHtml(message)}</span></div>
          <span class="status">${escapeHtml(createdAt)}</span>
        </div>
      `,
    )
    .join("");
  $("#skillDemand").innerHTML = Object.entries(demand)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([skill, count]) => `
        <div class="queue-item">
          <div><strong>${escapeHtml(skill)}</strong><span>${count} open ${count === 1 ? "role" : "roles"}</span></div>
          <span class="status">Required</span>
        </div>
      `,
    )
    .join("") || `<div class="queue-item"><div><strong>No demand data</strong><span>Skill demand appears when internships are available.</span></div><span class="status">Idle</span></div>`;
}

function renderRoleNotifications() {
  const wrapper = $("#headerNotifications");
  const badge = $("#notificationBadge");
  const { items, emptyTitle, emptyBody } = roleNotificationContent();
  const unreadCount = items.filter((notification) => !notification.isRead).length;
  if (wrapper) wrapper.hidden = !currentUser;
  if (badge) {
    badge.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
    badge.classList.toggle("is-hidden", unreadCount === 0);
  }
  renderNotifications("#headerNotificationsList", items, emptyTitle, emptyBody);
  if (!currentUser) setNotificationsOpen(false);
}

function renderAggregationAnalytics() {
  const sourceCounts = (adminSources.length
    ? adminSources.reduce((acc, source) => {
        acc[source.platformName] = (acc[source.platformName] || 0) + 1;
        return acc;
      }, {})
    : internships.reduce((acc, internship) => {
        acc[internship.sourceName] = (acc[internship.sourceName] || 0) + 1;
        return acc;
      }, {}));
  const duplicateGroups = internships.reduce((acc, internship) => {
    acc[internship.duplicateGroup] = (acc[internship.duplicateGroup] || 0) + 1;
    return acc;
  }, {});
  const duplicateCount = Object.values(duplicateGroups).filter((count) => count > 1).length;
  const inactiveCount = internships.filter((internship) => !internship.isActive).length;

  $("#sourceDistribution").innerHTML = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([source, count]) => `
        <div class="queue-item">
          <div><strong>${escapeHtml(source)}</strong><span>${count} collected posting${count === 1 ? "" : "s"}</span></div>
          <span class="status">${Math.round((count / internships.length) * 100)}%</span>
        </div>
      `,
    )
    .join("") || `<div class="queue-item"><div><strong>No source data</strong><span>Source distribution will appear here.</span></div><span class="status">Empty</span></div>`;

  $("#freshnessPanel").innerHTML = [
    ["Active postings", `${internships.length - inactiveCount} currently active`],
    ["Inactive postings", `${inactiveCount} marked inactive`],
    ["Latest collection", internships.map((item) => item.collectedAt).sort().at(-1) || "No data"],
  ]
    .map(
      ([label, value]) => `
        <div class="queue-item">
          <div><strong>${label}</strong><span>${value}</span></div>
          <span class="status">Monitor</span>
        </div>
      `,
    )
    .join("");

  $("#dedupePanel").innerHTML = `
    <div class="queue-item">
      <div><strong>${duplicateCount} duplicate group${duplicateCount === 1 ? "" : "s"}</strong><span>Grouped by normalized title, company, and location signal.</span></div>
      <span class="status">Deduped</span>
    </div>
    <div class="queue-item">
      <div><strong>${internships.length} normalized records</strong><span>Each posting stores source_url, source_name, source_type, collected_at, and external_posting_id.</span></div>
      <span class="status">Ready</span>
    </div>
  `;
}

async function saveStudentForm(form) {
  const payload = buildStudentPayload(form);
  if (editingStudentId) {
    await api.updateStudent(editingStudentId, payload);
  } else {
    const created = await api.createStudent(payload);
    editingStudentId = created.id;
  }
  await refreshAppState();
  renderAll({ studentId: editingStudentId || currentStudentProfile?.id });
  showFeedback("Profile saved.", "success");
}

function buildStudentPayload(form, overrides = {}) {
  const data = new FormData(form);
  const name = data.get("name").trim();
  if (!name) throw new Error("Name is required");
  const [firstName, ...lastNameParts] = name.split(" ");
  return {
    userId: currentUser.id,
    firstName: firstName || "FHNW",
    lastName: lastNameParts.join(" ") || "Student",
    degreeProgram: data.get("program").trim(),
    semester: Number(data.get("semester")),
    locationPreference: data.get("location").trim(),
    industryPreference: listFromInput(data.get("interests")).join(", "),
    availability: data.get("availability").trim(),
    cvUrl: `${normalized(name || "student").replaceAll(" ", "-")}-cv.pdf`,
    cvSummary: data.get("cvSummary").trim() || "FHNW student profile synchronized through the backend API.",
    skills: listFromInput(data.get("skills")).map((skill) => ({
      name: skill,
      category: "general",
      proficiency: 3,
      yearsExperience: 1,
    })),
    projects: ["FHNW semester project", "Business IT portfolio case"].map((title) => ({
      title,
      technologiesUsed: listFromInput(data.get("skills")).join(", "),
    })),
    languages: listFromInput(data.get("languages")),
    mode: data.get("mode"),
    ...overrides,
  };
}

async function uploadCvFile(file) {
  if (!file) throw new Error("Choose a CV file first");
  if (!editingStudentId && !currentStudentProfile?.id) throw new Error("Save your student profile before uploading a CV");
  const uploaded = await api.uploadCv(file);
  const studentId = editingStudentId || currentStudentProfile?.id;
  await api.updateStudent(studentId, { cvUrl: uploaded.url || uploaded.storedPath || uploaded.fileName });
  await refreshAppState();
  renderAll({ studentId });
  if ($("#cvUploadStatus")) {
    $("#cvUploadStatus").textContent = `Stored CV: ${uploaded.fileName || uploaded.url}`;
  }
  showFeedback("CV uploaded successfully.", "success");
}

async function uploadAvatarFile(file) {
  if (!file) throw new Error("Choose a profile photo first");
  if (!file.type.match(/^image\/(png|jpeg|webp)$/)) throw new Error("Use a PNG, JPG, or WebP profile photo");
  if (file.size > 5 * 1024 * 1024) throw new Error("Profile photos must be 5 MB or smaller");

  const uploaded = await api.uploadAvatar(file);
  const avatarUrl = absoluteAssetUrl(uploaded.url);
  $("#profileAvatarPreview").src = avatarUrl;
  $("#accountAvatarImage").src = avatarUrl;
  $("#settingsAvatarImage").src = avatarUrl;
  await refreshAppState();
  renderAll({ studentId: editingStudentId || currentStudentProfile?.id });
  showFeedback("Profile photo updated.", "success");
}

async function parseCvFile(file) {
  if (!file) throw new Error("Choose a CV file first");
  if (!editingStudentId && !currentStudentProfile?.id) throw new Error("Save your student profile before parsing a CV");
  const parsed = await api.parseCv(file);
  const form = $("#studentForm");
  const currentSkills = listFromInput(form.elements.skills.value);
  const mergedSkills = [...new Set([...currentSkills, ...(parsed.skills || [])])];
  if (mergedSkills.length) {
    form.elements.skills.value = mergedSkills.join(", ");
  }
  const derivedExperience = [parsed.experience?.join(" "), parsed.education?.join(" ")]
    .filter(Boolean)
    .join(" ");
  const summaryParts = [parsed.textPreview?.slice(0, 280), derivedExperience].filter(Boolean);
  if (summaryParts.length) {
    form.elements.cvSummary.value = summaryParts.join(" ").trim();
  }
  const studentId = editingStudentId || currentStudentProfile?.id;
  const payload = buildStudentPayload(form, {
    cvUrl: currentStudentProfile?.cvUrl || file.name,
    projects: (parsed.experience?.length ? parsed.experience : ["CV parsed experience"]).slice(0, 2).map((title) => ({
      title,
      technologiesUsed: mergedSkills.join(", "),
    })),
  });
  await api.updateStudent(studentId, payload);
  await refreshAppState();
  renderAll({ studentId });
  if ($("#cvUploadStatus")) {
    $("#cvUploadStatus").textContent = `Parsed CV: ${file.name}`;
  }
  showFeedback("CV parsed and profile updated.", "success");
}

async function saveInternshipForm(form) {
  const data = new FormData(form);
  if (!currentUser) return;
  const isEditing = Boolean(editingInternshipId);

  const companyName = data.get("company").trim();
  const title = data.get("title").trim();
  const location = data.get("location").trim();
  const requiredSkills = listFromInput(data.get("required"));
  const preferredSkills = listFromInput(data.get("preferred"));
  if (!companyName || !title || !location) throw new Error("Company, role title, and location are required");
  if (!requiredSkills.length) throw new Error("Add at least one required skill");
  let companyId = currentCompany?.id;
  if (currentRole() === "admin" && !companyId) {
    const existingCompany = companies.find((company) => normalized(company.name) === normalized(companyName));
    if (existingCompany) {
      companyId = existingCompany.id;
    } else {
      const createdCompany = await api.createCompany({
        name: companyName,
        email: `${normalized(companyName).replaceAll(" ", ".")}@example.com`,
        location: data.get("location").trim(),
        industry: listFromInput(data.get("interests")).join(", "),
        description: `${companyName} internship partner profile`,
      });
      companyId = createdCompany.id;
    }
  } else if (currentCompany?.id) {
    await api.updateCompany(currentCompany.id, {
      name: companyName,
      location: data.get("location").trim(),
      industry: listFromInput(data.get("interests")).join(", "),
    });
  };

  const payload = {
    companyId,
    title,
    description: `${title} internship focused on ${listFromInput(data.get("interests")).join(", ") || "student growth"}.`,
    location,
    workMode: normalized(data.get("mode")).replace("-", ""),
    starts: data.get("starts").trim(),
    duplicateKey: normalized(`${title} ${location}`).replaceAll(" ", "-"),
    requiredSkills: requiredSkills.map((skill) => ({ name: skill, requiredLevel: 3, weight: 0.65 })),
    preferredSkills: preferredSkills.map((skill) => ({ name: skill, requiredLevel: 2, weight: 0.35 })),
    source: {
      platformName: "Company career page",
      sourceUrl: `https://example.com/${normalized(companyName || "company").replaceAll(" ", "-")}/${normalized(title || "internship").replaceAll(" ", "-")}`,
      sourceType: "company_site",
      externalPostingId: `manual-${Date.now()}`,
    },
  };

  if (editingInternshipId) {
    await api.updateInternship(editingInternshipId, payload);
  } else {
    const created = await api.createInternship(payload);
    editingInternshipId = created.id;
  }
  await refreshAppState();
  renderAll({ internshipId: editingInternshipId });
  showFeedback(isEditing ? "Internship updated." : "Internship created.", "success");
}

function populateSelects() {
  const selectedStudent = $("#studentSelect").value || students[0]?.id;
  const selectedInternship = $("#internshipSelect").value || internships[0]?.id;
  $("#studentSelect").innerHTML = students.map((student) => `<option value="${escapeHtml(student.id)}">${escapeHtml(student.name)}</option>`).join("");
  $("#internshipSelect").innerHTML = internships.map((internship) => `<option value="${escapeHtml(internship.id)}">${escapeHtml(internship.title)}</option>`).join("");
  $("#studentSelect").value = students.some((student) => student.id === selectedStudent) ? selectedStudent : (students[0]?.id ?? "");
  $("#internshipSelect").value = internships.some((internship) => internship.id === selectedInternship) ? selectedInternship : (internships[0]?.id ?? "");
}

function renderAll(selection = {}) {
  populateSelects();
  renderFilterOptions();
  if (selection.studentId) $("#studentSelect").value = selection.studentId;
  if (selection.internshipId) $("#internshipSelect").value = selection.internshipId;
  applyRoute();
  renderStudentMatches();
  renderCandidateMatches();
  renderAdmin();
  renderRoleNotifications();
  fillStudentForm(students.find((item) => item.id === $("#studentSelect").value));
  fillInternshipForm(internships.find((item) => item.id === $("#internshipSelect").value));
  updateSessionChrome();
  applyRoleLayout();
  applyLanguage();
}

async function handleApplyAction(button) {
  if (!button) return;
  const restoreButton = setButtonBusy(button, "Applying...");
  try {
    await applyForInternship(button.dataset.internshipId);
  } catch (error) {
    showFeedback(error.message, "error");
  } finally {
    restoreButton();
  }
}

function bindEvents() {
  window.__fhnwAuthReady = true;
  $("#logoutButton").addEventListener("click", () => {
    logout();
    clearAppData();
    navigateTo("/login", { replace: true });
  });
  $("#openLogin").addEventListener("click", () => {
    navigateTo("/login");
  });
  $("#openRegister").addEventListener("click", () => {
    navigateTo("/register");
  });
  $("#showRegisterCard")?.addEventListener("click", () => navigateTo("/register"));
  $("#showLoginCard")?.addEventListener("click", () => navigateTo("/login"));
  $("#mobileNavToggle")?.addEventListener("click", () => {
    const sidebar = document.querySelector(".app-sidebar");
    const isOpen = sidebar.classList.toggle("is-mobile-nav-open");
    $("#mobileNavToggle").setAttribute("aria-expanded", String(isOpen));
  });
  $("#accountToggle")?.addEventListener("click", () => setAccountMenuOpen(!accountMenuOpen));
  $("#accountDropdown")?.addEventListener("click", (event) => {
    const action = event.target.closest("[data-account-action]")?.dataset.accountAction;
    if (!action) return;
    setAccountMenuOpen(false);
    if (action === "profile") document.getElementById(currentRole() === "recruiter" ? "companyProfileSection" : "studentProfilePanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (action === "settings") setAccountSettingsOpen(true);
    if (action === "preferences") document.getElementById(currentRole() === "recruiter" ? "recruiterCandidatesSection" : "studentForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (action === "notifications") $("#notificationToggle")?.click();
    if (action === "appearance") $("#themeToggle")?.click();
    if (action === "support") showFeedback("Support resources are being prepared.", "info");
    if (action === "logout") $("#logoutButton")?.click();
  });
  $("#closeAccountSettings")?.addEventListener("click", () => setAccountSettingsOpen(false));
  $("#accountSettingsBackdrop")?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) setAccountSettingsOpen(false);
  });
  document.querySelectorAll("[data-settings-scroll]").forEach((button) => {
    button.addEventListener("click", () => {
      setAccountSettingsOpen(false);
      document.getElementById(button.dataset.settingsScroll)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  document.querySelectorAll(".side-nav button").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.view === "studentView") navigateTo("/student");
      if (button.dataset.view === "companyView") navigateTo("/recruiter");
      if (button.dataset.view === "adminView") navigateTo("/admin");
      if (button.dataset.scrollTarget) {
        const target = document.getElementById(button.dataset.scrollTarget);
        if (button.dataset.openNotifications === "true") $("#notificationToggle").click();
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
        document.querySelector(".app-sidebar")?.classList.remove("is-mobile-nav-open");
        $("#mobileNavToggle")?.setAttribute("aria-expanded", "false");
      }
    });
  });
  $("#studentSelect").addEventListener("change", () => {
    activeStudentApplicationId = null;
    activeMatchInternshipId = null;
    navigateTo("/student", { replace: true });
    fillStudentForm(students.find((item) => item.id === $("#studentSelect").value));
  });
  $("#studentForm").addEventListener("input", () => {
    if (!editingStudentId) return;
    renderStudentMatches({ live: true });
  });
  $("#internshipSelect").addEventListener("change", () => {
    navigateTo(`/recruiter/postings/${$("#internshipSelect").value}`, { replace: true });
    fillInternshipForm(internships.find((item) => item.id === $("#internshipSelect").value));
  });
  $("#candidateSkillFilter")?.addEventListener("input", (event) => {
    recruiterCandidateSkillFilter = event.target.value.trim().toLowerCase();
    renderCandidateMatches();
  });
  $("#candidateLocationFilter")?.addEventListener("change", (event) => {
    recruiterCandidateLocationFilter = event.target.value;
    renderCandidateMatches();
  });
  $("#candidateScoreFilter")?.addEventListener("change", (event) => {
    recruiterCandidateScoreFilter = Number(event.target.value || 0);
    renderCandidateMatches();
  });
  $("#studentForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const restoreButton = setButtonBusy(event.submitter, editingStudentId ? "Saving..." : "Creating...");
    try {
      await saveStudentForm(event.currentTarget);
    } catch (error) {
      showFeedback(error.message, "error");
    } finally {
      restoreButton();
    }
  });
  $("#uploadCvButton").addEventListener("click", async (event) => {
    const file = $("#cvFile")?.files?.[0];
    const restoreButton = setButtonBusy(event.currentTarget, "Uploading...");
    try {
      await uploadCvFile(file);
    } catch (error) {
      showFeedback(error.message, "error");
    } finally {
      restoreButton();
    }
  });
  $("#avatarFile").addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(png|jpeg|webp)$/)) {
      showFeedback("Use a PNG, JPG, or WebP profile photo.", "error");
      event.target.value = "";
      return;
    }
    const preview = $("#profileAvatarPreview");
    if (preview) preview.src = URL.createObjectURL(file);
  });
  $("#uploadAvatarButton").addEventListener("click", async (event) => {
    const restoreButton = setButtonBusy(event.currentTarget, "Uploading...");
    try {
      await uploadAvatarFile($("#avatarFile")?.files?.[0]);
    } catch (error) {
      showFeedback(error.message, "error");
    } finally {
      restoreButton();
    }
  });
  $("#parseCvButton").addEventListener("click", async (event) => {
    const file = $("#cvFile")?.files?.[0];
    const restoreButton = setButtonBusy(event.currentTarget, "Parsing...");
    try {
      await parseCvFile(file);
    } catch (error) {
      showFeedback(error.message, "error");
    } finally {
      restoreButton();
    }
  });
  $("#internshipSearch").addEventListener("input", (event) => {
    internshipSearchTerm = event.target.value.trim().toLowerCase();
    const globalSearch = $("#globalInternshipSearch");
    if (globalSearch && globalSearch.value !== event.target.value) globalSearch.value = event.target.value;
    renderStudentMatches();
  });
  $("#globalInternshipSearch").addEventListener("input", (event) => {
    internshipSearchTerm = event.target.value.trim().toLowerCase();
    const discoverySearch = $("#internshipSearch");
    if (discoverySearch && discoverySearch.value !== event.target.value) discoverySearch.value = event.target.value;
    renderStudentMatches();
  });
  $("#locationFilter").addEventListener("change", (event) => {
    activeLocationFilter = event.target.value;
    renderStudentMatches();
  });
  $("#thresholdFilter").addEventListener("change", (event) => {
    activeThresholdFilter = Number(event.target.value || 0);
    renderStudentMatches();
  });
  $("#statusFilter").addEventListener("change", (event) => {
    activeStatusFilter = event.target.value;
    renderStudentMatches();
  });
  $("#skillFilter").addEventListener("input", (event) => {
    activeSkillFilter = event.target.value.trim().toLowerCase();
    renderStudentMatches();
  });
  $("#categoryChips").addEventListener("click", (event) => {
    const button = event.target.closest(".filter-chip");
    if (!button) return;
    activeCategory = button.dataset.category;
    document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.toggle("is-active", chip === button));
    renderStudentMatches();
  });
  $("#searchModeSwitch").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    searchMode = button.dataset.mode;
    document.querySelectorAll("#searchModeSwitch button").forEach((item) => item.classList.toggle("is-active", item === button));
    renderStudentMatches();
  });
  $("#studentMatches").addEventListener("click", async (event) => {
    if (event.target.closest("#resetInternshipFilters")) {
      resetInternshipFilters();
      return;
    }
    const bookmarkButton = event.target.closest(".bookmark-action[data-bookmark-id]");
    if (bookmarkButton) {
      const saved = toggleSavedInternship(bookmarkButton.dataset.bookmarkId);
      bookmarkButton.classList.toggle("is-saved", saved);
      bookmarkButton.setAttribute("aria-pressed", String(saved));
      bookmarkButton.setAttribute("aria-label", `${saved ? "Remove" : "Save"} internship`);
      showFeedback(saved ? "Internship saved." : "Internship removed from saved jobs.", "success");
      return;
    }
    const detailButton = event.target.closest(".text-action[data-match-id]");
    if (detailButton) {
      navigateTo(`/student/matches/${detailButton.dataset.matchId}`);
      return;
    }
    const card = event.target.closest(".match-card[data-card-id]");
    if (card && !event.target.closest("button, a")) {
      navigateTo(`/student/matches/${card.dataset.cardId}`);
      return;
    }
    const button = event.target.closest(".apply-action");
    if (!button) return;
    await handleApplyAction(button);
  });
  $("#matchDetail").addEventListener("click", async (event) => {
    const button = event.target.closest(".apply-action");
    if (!button) return;
    await handleApplyAction(button);
  });
  $("#applicationTracker").addEventListener("click", (event) => {
    const item = event.target.closest(".timeline-item[data-application-id]");
    if (!item) return;
    navigateTo(`/student/applications/${item.dataset.applicationId}`);
  });
  $("#recruiterApplications").addEventListener("click", (event) => {
    const button = event.target.closest(".review-cv-action");
    if (!button) return;
    navigateTo(`/recruiter/applications/${button.dataset.applicationId}`);
  });
  $("#candidateMatches")?.addEventListener("click", (event) => {
    if (event.target.closest("#resetCandidateFilters")) {
      recruiterCandidateSkillFilter = "";
      recruiterCandidateLocationFilter = "all";
      recruiterCandidateScoreFilter = 0;
      $("#candidateSkillFilter").value = "";
      $("#candidateScoreFilter").value = "0";
      renderCandidateMatches();
      return;
    }
    const candidate = event.target.closest("[data-view-candidate], .candidate-card[data-candidate-id]");
    if (candidate && !event.target.closest(".review-cv-action")) {
      activeCandidateId = candidate.dataset.viewCandidate || candidate.dataset.candidateId;
      renderCandidateMatches();
    }
    const cvButton = event.target.closest(".review-cv-action[data-application-id]");
    if (cvButton) navigateTo(`/recruiter/applications/${cvButton.dataset.applicationId}`);
  });
  $("#recruiterPostingCards")?.addEventListener("click", (event) => {
    const id = event.target.closest("[data-select-posting], [data-edit-posting]")?.dataset.selectPosting || event.target.closest("[data-select-posting], [data-edit-posting]")?.dataset.editPosting;
    if (!id) return;
    $("#internshipSelect").value = id;
    fillInternshipForm(internships.find((item) => item.id === id));
    document.getElementById("recruiterPostingsSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
    renderCandidateMatches();
  });
  $("#recruiterAttention")?.addEventListener("click", (event) => {
    const target = event.target.closest("[data-scroll-target]")?.dataset.scrollTarget;
    if (target) document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#createPostingButton")?.addEventListener("click", () => {
    prepareNewInternship();
    document.getElementById("recruiterPostingsSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#viewAllPostings")?.addEventListener("click", () => document.getElementById("recruiterPostingsSection")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  $("#hiringPipeline").addEventListener("click", (event) => {
    const card = event.target.closest(".kanban-card[data-application-id]");
    if (!card) return;
    navigateTo(`/recruiter/applications/${card.dataset.applicationId}`);
  });
  $("#recruiterApplications").addEventListener("change", async (event) => {
    if (!event.target.matches(".status-select")) return;
    const restoreControl = setControlBusy(event.target);
    try {
      await updateApplicationStatus(event.target.dataset.applicationId, event.target.value);
    } catch (error) {
      showFeedback(error.message, "error");
    } finally {
      restoreControl();
    }
  });
  $("#recruiterNotesForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!activeReviewApplicationId) {
      showFeedback("Select an application before saving notes.", "error");
      return;
    }
    const restoreButton = setButtonBusy(event.submitter, "Saving...");
    try {
      await saveRecruiterNotes(activeReviewApplicationId, $("#recruiterNotesInput").value.trim());
    } catch (error) {
      showFeedback(error.message, "error");
    } finally {
      restoreButton();
    }
  });
  document.body.addEventListener("click", async (event) => {
    const notificationsRoot = $("#headerNotifications");
    const toggleButton = event.target.closest("#notificationToggle");
    if (toggleButton) {
      setNotificationsOpen(!notificationsOpen);
      return;
    }
    if (notificationsOpen && notificationsRoot && !event.target.closest("#headerNotifications")) {
      setNotificationsOpen(false);
    }
    if (accountMenuOpen && !event.target.closest("#accountMenu")) setAccountMenuOpen(false);
    const button = event.target.closest(".notification-action[data-notification-id]");
    if (!button || button.disabled) return;
    const restoreButton = setButtonBusy(button, "Updating...");
    try {
      await markNotificationRead(button.dataset.notificationId);
    } catch (error) {
      showFeedback(error.message, "error");
    } finally {
      restoreButton();
    }
  });
  $("#internshipForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const restoreButton = setButtonBusy(event.submitter, editingInternshipId ? "Saving..." : "Creating...");
    try {
      await saveInternshipForm(event.currentTarget);
    } catch (error) {
      showFeedback(error.message, "error");
    } finally {
      restoreButton();
    }
  });
  $("#companyProfileForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentCompany?.id) return;
    const data = new FormData(event.currentTarget);
    const restoreButton = setButtonBusy(event.submitter, "Saving...");
    try {
      await api.updateCompany(currentCompany.id, {
        name: data.get("name").trim(), industry: data.get("industry").trim(), location: data.get("location").trim(),
        website: data.get("website").trim(), careerPage: data.get("careerPage").trim(), description: data.get("description").trim(),
      });
      await refreshAppState();
      showFeedback("Company profile saved.", "success");
    } catch (error) {
      showFeedback(error.message, "error");
    } finally {
      restoreButton();
    }
  });
  $("#newStudent").addEventListener("click", prepareNewStudent);
  $("#newInternship").addEventListener("click", prepareNewInternship);
  $("#resetData").addEventListener("click", async () => {
    const restoreButton = setButtonBusy($("#resetData"), "Refreshing...");
    try {
      await resetData();
      showFeedback("Data refreshed.", "success");
    } catch (error) {
      showFeedback(error.message, "error");
    } finally {
      restoreButton();
    }
  });
  $("#themeToggle").addEventListener("click", () => {
    applyTheme(document.body.classList.contains("dark") ? "light" : "dark");
  });
  $("#languageToggle").addEventListener("click", () => {
    window.toggleAppLanguage();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    setNotificationsOpen(false);
    setAccountMenuOpen(false);
    setAccountSettingsOpen(false);
  });
  window.addEventListener("popstate", () => {
    applyRoute();
    renderAll();
  });
}

async function initializeApp() {
  setAppLoading(true, "Starting application", "Checking your session and connecting to the backend.");
  try {
    currentLanguage = localStorage.getItem(LANGUAGE_KEY) || "en";
    applyTheme(localStorage.getItem(THEME_KEY) || "light");
    bindEvents();

    const hasToken = Boolean(localStorage.getItem("fhnwAuthToken"));
    if (hasToken) {
      try {
        const session = await api.me();
        if (session?.user) {
          currentUser = session.user;
          await refreshAppState();
        } else {
          clearAuthToken();
          currentUser = null;
          clearAppData();
        }
      } catch {
        clearAuthToken();
        currentUser = null;
        clearAppData();
      }
    } else {
      clearAppData();
    }

    applyRoute();
    applyLanguage();
    if (!currentUser) {
      showPublicShell();
    }
  } finally {
    setAppLoading(false);
  }
}

initializeApp().catch((error) => {
  console.error(error);
  setAppLoading(false);
  clearAppData();
  navigateTo("/login", { replace: true });
});
