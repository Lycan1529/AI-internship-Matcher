const STORAGE_KEY = "fhnwInternshipMatchData";
const THEME_KEY = "fhnwInternshipMatchTheme";

const defaultStudents = [
  {
    id: "s1",
    name: "Mira Keller",
    program: "BSc Business Information Technology",
    semester: 5,
    location: "Basel",
    languages: ["German", "English"],
    skills: ["Python", "SQL", "Power BI", "Data Analysis", "Sustainability"],
    interests: ["analytics", "sustainability", "consulting"],
    experience: ["FHNW analytics project", "Part-time business analyst"],
    cvSummary: "Business IT student with strong analytics, SQL, and sustainability reporting experience. Built a Power BI dashboard for a semester project and supported business analysis in a part-time role.",
    cvUrl: "mira-keller-cv.pdf",
    availability: "August 2026",
    mode: "Hybrid",
  },
  {
    id: "s2",
    name: "Jonas Meier",
    program: "BSc Computer Science",
    semester: 4,
    location: "Windisch",
    languages: ["German", "English", "French"],
    skills: ["React", "TypeScript", "Node.js", "UX", "Testing"],
    interests: ["software", "product", "healthtech"],
    experience: ["Product prototype studio", "Frontend student assistant"],
    cvSummary: "Frontend-focused student with React, TypeScript, testing, and UX project work. Comfortable translating business requirements into product prototypes.",
    cvUrl: "jonas-meier-cv.pdf",
    availability: "July 2026",
    mode: "Remote",
  },
  {
    id: "s3",
    name: "Lea Baumann",
    program: "BSc International Management",
    semester: 6,
    location: "Olten",
    languages: ["German", "English", "Spanish"],
    skills: ["Market Research", "CRM", "Excel", "Presentation", "Project Management"],
    interests: ["marketing", "sales", "mobility"],
    experience: ["CRM migration project", "Sales operations internship"],
    cvSummary: "International Management student with CRM, market research, sales operations, and presentation experience across multilingual teams.",
    cvUrl: "lea-baumann-cv.pdf",
    availability: "September 2026",
    mode: "On-site",
  },
];

const defaultInternships = [
  {
    id: "i1",
    company: "Novaterra Analytics",
    title: "Sustainability Data Intern",
    location: "Basel",
    mode: "Hybrid",
    status: "Pending review",
    required: ["Python", "SQL", "Data Analysis"],
    preferred: ["Power BI", "Sustainability", "Presentation"],
    interests: ["analytics", "sustainability"],
    starts: "August 2026",
    sourceName: "Company career page",
    sourceUrl: "https://example.com/novaterra/sustainability-data-intern",
    sourceType: "company_site",
    collectedAt: "2026-04-22 08:10",
    isActive: true,
    externalPostingId: "novaterra-2026-sdi",
    duplicateGroup: "sustainability-data-basel",
  },
  {
    id: "i2",
    company: "Medflow Digital",
    title: "Frontend Product Intern",
    location: "Zurich",
    mode: "Remote",
    status: "Approved",
    required: ["React", "TypeScript", "UX"],
    preferred: ["Node.js", "Testing", "Presentation"],
    interests: ["software", "product", "healthtech"],
    starts: "July 2026",
    sourceName: "LinkedIn",
    sourceUrl: "https://www.linkedin.com/jobs/view/frontend-product-intern-medflow-digital",
    sourceType: "job_board",
    collectedAt: "2026-04-22 08:20",
    isActive: true,
    externalPostingId: "li-medflow-frontend-2026",
    duplicateGroup: "frontend-product-zurich",
  },
  {
    id: "i3",
    company: "SwissMove Services",
    title: "Growth & CRM Intern",
    location: "Olten",
    mode: "On-site",
    status: "Pending review",
    required: ["CRM", "Excel", "Market Research"],
    preferred: ["Project Management", "Presentation", "SQL"],
    interests: ["marketing", "sales", "mobility"],
    starts: "September 2026",
    sourceName: "Indeed",
    sourceUrl: "https://www.indeed.com/viewjob?jk=swissmove-growth-crm",
    sourceType: "job_board",
    collectedAt: "2026-04-22 07:55",
    isActive: true,
    externalPostingId: "indeed-swissmove-crm-2026",
    duplicateGroup: "growth-crm-olten",
  },
  {
    id: "i4",
    company: "Helio Consult",
    title: "Digital Transformation Intern",
    location: "Bern",
    mode: "Hybrid",
    status: "Approved",
    required: ["Project Management", "Data Analysis", "Presentation"],
    preferred: ["Power BI", "UX", "Market Research"],
    interests: ["consulting", "analytics", "product"],
    starts: "August 2026",
    sourceName: "Glassdoor",
    sourceUrl: "https://www.glassdoor.com/job-listing/digital-transformation-intern-helio",
    sourceType: "job_board",
    collectedAt: "2026-04-21 19:40",
    isActive: true,
    externalPostingId: "gd-helio-dti-2026",
    duplicateGroup: "digital-transformation-bern",
  },
  {
    id: "i5",
    company: "Zurich FinAI Lab",
    title: "AI Business Analyst Intern",
    location: "Zurich",
    mode: "Hybrid",
    status: "Approved",
    required: ["AI", "Data Analysis", "Business Strategy"],
    preferred: ["Python", "Presentation", "Market Research"],
    interests: ["ai", "finance", "consulting"],
    starts: "August 2026",
    sourceName: "LinkedIn",
    sourceUrl: "https://www.linkedin.com/jobs/view/ai-business-analyst-intern-zurich-finai-lab",
    sourceType: "job_board",
    collectedAt: "2026-04-22 09:05",
    isActive: true,
    externalPostingId: "li-finai-analyst-2026",
    duplicateGroup: "ai-business-analyst-zurich",
  },
  {
    id: "i6",
    company: "Basel Pharma Insights",
    title: "Data Science Operations Intern",
    location: "Basel",
    mode: "On-site",
    status: "Approved",
    required: ["Python", "SQL", "Project Management"],
    preferred: ["Power BI", "Data Analysis", "Presentation"],
    interests: ["analytics", "healthtech", "operations"],
    starts: "September 2026",
    sourceName: "Company career page",
    sourceUrl: "https://example.com/basel-pharma-insights/careers/data-science-operations-intern",
    sourceType: "company_site",
    collectedAt: "2026-04-22 06:30",
    isActive: true,
    externalPostingId: "bpi-dso-2026",
    duplicateGroup: "data-science-operations-basel",
  },
  {
    id: "i7",
    company: "Alpine Consulting Group",
    title: "Business Technology Consulting Intern",
    location: "Zurich",
    mode: "Hybrid",
    status: "Pending review",
    required: ["Business Strategy", "Presentation", "Project Management"],
    preferred: ["Data Analysis", "Market Research", "CRM"],
    interests: ["consulting", "strategy", "analytics"],
    starts: "July 2026",
    sourceName: "Indeed",
    sourceUrl: "https://www.indeed.com/viewjob?jk=alpine-business-technology-consulting",
    sourceType: "job_board",
    collectedAt: "2026-04-20 14:15",
    isActive: true,
    externalPostingId: "indeed-alpine-btc-2026",
    duplicateGroup: "business-technology-consulting-zurich",
  },
  {
    id: "i8",
    company: "FinBridge Systems",
    title: "Product Analytics Intern",
    location: "Zurich",
    mode: "Remote",
    status: "Approved",
    required: ["SQL", "Excel", "Data Analysis"],
    preferred: ["UX", "Product", "Power BI"],
    interests: ["finance", "product", "analytics"],
    starts: "August 2026",
    sourceName: "Company career page",
    sourceUrl: "https://example.com/finbridge/jobs/product-analytics-intern",
    sourceType: "company_site",
    collectedAt: "2026-04-22 05:50",
    isActive: true,
    externalPostingId: "finbridge-product-analytics-2026",
    duplicateGroup: "product-analytics-zurich",
  },
  {
    id: "i9",
    company: "Swiss Retail Cloud",
    title: "CRM Automation Intern",
    location: "Olten",
    mode: "Hybrid",
    status: "Approved",
    required: ["CRM", "Excel", "AI"],
    preferred: ["Market Research", "Python", "Sales"],
    interests: ["marketing", "ai", "sales"],
    starts: "September 2026",
    sourceName: "Glassdoor",
    sourceUrl: "https://www.glassdoor.com/job-listing/crm-automation-intern-swiss-retail-cloud",
    sourceType: "job_board",
    collectedAt: "2026-04-21 11:25",
    isActive: true,
    externalPostingId: "gd-src-crm-automation-2026",
    duplicateGroup: "crm-automation-olten",
  },
  {
    id: "i10",
    company: "CivicTech Basel",
    title: "UX and Service Design Intern",
    location: "Basel",
    mode: "Hybrid",
    status: "Pending review",
    required: ["UX", "Market Research", "Presentation"],
    preferred: ["React", "Project Management", "Data Analysis"],
    interests: ["product", "public sector", "consulting"],
    starts: "August 2026",
    sourceName: "Company career page",
    sourceUrl: "https://example.com/civictech-basel/careers/ux-service-design-intern",
    sourceType: "company_site",
    collectedAt: "2026-04-22 08:45",
    isActive: true,
    externalPostingId: "civictech-ux-service-2026",
    duplicateGroup: "ux-service-design-basel",
  },
  {
    id: "i11",
    company: "Helvetic Robotics",
    title: "AI Process Automation Intern",
    location: "Windisch",
    mode: "On-site",
    status: "Approved",
    required: ["Python", "AI", "Project Management"],
    preferred: ["Testing", "Data Analysis", "Presentation"],
    interests: ["ai", "operations", "automation"],
    starts: "July 2026",
    sourceName: "LinkedIn",
    sourceUrl: "https://www.linkedin.com/jobs/view/ai-process-automation-intern-helvetic-robotics",
    sourceType: "job_board",
    collectedAt: "2026-04-22 09:12",
    isActive: true,
    externalPostingId: "li-helvetic-automation-2026",
    duplicateGroup: "ai-process-automation-windisch",
  },
  {
    id: "i12",
    company: "LakeSide Ventures",
    title: "Startup Growth Analytics Intern",
    location: "Zurich",
    mode: "Hybrid",
    status: "Approved",
    required: ["Market Research", "Excel", "Business Strategy"],
    preferred: ["CRM", "Presentation", "Data Analysis"],
    interests: ["startup", "finance", "marketing"],
    starts: "October 2026",
    sourceName: "Other public job board",
    sourceUrl: "https://example.com/public-jobs/lakeside-growth-analytics-intern",
    sourceType: "job_board",
    collectedAt: "2026-04-19 16:00",
    isActive: true,
    externalPostingId: "public-lakeside-growth-2026",
    duplicateGroup: "startup-growth-analytics-zurich",
  },
  {
    id: "i13",
    company: "Museum Basel",
    title: "Digital Archive and History Intern",
    location: "Basel",
    mode: "On-site",
    status: "Approved",
    required: ["Market Research", "Presentation", "Excel"],
    preferred: ["Project Management", "Data Analysis", "CRM"],
    interests: ["history", "culture", "archives"],
    starts: "August 2026",
    sourceName: "Company career page",
    sourceUrl: "https://example.com/museum-basel/digital-archive-history-intern",
    sourceType: "company_site",
    collectedAt: "2026-04-24 09:15",
    isActive: true,
    externalPostingId: "museum-basel-history-2026",
    duplicateGroup: "digital-archive-history-basel",
  },
  {
    id: "i14",
    company: "Swiss Heritage Lab",
    title: "Cultural Data and Exhibition Intern",
    location: "Bern",
    mode: "Hybrid",
    status: "Approved",
    required: ["Presentation", "Market Research", "Data Analysis"],
    preferred: ["UX", "Project Management", "Excel"],
    interests: ["history", "arts", "culture"],
    starts: "September 2026",
    sourceName: "Indeed",
    sourceUrl: "https://www.indeed.com/viewjob?jk=swiss-heritage-lab-exhibition-intern",
    sourceType: "job_board",
    collectedAt: "2026-04-24 08:45",
    isActive: true,
    externalPostingId: "indeed-heritage-exhibit-2026",
    duplicateGroup: "cultural-data-exhibition-bern",
  },
  {
    id: "i15",
    company: "AgriFuture Schweiz",
    title: "Smart Farming Innovation Intern",
    location: "Aarau",
    mode: "Hybrid",
    status: "Approved",
    required: ["AI", "Data Analysis", "Project Management"],
    preferred: ["Python", "Excel", "Business Strategy"],
    interests: ["agriculture", "sustainability", "innovation"],
    starts: "July 2026",
    sourceName: "LinkedIn",
    sourceUrl: "https://www.linkedin.com/jobs/view/smart-farming-innovation-intern-agrifuture",
    sourceType: "job_board",
    collectedAt: "2026-04-24 07:20",
    isActive: true,
    externalPostingId: "li-agrifuture-farming-2026",
    duplicateGroup: "smart-farming-aarau",
  },
  {
    id: "i16",
    company: "Rural Systems Coop",
    title: "Agricultural Operations Analytics Intern",
    location: "Lucerne",
    mode: "On-site",
    status: "Approved",
    required: ["Excel", "Data Analysis", "Presentation"],
    preferred: ["SQL", "Project Management", "AI"],
    interests: ["agriculture", "operations", "analytics"],
    starts: "August 2026",
    sourceName: "Glassdoor",
    sourceUrl: "https://www.glassdoor.com/job-listing/agricultural-operations-analytics-intern-rural-systems",
    sourceType: "job_board",
    collectedAt: "2026-04-23 17:05",
    isActive: true,
    externalPostingId: "gd-rural-ops-analytics-2026",
    duplicateGroup: "agri-operations-lucerne",
  },
  {
    id: "i17",
    company: "Studio Alpenlicht",
    title: "Creative Strategy and Media Intern",
    location: "Zurich",
    mode: "Hybrid",
    status: "Approved",
    required: ["Presentation", "Market Research", "Business Strategy"],
    preferred: ["UX", "CRM", "Project Management"],
    interests: ["arts", "media", "branding"],
    starts: "September 2026",
    sourceName: "Company career page",
    sourceUrl: "https://example.com/studio-alpenlicht/careers/creative-strategy-media-intern",
    sourceType: "company_site",
    collectedAt: "2026-04-24 10:00",
    isActive: true,
    externalPostingId: "alpenlicht-media-2026",
    duplicateGroup: "creative-strategy-zurich",
  },
  {
    id: "i18",
    company: "Swiss Public Media",
    title: "Audience Insights Intern",
    location: "Basel",
    mode: "Hybrid",
    status: "Approved",
    required: ["Data Analysis", "Excel", "Presentation"],
    preferred: ["SQL", "Market Research", "CRM"],
    interests: ["media", "public sector", "analytics"],
    starts: "October 2026",
    sourceName: "Other public job board",
    sourceUrl: "https://example.com/public-jobs/swiss-public-media-audience-insights",
    sourceType: "job_board",
    collectedAt: "2026-04-24 06:55",
    isActive: true,
    externalPostingId: "public-media-audience-2026",
    duplicateGroup: "audience-insights-basel",
  },
  {
    id: "i19",
    company: "Urban Garden Network",
    title: "Community Agriculture Program Intern",
    location: "Zurich",
    mode: "On-site",
    status: "Approved",
    required: ["Project Management", "Presentation", "Market Research"],
    preferred: ["Excel", "CRM", "Business Strategy"],
    interests: ["agriculture", "community", "sustainability"],
    starts: "July 2026",
    sourceName: "Company career page",
    sourceUrl: "https://example.com/urban-garden-network/program-intern",
    sourceType: "company_site",
    collectedAt: "2026-04-23 15:30",
    isActive: true,
    externalPostingId: "ugn-program-2026",
    duplicateGroup: "community-agriculture-zurich",
  },
  {
    id: "i20",
    company: "Cantonal Archive Zurich",
    title: "Research and Cataloguing Intern",
    location: "Zurich",
    mode: "On-site",
    status: "Approved",
    required: ["Market Research", "Excel", "Presentation"],
    preferred: ["Data Analysis", "Project Management", "UX"],
    interests: ["history", "archives", "public sector"],
    starts: "August 2026",
    sourceName: "Company career page",
    sourceUrl: "https://example.com/cantonal-archive-zurich/research-cataloguing-intern",
    sourceType: "company_site",
    collectedAt: "2026-04-24 09:45",
    isActive: true,
    externalPostingId: "archive-zurich-research-2026",
    duplicateGroup: "research-cataloguing-zurich",
  },
  {
    id: "i21",
    company: "Green Valley Foods",
    title: "Food Systems and Sustainability Intern",
    location: "St. Gallen",
    mode: "Hybrid",
    status: "Approved",
    required: ["Data Analysis", "Business Strategy", "Presentation"],
    preferred: ["Excel", "Project Management", "AI"],
    interests: ["agriculture", "food", "sustainability"],
    starts: "September 2026",
    sourceName: "Indeed",
    sourceUrl: "https://www.indeed.com/viewjob?jk=green-valley-food-systems-intern",
    sourceType: "job_board",
    collectedAt: "2026-04-24 08:25",
    isActive: true,
    externalPostingId: "indeed-green-valley-food-2026",
    duplicateGroup: "food-systems-stgallen",
  },
  {
    id: "i22",
    company: "Festival Luzern",
    title: "Arts Operations and Partnerships Intern",
    location: "Lucerne",
    mode: "Hybrid",
    status: "Approved",
    required: ["Project Management", "Presentation", "CRM"],
    preferred: ["Market Research", "Business Strategy", "Excel"],
    interests: ["arts", "events", "partnerships"],
    starts: "July 2026",
    sourceName: "Glassdoor",
    sourceUrl: "https://www.glassdoor.com/job-listing/arts-operations-partnerships-intern-festival-luzern",
    sourceType: "job_board",
    collectedAt: "2026-04-23 18:20",
    isActive: true,
    externalPostingId: "gd-festival-luzern-arts-2026",
    duplicateGroup: "arts-operations-lucerne",
  },
  {
    id: "i23",
    company: "Heritage Mapping Collective",
    title: "Museum Technology and Mapping Intern",
    location: "Basel",
    mode: "Hybrid",
    status: "Approved",
    required: ["UX", "Data Analysis", "Presentation"],
    preferred: ["React", "Market Research", "Project Management"],
    interests: ["history", "technology", "museums"],
    starts: "October 2026",
    sourceName: "LinkedIn",
    sourceUrl: "https://www.linkedin.com/jobs/view/museum-technology-mapping-intern",
    sourceType: "job_board",
    collectedAt: "2026-04-24 10:40",
    isActive: true,
    externalPostingId: "li-heritage-mapping-2026",
    duplicateGroup: "museum-technology-basel",
  },
  {
    id: "i24",
    company: "Alpine Climate Fields",
    title: "Environmental Field Data Intern",
    location: "Chur",
    mode: "On-site",
    status: "Approved",
    required: ["Data Analysis", "Excel", "Project Management"],
    preferred: ["Python", "AI", "Presentation"],
    interests: ["agriculture", "environment", "field research"],
    starts: "August 2026",
    sourceName: "Other public job board",
    sourceUrl: "https://example.com/public-jobs/environmental-field-data-intern",
    sourceType: "job_board",
    collectedAt: "2026-04-24 05:40",
    isActive: true,
    externalPostingId: "public-climate-fields-2026",
    duplicateGroup: "environmental-field-chur",
  },
];

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
  Presentation: ["Course: Executive storytelling", "Project: pitch deck for FHNW demo"],
};

let students = [];
let internships = [];
let applications = [];
let notifications = [];
let editingStudentId = null;
let editingInternshipId = null;
let activeReviewApplicationId = null;
let internshipSearchTerm = "";
let activeCategory = "all";
let searchMode = "recommended";

const $ = (selector) => document.querySelector(selector);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadData() {
  const fallback = {
    students: clone(defaultStudents),
    internships: clone(defaultInternships),
    applications: [],
    notifications: [],
  };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || !Array.isArray(saved.students) || !Array.isArray(saved.internships)) return fallback;
    return {
      students: saved.students.map((student) => ({
        experience: ["FHNW project work", "Part-time role"],
        cvSummary: "FHNW student profile with project work, skill evidence, and internship readiness signals.",
        cvUrl: `${normalized(student.name || "student").replaceAll(" ", "-")}-cv.pdf`,
        ...student,
      })),
      internships: mergeDefaultInternships(saved.internships),
      applications: Array.isArray(saved.applications) ? saved.applications : [],
      notifications: Array.isArray(saved.notifications) ? saved.notifications : [],
    };
  } catch {
    return fallback;
  }
}

function mergeDefaultInternships(savedInternships) {
  const ids = new Set(savedInternships.map((internship) => internship.id));
  return [
    ...savedInternships.map(withSourceDefaults),
    ...defaultInternships.filter((internship) => !ids.has(internship.id)),
  ];
}

function withSourceDefaults(internship) {
  return {
    sourceName: "Company career page",
    sourceUrl: `https://example.com/jobs/${internship.id}`,
    sourceType: "company_site",
    collectedAt: "2026-04-22 08:00",
    isActive: true,
    externalPostingId: `ext-${internship.id}`,
    duplicateGroup: internship.id,
    ...internship,
  };
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

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ students, internships, applications, notifications }));
}

function resetData() {
  students = clone(defaultStudents);
  internships = clone(defaultInternships);
  applications = [];
  notifications = [];
  saveData();
  renderAll();
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
  $("#studentSubmit").textContent = "Create student";
}

function prepareNewInternship() {
  editingInternshipId = null;
  $("#internshipForm").reset();
  $("#internshipSubmit").textContent = "Create internship";
}

function applyTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  $("#themeToggle").textContent = theme === "dark" ? "Light mode" : "Dark mode";
  localStorage.setItem(THEME_KEY, theme);
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

  const skillScore = exactRequired.length * 18 + exactPreferred.length * 9 + related.length * 5;
  const contextScore = interestOverlap.length * 8 + locationFit * 8 + modeFit * 5 + startFit * 4;
  const score = Math.min(98, Math.round(skillScore + contextScore));

  return { score, exactRequired, exactPreferred, related, missing, interestOverlap, locationFit, modeFit, startFit };
}

function tagList(items) {
  return `<div class="tag-row">${items.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("")}</div>`;
}

function renderStudentProfile(student) {
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
  const strongest = [...result.exactRequired, ...result.exactPreferred].slice(0, 3);
  const fitParts = [];
  if (strongest.length) fitParts.push(`matches ${strongest.join(", ")}`);
  if (result.interestOverlap.length) fitParts.push(`aligns with ${result.interestOverlap.join(" and ")}`);
  if (result.locationFit) fitParts.push(`fits the ${student.location} location preference`);
  if (result.modeFit) fitParts.push(`supports ${student.mode.toLowerCase()} work`);
  return `This recommendation ${fitParts.join(", ")}. ${result.missing.length ? `Main growth area: ${result.missing.join(", ")}.` : "All required skills are covered."}`;
}

function matchCard(primary, secondary, result, details) {
  return `
    <article class="match-card">
      <div>
        <h3>${escapeHtml(primary)}</h3>
        <p class="meta">${escapeHtml(secondary)}</p>
        ${details.source || ""}
        <p class="explain">${escapeHtml(details.explain)}</p>
        <div class="match-details">
          ${details.good.map((item) => `<span class="detail good">${escapeHtml(item)}</span>`).join("")}
          ${details.missing.map((item) => `<span class="detail missing">${escapeHtml(item)}</span>`).join("")}
        </div>
        ${details.action || ""}
      </div>
      <div class="score"><strong>${result.score}%</strong><span>match</span></div>
    </article>
  `;
}

function getApplication(studentId, internshipId) {
  return applications.find((application) => application.studentId === studentId && application.internshipId === internshipId);
}

function selectedStudent() {
  return students.find((student) => student.id === $("#studentSelect").value);
}

function createNotification(target, message, type = "Application") {
  notifications.unshift({
    id: `n${Date.now()}${Math.random().toString(16).slice(2)}`,
    target,
    message,
    type,
    isRead: false,
    createdAt: new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
  });
}

function applyForInternship(internshipId) {
  const student = selectedStudent();
  const internship = internships.find((item) => item.id === internshipId);
  if (!student || !internship || getApplication(student.id, internship.id)) return;

  applications.unshift({
    id: `a${Date.now()}`,
    studentId: student.id,
    internshipId: internship.id,
    date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    status: "Applied",
    notes: "Application submitted from student dashboard.",
  });
  createNotification(student.id, `Application submitted for ${internship.title}.`, "application_submitted");
  createNotification("recruiter", `${student.name} applied for ${internship.title}.`, "application_submitted");
  saveData();
  renderAll({ studentId: student.id, internshipId: internship.id });
}

function updateApplicationStatus(applicationId, status) {
  const application = applications.find((item) => item.id === applicationId);
  if (!application) return;
  application.status = status;
  const student = students.find((item) => item.id === application.studentId);
  const internship = internships.find((item) => item.id === application.internshipId);
  if (student && internship) {
    createNotification(student.id, `${internship.title} status updated to ${status}.`, "application_status_updated");
  }
  saveData();
  renderAll();
}

function reviewApplication(applicationId) {
  activeReviewApplicationId = applicationId;
  renderCvReview(applicationId);
  renderCandidateMatches();
}

function renderStudentMatches(options = {}) {
  const storedStudent = students.find((item) => item.id === $("#studentSelect").value);
  const student = options.live ? studentFromForm(storedStudent) : storedStudent;
  if (!student) return;
  if (!options.live) renderStudentProfile(student);
  const ranked = internships
    .filter((internship) =>
      internshipMatchesCategory(internship) &&
      (!internshipSearchTerm || internshipSearchText(internship).includes(internshipSearchTerm)),
    )
    .map((internship) => ({ internship, result: calculateMatch(student, internship) }))
    .sort((a, b) => b.result.score - a.result.score);

  const visible = searchMode === "search" ? ranked : ranked.slice(0, 10);

  $("#bestMatchScore").textContent = `${visible[0]?.result.score || 0}%`;
  renderLiveAiPanel(student, visible, Boolean(options.live));
  $("#studentMatches").innerHTML = visible
    .map(({ internship, result }) => {
      const application = getApplication(student.id, internship.id);
      return matchCard(internship.title, `${internship.company} - ${internship.location} - ${internship.mode}`, result, {
        explain: explanation(student, internship, result),
        good: [...result.exactRequired, ...result.exactPreferred].slice(0, 5),
        missing: result.missing.map((skill) => `Learn ${skill}`),
        source: sourceBlock(internship),
        action: options.live
          ? `<div class="action-row"><span class="status">Preview only</span></div>`
          : `<div class="action-row">
              <a class="posting-link" href="${escapeHtml(internship.sourceUrl)}" target="_blank" rel="noopener">Open Original Posting</a>
              <button class="apply-action" data-internship-id="${escapeHtml(internship.id)}" type="button" ${application ? "disabled" : ""}>${application ? `Applied: ${escapeHtml(application.status)}` : "Apply now"}</button>
              <span>${application ? `Submitted ${escapeHtml(application.date)}` : "One-click prototype application"}</span>
            </div>`,
      });
    })
    .join("");
  renderSkillGap(student, visible);
  renderApplicationTracker(ranked);
}

function renderCandidateMatches() {
  const internship = internships.find((item) => item.id === $("#internshipSelect").value);
  if (!internship) return;
  renderInternshipProfile(internship);
  const ranked = students
    .map((student) => ({ student, result: calculateMatch(student, internship) }))
    .sort((a, b) => b.result.score - a.result.score);

  $("#candidateMatches").innerHTML = ranked
    .map(({ student, result }) =>
      matchCard(student.name, `${student.program} - ${student.location} - Available ${student.availability}`, result, {
        explain: explanation(student, internship, result),
        good: [...result.exactRequired, ...result.exactPreferred].slice(0, 5),
        missing: result.missing.map((skill) => `Missing ${skill}`),
        source: sourceBlock(internship),
      }),
    )
    .join("");
  renderCandidateSummary(internship, ranked[0]);
  renderHiringPipeline(ranked);
  renderRecruiterApplications(internship);
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
  $("#applicationTracker").innerHTML = studentApplications.length
    ? `
      <div class="timeline">
        ${studentApplications
          .map((application) => {
            const internship = internships.find((item) => item.id === application.internshipId);
            return `
              <div class="timeline-item">
                <div><strong>${escapeHtml(internship?.title || "Deleted internship")}</strong><span class="meta">${escapeHtml(internship?.company || "Unknown company")} - submitted ${escapeHtml(application.date)}</span></div>
                <span class="status">${escapeHtml(application.status)}</span>
              </div>
            `;
          })
          .join("")}
      </div>
    `
    : `<div class="timeline-item"><div><strong>No applications yet</strong><span class="meta">Use Apply now on a top match to start the workflow.</span></div><span class="status">Ready</span></div>`;
}

function renderCandidateSummary(internship, topMatch) {
  if (!topMatch) return;
  const { student, result } = topMatch;
  $("#candidateSummary").innerHTML = `
    <h3>${escapeHtml(student.name)}</h3>
    <p class="meta">${escapeHtml(student.program)} - ${escapeHtml(student.location)} - ${result.score}% match</p>
    ${tagList([...result.exactRequired, ...result.exactPreferred].slice(0, 5))}
    <p class="explain">AI summary: Strong candidate for ${escapeHtml(internship.title)} because the profile shows ${escapeHtml(result.exactRequired.join(", ") || "adjacent capabilities")} and relevant FHNW project experience. Interview focus should validate ${escapeHtml(result.missing.join(", ") || "team fit and motivation")}.</p>
  `;
}

function renderHiringPipeline(rankedMatches) {
  const statusGroups = ["Applied", "Interview", "Offer"];
  const columns = statusGroups.map((status) => [
    status,
    applications.filter((application) => application.status === status).slice(0, 4),
  ]);
  $("#hiringPipeline").innerHTML = columns
    .map(
      ([title, items]) => `
        <div class="kanban-column">
          <strong>${title}</strong>
          ${items
            .map((application) => {
              const student = students.find((item) => item.id === application.studentId);
              const internship = internships.find((item) => item.id === application.internshipId);
              const result = student && internship ? calculateMatch(student, internship) : { score: 0 };
              return `
                <div class="kanban-card">
                  <strong>${escapeHtml(student?.name || "Unknown student")}</strong>
                  <p class="meta">${result.score}% match - ${escapeHtml(internship?.title || "Unknown role")}</p>
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
          return `
            <div class="application-review ${activeReviewApplicationId === application.id ? "is-selected" : ""}">
              <div>
                <strong>${escapeHtml(student?.name || "Unknown student")}</strong>
                <span class="meta">${escapeHtml(student?.program || "Profile unavailable")} - submitted ${escapeHtml(application.date)}</span>
              </div>
              <button class="review-cv-action" data-application-id="${escapeHtml(application.id)}" type="button">Review CV</button>
              <select class="status-select" data-application-id="${escapeHtml(application.id)}" aria-label="Update application status">
                ${applicationStatuses.map((status) => `<option value="${status}" ${application.status === status ? "selected" : ""}>${status}</option>`).join("")}
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
    return;
  }

  const result = calculateMatch(student, internship);
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
        <strong>${escapeHtml(student.cvUrl)}</strong>
        <p class="meta">${escapeHtml(student.cvSummary)}</p>
      </div>
      <div>
        <span class="cv-label">Application</span>
        <strong>${escapeHtml(application.status)}</strong>
        <p class="meta">Submitted ${escapeHtml(application.date)} for ${escapeHtml(internship.title)}.</p>
      </div>
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
  `;
}

function renderAdmin() {
  const allScores = students.flatMap((student) => internships.map((internship) => calculateMatch(student, internship).score));
  const average = allScores.length ? Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length) : 0;
  const demand = internships
    .flatMap((internship) => internship.required)
    .reduce((acc, skill) => ({ ...acc, [skill]: (acc[skill] || 0) + 1 }), {});

  $("#studentCount").textContent = students.length;
  $("#internshipCount").textContent = internships.length;
  $("#applicationCount").textContent = applications.length;
  $("#notificationCount").textContent = notifications.length;
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
    .join("");
  const defaultNotifications = [
    { type: "New AI match", message: "3 FHNW students now match Zurich and Basel AI roles above 80%.", createdAt: "System" },
    { type: "Aggregation run", message: "Job-board and company-site connectors normalized the latest internship records.", createdAt: "Planned" },
    { type: "Deduplication", message: "Overlapping postings are grouped before recommendation scoring.", createdAt: "Planned" },
    { type: "Multilingual", message: "Interface concept supports English and German for Swiss recruiters.", createdAt: "Planned" },
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
    .join("");
}

function renderAggregationAnalytics() {
  const sourceCounts = internships.reduce((acc, internship) => {
    acc[internship.sourceName] = (acc[internship.sourceName] || 0) + 1;
    return acc;
  }, {});
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
    .join("");

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

function saveStudentForm(form) {
  const data = new FormData(form);
  const student = {
    id: editingStudentId || `s${Date.now()}`,
    name: data.get("name").trim(),
    program: data.get("program").trim(),
    semester: Number(data.get("semester")),
    location: data.get("location").trim(),
    languages: listFromInput(data.get("languages")),
    skills: listFromInput(data.get("skills")),
    interests: listFromInput(data.get("interests")).map(normalized),
    experience: ["FHNW semester project", "Business IT portfolio case"],
    cvSummary: "New FHNW profile with Business IT project experience, skill evidence, and internship motivation.",
    cvUrl: `${normalized(data.get("name").trim() || "student").replaceAll(" ", "-")}-cv.pdf`,
    availability: data.get("availability").trim(),
    mode: data.get("mode"),
  };

  if (editingStudentId) {
    students = students.map((item) => (item.id === editingStudentId ? student : item));
  } else {
    students.push(student);
  }
  editingStudentId = student.id;
  saveData();
  renderAll({ studentId: student.id });
}

function saveInternshipForm(form) {
  const data = new FormData(form);
  const internship = {
    id: editingInternshipId || `i${Date.now()}`,
    company: data.get("company").trim(),
    title: data.get("title").trim(),
    location: data.get("location").trim(),
    mode: data.get("mode"),
    status: "Pending review",
    required: listFromInput(data.get("required")),
    preferred: listFromInput(data.get("preferred")),
    interests: listFromInput(data.get("interests")).map(normalized),
    starts: data.get("starts").trim(),
    sourceName: "Company career page",
    sourceUrl: `https://example.com/${normalized(data.get("company").trim() || "company").replaceAll(" ", "-")}/${normalized(data.get("title").trim() || "internship").replaceAll(" ", "-")}`,
    sourceType: "company_site",
    collectedAt: new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
    isActive: true,
    externalPostingId: `manual-${Date.now()}`,
    duplicateGroup: normalized(`${data.get("title")} ${data.get("location")}`).replaceAll(" ", "-"),
  };

  if (editingInternshipId) {
    internships = internships.map((item) => (item.id === editingInternshipId ? internship : item));
  } else {
    internships.push(internship);
  }
  editingInternshipId = internship.id;
  saveData();
  renderAll({ internshipId: internship.id });
}

function populateSelects() {
  const selectedStudent = $("#studentSelect").value || students[0]?.id;
  const selectedInternship = $("#internshipSelect").value || internships[0]?.id;
  $("#studentSelect").innerHTML = students.map((student) => `<option value="${escapeHtml(student.id)}">${escapeHtml(student.name)}</option>`).join("");
  $("#internshipSelect").innerHTML = internships.map((internship) => `<option value="${escapeHtml(internship.id)}">${escapeHtml(internship.title)}</option>`).join("");
  $("#studentSelect").value = students.some((student) => student.id === selectedStudent) ? selectedStudent : students[0]?.id;
  $("#internshipSelect").value = internships.some((internship) => internship.id === selectedInternship) ? selectedInternship : internships[0]?.id;
}

function renderAll(selection = {}) {
  populateSelects();
  if (selection.studentId) $("#studentSelect").value = selection.studentId;
  if (selection.internshipId) $("#internshipSelect").value = selection.internshipId;
  renderStudentMatches();
  renderCandidateMatches();
  renderAdmin();
  fillStudentForm(students.find((item) => item.id === $("#studentSelect").value));
  fillInternshipForm(internships.find((item) => item.id === $("#internshipSelect").value));
}

function bindEvents() {
  document.querySelectorAll(".side-nav button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".side-nav button").forEach((item) => item.classList.remove("is-active"));
      document.querySelectorAll(".dashboard-view").forEach((view) => view.classList.remove("is-visible"));
      button.classList.add("is-active");
      $(`#${button.dataset.view}`).classList.add("is-visible");
    });
  });
  $("#studentSelect").addEventListener("change", () => {
    renderStudentMatches();
    fillStudentForm(students.find((item) => item.id === $("#studentSelect").value));
  });
  $("#studentForm").addEventListener("input", () => {
    if (!editingStudentId) return;
    renderStudentMatches({ live: true });
  });
  $("#internshipSelect").addEventListener("change", () => {
    renderCandidateMatches();
    fillInternshipForm(internships.find((item) => item.id === $("#internshipSelect").value));
  });
  $("#studentForm").addEventListener("submit", (event) => {
    event.preventDefault();
    saveStudentForm(event.currentTarget);
  });
  $("#internshipSearch").addEventListener("input", (event) => {
    internshipSearchTerm = event.target.value.trim().toLowerCase();
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
  $("#studentMatches").addEventListener("click", (event) => {
    const button = event.target.closest(".apply-action");
    if (!button) return;
    applyForInternship(button.dataset.internshipId);
  });
  $("#recruiterApplications").addEventListener("click", (event) => {
    const button = event.target.closest(".review-cv-action");
    if (!button) return;
    reviewApplication(button.dataset.applicationId);
  });
  $("#recruiterApplications").addEventListener("change", (event) => {
    if (!event.target.matches(".status-select")) return;
    updateApplicationStatus(event.target.dataset.applicationId, event.target.value);
  });
  $("#internshipForm").addEventListener("submit", (event) => {
    event.preventDefault();
    saveInternshipForm(event.currentTarget);
  });
  $("#newStudent").addEventListener("click", prepareNewStudent);
  $("#newInternship").addEventListener("click", prepareNewInternship);
  $("#resetData").addEventListener("click", resetData);
  $("#themeToggle").addEventListener("click", () => {
    applyTheme(document.body.classList.contains("dark") ? "light" : "dark");
  });
}

const initialData = loadData();
students = initialData.students;
internships = initialData.internships;
applications = initialData.applications;
notifications = initialData.notifications;

applyTheme(localStorage.getItem(THEME_KEY) || "light");
bindEvents();
renderAll();
